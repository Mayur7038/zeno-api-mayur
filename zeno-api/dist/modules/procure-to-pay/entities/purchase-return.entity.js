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
exports.PurchaseReturn = void 0;
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const purchase_invoice_entity_1 = require("./purchase-invoice.entity");
const purchase_return_item_entity_1 = require("./purchase-return-item.entity");
let PurchaseReturn = class PurchaseReturn {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    purchaseInvoiceId;
    purchaseInvoice;
    voucherNo;
    returnDate;
    vendorLedgerId;
    vendorLedger;
    subtotal;
    taxTotal;
    grandTotal;
    reason;
    createdBy;
    createdAt;
    updatedAt;
    items;
};
exports.PurchaseReturn = PurchaseReturn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], PurchaseReturn.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "purchaseInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_invoice_entity_1.PurchaseInvoice, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_invoice_id' }),
    __metadata("design:type", purchase_invoice_entity_1.PurchaseInvoice)
], PurchaseReturn.prototype, "purchaseInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'return_date', type: 'date' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "returnDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vendor_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "vendorLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], PurchaseReturn.prototype, "vendorLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturn.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturn.prototype, "taxTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturn.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PurchaseReturn.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseReturn.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PurchaseReturn.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_return_item_entity_1.PurchaseReturnItem, (item) => item.purchaseReturn, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseReturn.prototype, "items", void 0);
exports.PurchaseReturn = PurchaseReturn = __decorate([
    (0, typeorm_1.Entity)('purchase_returns')
], PurchaseReturn);
//# sourceMappingURL=purchase-return.entity.js.map