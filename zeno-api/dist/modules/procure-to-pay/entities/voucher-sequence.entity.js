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
exports.VoucherSequence = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
let VoucherSequence = class VoucherSequence {
    id;
    tenantId;
    companyId;
    branchId;
    voucherType;
    financialYear;
    prefix;
    suffix;
    currentNumber;
    paddingDigits;
    updatedAt;
};
exports.VoucherSequence = VoucherSequence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VoucherSequence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_type', type: 'enum', enum: enums_1.VoucherType }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "voucherType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'financial_year', length: 10, default: '2025-2026' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "financialYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: '' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: '' }),
    __metadata("design:type", String)
], VoucherSequence.prototype, "suffix", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_number', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], VoucherSequence.prototype, "currentNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'padding_digits', default: 4 }),
    __metadata("design:type", Number)
], VoucherSequence.prototype, "paddingDigits", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], VoucherSequence.prototype, "updatedAt", void 0);
exports.VoucherSequence = VoucherSequence = __decorate([
    (0, typeorm_1.Entity)('voucher_sequences'),
    (0, typeorm_1.Unique)(['tenantId', 'companyId', 'branchId', 'voucherType', 'financialYear'])
], VoucherSequence);
//# sourceMappingURL=voucher-sequence.entity.js.map