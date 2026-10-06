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
exports.CreateAccountingVoucherDto = exports.AccountingVoucherLineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AccountingVoucherLineDto {
    ledgerId;
    debitAmount;
    creditAmount;
    amount;
    narration;
}
exports.AccountingVoucherLineDto = AccountingVoucherLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target ledger account UUID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AccountingVoucherLineDto.prototype, "ledgerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Debit amount in INR', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AccountingVoucherLineDto.prototype, "debitAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Credit amount in INR', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AccountingVoucherLineDto.prototype, "creditAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Direct line amount (convenience for single-entry payment/receipt)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AccountingVoucherLineDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Line-level narration / remark' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AccountingVoucherLineDto.prototype, "narration", void 0);
class CreateAccountingVoucherDto {
    companyId;
    branchId;
    voucherType;
    voucherDate;
    paymentMode;
    referenceNo;
    referenceDate;
    narration;
    sourceAccountLedgerId;
    destinationLedgerId;
    totalAmount;
    lines;
}
exports.CreateAccountingVoucherDto = CreateAccountingVoucherDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company UUID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch UUID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Voucher Type',
        enum: ['PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE']),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "voucherType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Voucher posting date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "voucherDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payment mode',
        enum: ['CASH', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'NET_BANKING', 'OTHER'],
        default: 'CASH',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "paymentMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cheque/UTR/Reference No' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "referenceNo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Instrument/Reference Date' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "referenceDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Voucher overall narration' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "narration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Source Cash/Bank ledger for Payment/Receipt/Contra, or Party ledger for Debit/Credit note',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "sourceAccountLedgerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Destination Cash/Bank ledger for Contra transfer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccountingVoucherDto.prototype, "destinationLedgerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Total voucher amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAccountingVoucherDto.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Itemized debit/credit lines', type: [AccountingVoucherLineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AccountingVoucherLineDto),
    __metadata("design:type", Array)
], CreateAccountingVoucherDto.prototype, "lines", void 0);
//# sourceMappingURL=create-accounting-voucher.dto.js.map