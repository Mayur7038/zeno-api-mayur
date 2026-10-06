import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { User } from '../entities/user.entity';
import { OtpVerification } from '../entities/otp-verification.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { TenantSeederService } from '../../tenancy/services/tenant-seeder.service';
import {
  SignupDto,
  VerifyOtpDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { OtpPurpose } from '../../../common/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OtpVerification)
    private otpRepository: Repository<OtpVerification>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tenantSeeder: TenantSeederService,
    private dataSource: DataSource,
  ) {}

  /**
   * 1. Email OTP Signup
   */
  async signup(dto: SignupDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing && existing.isEmailVerified) {
      throw new BadRequestException('User with this email already exists and is active');
    }

    // Check resend cooldown
    const latestOtp = await this.otpRepository.findOne({
      where: { email: dto.email.toLowerCase(), purpose: OtpPurpose.SIGNUP, isConsumed: false },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    if (latestOtp && latestOtp.resendAvailableAt > now) {
      const waitSeconds = Math.ceil((latestOtp.resendAvailableAt.getTime() - now.getTime()) / 1000);
      throw new BadRequestException(`Please wait ${waitSeconds} seconds before requesting a new OTP`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const otpRecord = this.otpRepository.create({
      email: dto.email.toLowerCase(),
      otpHash,
      purpose: OtpPurpose.SIGNUP,
      attemptsCount: 0,
      maxAttempts: 3,
      resendAvailableAt: new Date(Date.now() + 60 * 1000), // 60s cooldown
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins expiry
      isConsumed: false,
      payload: {
        fullName: dto.fullName,
        companyName: dto.companyName,
        passwordHash,
        gstin: dto.gstin,
        stateCode: dto.stateCode,
        stateName: dto.stateName,
      },
    });

    await this.otpRepository.save(otpRecord);

    // In production, send via SendGrid/SES/SMTP. For development/testing, output prominently to console.
    this.logger.log(`========================================`);
    this.logger.log(`[EMAIL OTP SIGNUP] To: ${dto.email} | OTP: ${otp}`);
    this.logger.log(`========================================`);

    return {
      success: true,
      message: 'Verification OTP sent to your email',
      email: dto.email,
      cooldownSeconds: 60,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * 2. Verify Email OTP & Provision Tenant + Company + Masters
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase();
    const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');

    const otpRecord = await this.otpRepository.findOne({
      where: { email, purpose: OtpPurpose.SIGNUP, isConsumed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP request found for this email');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    if (otpRecord.attemptsCount >= otpRecord.maxAttempts) {
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP');
    }

    if (otpRecord.otpHash !== otpHash) {
      otpRecord.attemptsCount += 1;
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException(
        `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attemptsCount} attempts remaining`,
      );
    }

    // OTP Validated! Execute complete tenant provisioning inside an atomic transaction
    return await this.dataSource.transaction(async (manager) => {
      otpRecord.isConsumed = true;
      await manager.save(OtpVerification, otpRecord);

      const payload = otpRecord.payload;
      const tenantSlug = payload.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

      // Create Tenant
      const tenant = manager.create(Tenant, {
        name: payload.companyName,
        slug: tenantSlug,
        isActive: true,
      });
      await manager.save(Tenant, tenant);

      // Create or update User
      let user = await manager.findOne(User, { where: { email } });
      if (!user) {
        user = manager.create(User, {
          email,
          fullName: payload.fullName,
          passwordHash: payload.passwordHash,
          isEmailVerified: true,
          isActive: true,
        });
      } else {
        user.fullName = payload.fullName;
        user.passwordHash = payload.passwordHash;
        user.isEmailVerified = true;
        user.isActive = true;
      }
      await manager.save(User, user);

      // Provision company, branch, godown, roles, permissions, tally ledger groups, default ledgers
      const { company, branch, role } = await this.tenantSeeder.provisionTenantWithDefaults(
        manager,
        tenant,
        {
          legalName: payload.companyName,
          gstin: payload.gstin,
          stateCode: payload.stateCode,
          stateName: payload.stateName,
        },
        user,
      );

      // Re-fetch populated user
      const fullUser = await manager.findOne(User, {
        where: { id: user.id },
        relations: ['role', 'role.permissions', 'branchAccess', 'tenant'],
      });

      const tokens = this.generateTokens(fullUser);

      return {
        success: true,
        message: 'Account verified and enterprise tenant provisioned successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        company: {
          id: company.id,
          legalName: company.legalName,
        },
        branch: {
          id: branch.id,
          branchName: branch.branchName,
          stateCode: branch.stateCode,
        },
        user: {
          id: fullUser.id,
          email: fullUser.email,
          fullName: fullUser.fullName,
          role: role.name,
        },
        ...tokens,
      };
    });
  }

  /**
   * 3. Login
   */
  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .leftJoinAndSelect('user.branchAccess', 'branchAccess')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified. Please complete signup verification');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact support');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        role: user.role?.name,
        permissions: user.role?.permissions || [],
        branches: user.branchAccess || [],
      },
      ...tokens,
    };
  }

  /**
   * 4. Forgot Password - Send OTP
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Return benign success message to prevent user enumeration
      return {
        success: true,
        message: 'If the email exists in our system, an OTP has been dispatched',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const otpRecord = this.otpRepository.create({
      email: user.email,
      otpHash,
      purpose: OtpPurpose.FORGOT_PASSWORD,
      attemptsCount: 0,
      maxAttempts: 3,
      resendAvailableAt: new Date(Date.now() + 60 * 1000),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      isConsumed: false,
    });
    await this.otpRepository.save(otpRecord);

    this.logger.log(`========================================`);
    this.logger.log(`[FORGOT PASSWORD OTP] To: ${user.email} | OTP: ${otp}`);
    this.logger.log(`========================================`);

    return {
      success: true,
      message: 'Password reset OTP sent to your email',
      cooldownSeconds: 60,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * 5. Reset Password with OTP
   */
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');

    const otpRecord = await this.otpRepository.findOne({
      where: { email, purpose: OtpPurpose.FORGOT_PASSWORD, isConsumed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active password reset request found');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    if (otpRecord.attemptsCount >= otpRecord.maxAttempts) {
      throw new BadRequestException('Maximum attempts exceeded');
    }

    if (otpRecord.otpHash !== otpHash) {
      otpRecord.attemptsCount += 1;
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException('Invalid OTP');
    }

    otpRecord.isConsumed = true;
    await this.otpRepository.save(otpRecord);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.update({ email }, { passwordHash });

    return {
      success: true,
      message: 'Password has been successfully updated. You may now log in.',
    };
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'zeno_super_secret_jwt_key_2026_enterprise_books'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'zeno_refresh_secret_key_2026_enterprise_books'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
