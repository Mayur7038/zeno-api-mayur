"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const user_entity_1 = require("../entities/user.entity");
const otp_verification_entity_1 = require("../entities/otp-verification.entity");
const tenant_entity_1 = require("../../tenancy/entities/tenant.entity");
const company_entity_1 = require("../../tenancy/entities/company.entity");
const tenant_seeder_service_1 = require("../../tenancy/services/tenant-seeder.service");
const enums_1 = require("../../../common/enums");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    otpRepository;
    tenantRepository;
    jwtService;
    configService;
    tenantSeeder;
    dataSource;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, otpRepository, tenantRepository, jwtService, configService, tenantSeeder, dataSource) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.tenantSeeder = tenantSeeder;
        this.dataSource = dataSource;
    }
    async onApplicationBootstrap() {
        try {
            const userCount = await this.userRepository.count();
            if (userCount === 0) {
                this.logger.log('No users found in system. Seeding default demo account (admin@zenobooks.com / Password123!)...');
                await this.dataSource.transaction(async (manager) => {
                    const tenant = manager.create(tenant_entity_1.Tenant, {
                        name: 'Apex Technologies Pvt Ltd',
                        slug: 'apex-technologies-' + Math.floor(1000 + Math.random() * 9000),
                        isActive: true,
                    });
                    await manager.save(tenant_entity_1.Tenant, tenant);
                    const salt = await bcrypt.genSalt(10);
                    const passwordHash = await bcrypt.hash('Password123!', salt);
                    const user = manager.create(user_entity_1.User, {
                        email: 'admin@zenobooks.com',
                        fullName: 'Apex Demo Administrator',
                        passwordHash,
                        isEmailVerified: true,
                        isActive: true,
                        tenantId: tenant.id,
                    });
                    await manager.save(user_entity_1.User, user);
                    await this.tenantSeeder.provisionTenantWithDefaults(manager, tenant, {
                        legalName: 'Apex Technologies Pvt Ltd',
                        gstin: '27AABCU9603R1ZM',
                        stateCode: '27',
                        stateName: 'Maharashtra',
                    }, user);
                });
                this.logger.log('✅ Default demo account seeded successfully: admin@zenobooks.com / Password123!');
            }
        }
        catch (err) {
            this.logger.error('Failed to seed default demo user account:', err?.message || err);
        }
    }
    async signup(dto) {
        if (!dto.email) {
            throw new common_1.BadRequestException('Email address is required');
        }
        const cleanEmail = dto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({
            where: { email: cleanEmail },
        });
        if (existing && existing.isEmailVerified) {
            throw new common_1.BadRequestException('User with this email already exists and is active');
        }
        const latestOtp = await this.otpRepository.findOne({
            where: { email: cleanEmail, purpose: enums_1.OtpPurpose.SIGNUP, isConsumed: false },
            order: { createdAt: 'DESC' },
        });
        const now = new Date();
        if (latestOtp && latestOtp.resendAvailableAt > now) {
            const waitSeconds = Math.ceil((latestOtp.resendAvailableAt.getTime() - now.getTime()) / 1000);
            throw new common_1.BadRequestException(`Please wait ${waitSeconds} seconds before requesting a new OTP`);
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const otpRecord = this.otpRepository.create({
            email: cleanEmail,
            otpHash,
            purpose: enums_1.OtpPurpose.SIGNUP,
            attemptsCount: 0,
            maxAttempts: 3,
            resendAvailableAt: new Date(Date.now() + 60 * 1000),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            isConsumed: false,
            payload: {
                fullName: dto.fullName,
                companyName: dto.companyName,
                passwordHash,
                gstin: dto.gstin,
                stateCode: dto.stateCode || '27',
                stateName: dto.stateName || 'Maharashtra',
            },
        });
        await this.otpRepository.save(otpRecord);
        this.logger.log(`========================================`);
        this.logger.log(`[EMAIL OTP SIGNUP] To: ${cleanEmail} | OTP: ${otp}`);
        this.logger.log(`========================================`);
        return {
            success: true,
            message: 'Verification OTP sent to your email',
            email: cleanEmail,
            cooldownSeconds: 60,
            devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        };
    }
    async verifyOtp(dto) {
        if (!dto.email || !dto.otp) {
            throw new common_1.BadRequestException('Email and OTP are required');
        }
        const email = dto.email.trim().toLowerCase();
        const otpHash = crypto.createHash('sha256').update(dto.otp.trim()).digest('hex');
        const otpRecord = await this.otpRepository.findOne({
            where: { email, purpose: enums_1.OtpPurpose.SIGNUP, isConsumed: false },
            order: { createdAt: 'DESC' },
        });
        if (!otpRecord) {
            throw new common_1.BadRequestException('No active OTP request found for this email');
        }
        if (new Date() > otpRecord.expiresAt) {
            throw new common_1.BadRequestException('OTP has expired. Please request a new one');
        }
        if (otpRecord.attemptsCount >= otpRecord.maxAttempts) {
            throw new common_1.BadRequestException('Maximum verification attempts exceeded. Please request a new OTP');
        }
        if (otpRecord.otpHash !== otpHash) {
            otpRecord.attemptsCount += 1;
            await this.otpRepository.save(otpRecord);
            throw new common_1.BadRequestException(`Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attemptsCount} attempts remaining`);
        }
        return await this.dataSource.transaction(async (manager) => {
            otpRecord.isConsumed = true;
            await manager.save(otp_verification_entity_1.OtpVerification, otpRecord);
            const payload = otpRecord.payload;
            const tenantSlug = payload.companyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
            const tenant = manager.create(tenant_entity_1.Tenant, {
                name: payload.companyName,
                slug: tenantSlug,
                isActive: true,
            });
            await manager.save(tenant_entity_1.Tenant, tenant);
            let user = await manager.findOne(user_entity_1.User, { where: { email } });
            if (!user) {
                user = manager.create(user_entity_1.User, {
                    email,
                    fullName: payload.fullName,
                    passwordHash: payload.passwordHash,
                    isEmailVerified: true,
                    isActive: true,
                });
            }
            else {
                user.fullName = payload.fullName;
                user.passwordHash = payload.passwordHash;
                user.isEmailVerified = true;
                user.isActive = true;
            }
            await manager.save(user_entity_1.User, user);
            const { company, branch, role } = await this.tenantSeeder.provisionTenantWithDefaults(manager, tenant, {
                legalName: payload.companyName,
                gstin: payload.gstin,
                stateCode: payload.stateCode,
                stateName: payload.stateName,
            }, user);
            const fullUser = await manager.findOne(user_entity_1.User, {
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
    async login(dto) {
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
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Email is not verified. Please complete signup verification');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account has been deactivated. Please contact support');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        let company = null;
        let branch = null;
        if (user.tenantId) {
            const companyRepo = this.dataSource.getRepository(company_entity_1.Company);
            company = await companyRepo.findOne({
                where: { tenantId: user.tenantId },
                order: { createdAt: 'ASC' },
                relations: ['branches'],
            });
            if (company && company.branches && company.branches.length > 0) {
                branch = company.branches.find((b) => b.isHeadOffice) || company.branches[0];
            }
        }
        const tokens = this.generateTokens(user);
        return {
            success: true,
            tenant: user.tenant
                ? {
                    id: user.tenant.id,
                    name: user.tenant.name,
                    slug: user.tenant.slug,
                }
                : undefined,
            company: company
                ? {
                    id: company.id,
                    legalName: company.legalName,
                }
                : undefined,
            branch: branch
                ? {
                    id: branch.id,
                    branchName: branch.branchName,
                    stateCode: branch.stateCode,
                }
                : undefined,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                tenantId: user.tenantId,
                tenantName: user.tenant?.name,
                companyId: company?.id,
                branchId: branch?.id,
                role: user.role?.name,
                permissions: user.role?.permissions || [],
                branches: user.branchAccess || [],
            },
            ...tokens,
        };
    }
    async forgotPassword(dto) {
        const user = await this.userRepository.findOne({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
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
            purpose: enums_1.OtpPurpose.FORGOT_PASSWORD,
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
    async resetPassword(dto) {
        const email = dto.email.toLowerCase();
        const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');
        const otpRecord = await this.otpRepository.findOne({
            where: { email, purpose: enums_1.OtpPurpose.FORGOT_PASSWORD, isConsumed: false },
            order: { createdAt: 'DESC' },
        });
        if (!otpRecord) {
            throw new common_1.BadRequestException('No active password reset request found');
        }
        if (new Date() > otpRecord.expiresAt) {
            throw new common_1.BadRequestException('OTP has expired');
        }
        if (otpRecord.attemptsCount >= otpRecord.maxAttempts) {
            throw new common_1.BadRequestException('Maximum attempts exceeded');
        }
        if (otpRecord.otpHash !== otpHash) {
            otpRecord.attemptsCount += 1;
            await this.otpRepository.save(otpRecord);
            throw new common_1.BadRequestException('Invalid OTP');
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
    async refreshTokens(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is required');
        }
        try {
            const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', 'zeno_refresh_secret_key_2026_enterprise_books');
            const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
                relations: ['role', 'tenant'],
            });
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('User account not found or deactivated');
            }
            return {
                success: true,
                ...this.generateTokens(user),
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired');
        }
    }
    generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role?.name,
        };
        const accessExpiry = this.configService.get('JWT_EXPIRES_IN', '30d');
        const refreshExpiry = this.configService.get('JWT_REFRESH_EXPIRES_IN', '60d');
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET', 'zeno_super_secret_jwt_key_2026_enterprise_books'),
            expiresIn: accessExpiry,
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET', 'zeno_refresh_secret_key_2026_enterprise_books'),
            expiresIn: refreshExpiry,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 30 * 24 * 60 * 60,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(otp_verification_entity_1.OtpVerification)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        tenant_seeder_service_1.TenantSeederService,
        typeorm_2.DataSource])
], AuthService);
//# sourceMappingURL=auth.service.js.map