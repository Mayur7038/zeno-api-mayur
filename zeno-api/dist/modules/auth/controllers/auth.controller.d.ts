import { AuthService } from '../services/auth.service';
import { SignupDto, VerifyOtpDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import { User } from '../entities/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
        user: {
            id: string;
            email: string;
            fullName: string;
            tenantId: string;
            tenantName: string;
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
    getProfile(user: User): {
        id: string;
        email: string;
        fullName: string;
        tenantId: string;
        role: string;
        permissions: import("../../rbac/entities/role-permission.entity").RolePermission[];
        branches: import("../../rbac/entities/user-branch-access.entity").UserBranchAccess[];
    };
}
