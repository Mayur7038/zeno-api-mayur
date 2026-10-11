import { OnApplicationBootstrap } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { OtpVerification } from '../entities/otp-verification.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { TenantSeederService } from '../../tenancy/services/tenant-seeder.service';
import { SignupDto, VerifyOtpDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
export declare class AuthService implements OnApplicationBootstrap {
    private userRepository;
    private otpRepository;
    private tenantRepository;
    private jwtService;
    private configService;
    private tenantSeeder;
    private dataSource;
    private readonly logger;
    constructor(userRepository: Repository<User>, otpRepository: Repository<OtpVerification>, tenantRepository: Repository<Tenant>, jwtService: JwtService, configService: ConfigService, tenantSeeder: TenantSeederService, dataSource: DataSource);
    onApplicationBootstrap(): Promise<void>;
    signup(dto: SignupDto): Promise<{
        success: boolean;
        message: string;
        email: string;
        cooldownSeconds: number;
        devOtp: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        success: boolean;
        message: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
        company: {
            id: string;
            legalName: string;
        };
        branch: {
            id: string;
            branchName: string;
            stateCode: string;
        };
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        success: boolean;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
        company: {
            id: string;
            legalName: string;
        };
        branch: {
            id: string;
            branchName: string;
            stateCode: string;
        };
        user: {
            id: string;
            email: string;
            fullName: string;
            tenantId: string;
            tenantName: string;
            companyId: string;
            branchId: string;
            role: string;
            permissions: import("../../rbac/entities/role-permission.entity").RolePermission[];
            branches: import("../../rbac/entities/user-branch-access.entity").UserBranchAccess[];
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
        cooldownSeconds?: undefined;
        devOtp?: undefined;
    } | {
        success: boolean;
        message: string;
        cooldownSeconds: number;
        devOtp: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        success: boolean;
    }>;
    private generateTokens;
}
