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
exports.SalesInvoiceItem = void 0;
const typeorm_1 = require("typeorm");
const sales_invoice_entity_1 = require("./sales-invoice.entity");
const delivery_challan_item_entity_1 = require("./delivery-challan-item.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const unit_entity_1 = require("../../masters/entities/unit.entity");
let SalesInvoiceItem = class SalesInvoiceItem {
    id;
    salesInvoiceId;
    salesInvoice;
    deliveryChallanItemId;
    deliveryChallanItem;
    itemId;
    item;
    variantId;
    variant;
    unitId;
    unit;
    billedQty;
    rate;
    discountAmount;
    taxableAmount;
    gstRate;
    cgstAmount;
    sgstAmount;
    igstAmount;
    cessAmount;
    totalAmount;
    createdAt;
};
exports.SalesInvoiceItem = SalesInvoiceItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "salesInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_invoice_entity_1.SalesInvoice, (si) => si.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_invoice_id' }),
    __metadata("design:type", sales_invoice_entity_1.SalesInvoice)
], SalesInvoiceItem.prototype, "salesInvoice", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'delivery_challan_item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "deliveryChallanItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_challan_item_entity_1.DeliveryChallanItem, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_challan_item_id' }),
    __metadata("design:type", delivery_challan_item_entity_1.DeliveryChallanItem)
], SalesInvoiceItem.prototype, "deliveryChallanItem", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], SalesInvoiceItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], SalesInvoiceItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'unit_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", unit_entity_1.Unit)
], SalesInvoiceItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billed_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "billedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "taxableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "gstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "cgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "sgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "igstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cess_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "cessAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SalesInvoiceItem.prototype, "createdAt", void 0);
exports.SalesInvoiceItem = SalesInvoiceItem = __decorate([
    (0, typeorm_1.Entity)('sales_invoice_items')
], SalesInvoiceItem);
//# sourceMappingURL=sales-invoice-item.entity.js.map