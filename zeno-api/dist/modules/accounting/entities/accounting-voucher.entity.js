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
exports.AccountingVoucher = void 0;
const typeorm_1 = require("typeorm");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const accounting_voucher_line_entity_1 = require("./accounting-voucher-line.entity");
let AccountingVoucher = class AccountingVoucher {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    voucherType;
    voucherNo;
    voucherDate;
    totalAmount;
    paymentMode;
    referenceNo;
    referenceDate;
    narration;
    sourceAccountLedgerId;
    sourceAccountLedger;
    status;
    createdBy;
    createdAt;
    updatedAt;
    lines;
};
exports.AccountingVoucher = AccountingVoucher;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], AccountingVoucher.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_type', length: 40 }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "voucherType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_date', type: 'date' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "voucherDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AccountingVoucher.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_mode', length: 40, default: 'CASH' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "paymentMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_no', length: 100, nullable: true }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "referenceNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "referenceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "narration", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'source_account_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "sourceAccountLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'source_account_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], AccountingVoucher.prototype, "sourceAccountLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'POSTED' }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AccountingVoucher.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AccountingVoucher.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AccountingVoucher.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => accounting_voucher_line_entity_1.AccountingVoucherLine, (line) => line.voucher, { cascade: true }),
    __metadata("design:type", Array)
], AccountingVoucher.prototype, "lines", void 0);
exports.AccountingVoucher = AccountingVoucher = __decorate([
    (0, typeorm_1.Entity)('accounting_vouchers')
], AccountingVoucher);
//# sourceMappingURL=accounting-voucher.entity.js.map