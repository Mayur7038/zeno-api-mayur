import { OtpPurpose } from '../../../common/enums';
export declare class OtpVerification {
    id: string;
    email: string;
    otpHash: string;
    purpose: OtpPurpose;
    attemptsCount: number;
    maxAttempts: number;
    resendAvailableAt: Date;
    expiresAt: Date;
    isConsumed: boolean;
    payload: Record<string, any>;
    createdAt: Date;
}
