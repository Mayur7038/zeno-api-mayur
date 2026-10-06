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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpVerification = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
let OtpVerification = class OtpVerification {
    id;
    email;
    otpHash;
    purpose;
    attemptsCount;
    maxAttempts;
    resendAvailableAt;
    expiresAt;
    isConsumed;
    payload;
    createdAt;
};
exports.OtpVerification = OtpVerification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OtpVerification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], OtpVerification.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'otp_hash', length: 128 }),
    __metadata("design:type", String)
], OtpVerification.prototype, "otpHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.OtpPurpose }),
    __metadata("design:type", String)
], OtpVerification.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempts_count', default: 0 }),
    __metadata("design:type", Number)
], OtpVerification.prototype, "attemptsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_attempts', default: 3 }),
    __metadata("design:type", Number)
], OtpVerification.prototype, "maxAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resend_available_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], OtpVerification.prototype, "resendAvailableAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], OtpVerification.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_consumed', default: false }),
    __metadata("design:type", Boolean)
], OtpVerification.prototype, "isConsumed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], OtpVerification.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], OtpVerification.prototype, "createdAt", void 0);
exports.OtpVerification = OtpVerification = __decorate([
    (0, typeorm_1.Entity)('otp_verifications')
], OtpVerification);
//# sourceMappingURL=otp-verification.entity.js.map