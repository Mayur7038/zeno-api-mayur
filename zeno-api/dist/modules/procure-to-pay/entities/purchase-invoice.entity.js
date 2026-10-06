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
exports.PurchaseInvoice = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const purchase_invoice_item_entity_1 = require("./purchase-invoice-item.entity");
const purchase_invoice_grn_mapping_entity_1 = require("./purchase-invoice-grn-mapping.entity");
let PurchaseInvoice = class PurchaseInvoice {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    godownId;
    godown;
    voucherNo;
    invoiceDate;
    purchaseType;
    vendorLedgerId;
    vendorLedger;
    vendorBillNo;
    vendorBillDate;
    placeOfSupplyStateCode;
    isInterstate;
    subtotal;
    discountTotal;
    taxableTotal;
    cgstTotal;
    sgstTotal;
    igstTotal;
    cessTotal;
    roundOff;
    grandTotal;
    paidAmount;
    status;
    notes;
    version;
    createdBy;
    createdAt;
    updatedAt;
    items;
    grnMappings;
};
exports.PurchaseInvoice = PurchaseInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], PurchaseInvoice.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], PurchaseInvoice.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_date', type: 'date' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "invoiceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'purchase_type',
        type: 'enum',
        enum: enums_1.PurchaseType,
        default: enums_1.PurchaseType.GOODS,
    }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "purchaseType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vendor_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "vendorLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], PurchaseInvoice.prototype, "vendorLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_bill_no', length: 60, nullable: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "vendorBillNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_bill_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "vendorBillDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'place_of_supply_state_code', length: 2, default: '27' }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "placeOfSupplyStateCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_interstate', default: false }),
    __metadata("design:type", Boolean)
], PurchaseInvoice.prototype, "isInterstate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "discountTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "taxableTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "cgstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "sgstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "igstTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cess_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "cessTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_off', type: 'decimal', precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "roundOff", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PurchaseInvoiceStatus,
        default: enums_1.PurchaseInvoiceStatus.PENDING,
    }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)({ default: 1 }),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseInvoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PurchaseInvoice.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_invoice_item_entity_1.PurchaseInvoiceItem, (item) => item.purchaseInvoice, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseInvoice.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_invoice_grn_mapping_entity_1.PurchaseInvoiceGrnMapping, (mapping) => mapping.purchaseInvoice, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseInvoice.prototype, "grnMappings", void 0);
exports.PurchaseInvoice = PurchaseInvoice = __decorate([
    (0, typeorm_1.Entity)('purchase_invoices')
], PurchaseInvoice);
//# sourceMappingURL=purchase-invoice.entity.js.map