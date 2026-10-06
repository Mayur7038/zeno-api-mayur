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
exports.SalesInvoice = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const sales_invoice_item_entity_1 = require("./sales-invoice-item.entity");
const sales_invoice_dc_mapping_entity_1 = require("./sales-invoice-dc-mapping.entity");
let SalesInvoice = class SalesInvoice {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    voucherNo;
    invoiceDate;
    salesType;
    customerLedgerId;
    customerLedger;
    dueDate;
    paymentTerms;
    taxableTotal;
    cgstTotal;
    sgstTotal;
    igstTotal;
    discountTotal;
    roundOffTotal;
    grandTotal;
    paidAmount;
    status;
    notes;
    createdBy;
    createdAt;
    updatedAt;
    items;
    deliveryChallans;
};
exports.SalesInvoice = SalesInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], SalesInvoice.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 50 }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_date', type: 'date' }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "invoiceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sales_type',
        type: 'enum',
        enum: enums_1.PurchaseType,
        default: enums_1.PurchaseType.GOODS,
    }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "salesType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "customerLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], SalesInvoice.prototype, "customerLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_terms', length: 100, nullable: true }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "taxableTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "cgstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "sgstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "igstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "discountTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_off_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "roundOffTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.SalesInvoiceStatus,
        default: enums_1.SalesInvoiceStatus.PENDING,
    }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SalesInvoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SalesInvoice.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_invoice_item_entity_1.SalesInvoiceItem, (item) => item.salesInvoice, { cascade: true }),
    __metadata("design:type", Array)
], SalesInvoice.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_invoice_dc_mapping_entity_1.SalesInvoiceDcMapping, (mapping) => mapping.salesInvoice, { cascade: true }),
    __metadata("design:type", Array)
], SalesInvoice.prototype, "deliveryChallans", void 0);
exports.SalesInvoice = SalesInvoice = __decorate([
    (0, typeorm_1.Entity)('sales_invoices'),
    (0, typeorm_1.Unique)(['tenantId', 'companyId', 'branchId', 'voucherNo'])
], SalesInvoice);
//# sourceMappingURL=sales-invoice.entity.js.map