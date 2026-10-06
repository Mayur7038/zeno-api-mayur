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
exports.DeliveryChallanItem = void 0;
const typeorm_1 = require("typeorm");
const delivery_challan_entity_1 = require("./delivery-challan.entity");
const sales_order_item_entity_1 = require("./sales-order-item.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const unit_entity_1 = require("../../masters/entities/unit.entity");
let DeliveryChallanItem = class DeliveryChallanItem {
    id;
    deliveryChallanId;
    deliveryChallan;
    salesOrderItemId;
    salesOrderItem;
    itemId;
    item;
    variantId;
    variant;
    unitId;
    unit;
    dispatchedQty;
    invoicedQty;
    rate;
    discountAmount;
    taxableAmount;
    gstRate;
    cgstAmount;
    sgstAmount;
    igstAmount;
    totalAmount;
    createdAt;
};
exports.DeliveryChallanItem = DeliveryChallanItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'delivery_challan_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "deliveryChallanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_challan_entity_1.DeliveryChallan, (dc) => dc.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_challan_id' }),
    __metadata("design:type", delivery_challan_entity_1.DeliveryChallan)
], DeliveryChallanItem.prototype, "deliveryChallan", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_order_item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "salesOrderItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_item_entity_1.SalesOrderItem, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_item_id' }),
    __metadata("design:type", sales_order_item_entity_1.SalesOrderItem)
], DeliveryChallanItem.prototype, "salesOrderItem", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], DeliveryChallanItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], DeliveryChallanItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'unit_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallanItem.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", unit_entity_1.Unit)
], DeliveryChallanItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispatched_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "dispatchedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoiced_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "invoicedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "taxableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "gstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "cgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "sgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "igstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], DeliveryChallanItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeliveryChallanItem.prototype, "createdAt", void 0);
exports.DeliveryChallanItem = DeliveryChallanItem = __decorate([
    (0, typeorm_1.Entity)('delivery_challan_items')
], DeliveryChallanItem);
//# sourceMappingURL=delivery-challan-item.entity.js.map