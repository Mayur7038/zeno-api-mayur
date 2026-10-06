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
exports.CustomerReceipt = void 0;
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const customer_receipt_allocation_entity_1 = require("./customer-receipt-allocation.entity");
let CustomerReceipt = class CustomerReceipt {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    voucherNo;
    receiptDate;
    customerLedgerId;
    customerLedger;
    paymentLedgerId;
    paymentLedger;
    amount;
    paymentMode;
    referenceNo;
    notes;
    createdBy;
    createdAt;
    updatedAt;
    allocations;
};
exports.CustomerReceipt = CustomerReceipt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], CustomerReceipt.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 50 }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receipt_date', type: 'date' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "receiptDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "customerLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], CustomerReceipt.prototype, "customerLedger", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'payment_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "paymentLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], CustomerReceipt.prototype, "paymentLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], CustomerReceipt.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_mode',
        length: 50,
        default: 'BANK',
    }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "paymentMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_no', length: 100, nullable: true }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "referenceNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CustomerReceipt.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CustomerReceipt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CustomerReceipt.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => customer_receipt_allocation_entity_1.CustomerReceiptAllocation, (alloc) => alloc.customerReceipt, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], CustomerReceipt.prototype, "allocations", void 0);
exports.CustomerReceipt = CustomerReceipt = __decorate([
    (0, typeorm_1.Entity)('customer_receipts'),
    (0, typeorm_1.Unique)(['tenantId', 'companyId', 'branchId', 'voucherNo'])
], CustomerReceipt);
//# sourceMappingURL=customer-receipt.entity.js.map