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
exports.VendorPayment = void 0;
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const vendor_payment_allocation_entity_1 = require("./vendor-payment-allocation.entity");
let VendorPayment = class VendorPayment {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    voucherNo;
    paymentDate;
    vendorLedgerId;
    vendorLedger;
    paymentModeLedgerId;
    paymentModeLedger;
    totalAmountPaid;
    totalDiscountReceived;
    referenceChequeNo;
    notes;
    createdBy;
    createdAt;
    updatedAt;
    allocations;
};
exports.VendorPayment = VendorPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VendorPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], VendorPayment.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], VendorPayment.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_date', type: 'date' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vendor_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "vendorLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], VendorPayment.prototype, "vendorLedger", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'payment_mode_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPayment.prototype, "paymentModeLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_mode_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], VendorPayment.prototype, "paymentModeLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount_paid', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], VendorPayment.prototype, "totalAmountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_discount_received', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], VendorPayment.prototype, "totalDiscountReceived", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_cheque_no', length: 60, nullable: true }),
    __metadata("design:type", String)
], VendorPayment.prototype, "referenceChequeNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VendorPayment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], VendorPayment.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VendorPayment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], VendorPayment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vendor_payment_allocation_entity_1.VendorPaymentAllocation, (alloc) => alloc.vendorPayment, { cascade: true }),
    __metadata("design:type", Array)
], VendorPayment.prototype, "allocations", void 0);
exports.VendorPayment = VendorPayment = __decorate([
    (0, typeorm_1.Entity)('vendor_payments')
], VendorPayment);
//# sourceMappingURL=vendor-payment.entity.js.map