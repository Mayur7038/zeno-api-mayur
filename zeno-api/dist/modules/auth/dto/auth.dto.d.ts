export declare class SignupDto {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    gstin?: string;
    stateCode?: string;
    stateName?: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
}
