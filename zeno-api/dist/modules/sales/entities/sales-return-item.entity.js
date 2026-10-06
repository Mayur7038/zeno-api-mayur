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
exports.SalesReturnItem = void 0;
const typeorm_1 = require("typeorm");
const sales_return_entity_1 = require("./sales-return.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
let SalesReturnItem = class SalesReturnItem {
    id;
    salesReturnId;
    salesReturn;
    itemId;
    item;
    variantId;
    variant;
    returnedQty;
    rate;
    taxableAmount;
    cgstAmount;
    sgstAmount;
    igstAmount;
    totalAmount;
    createdAt;
};
exports.SalesReturnItem = SalesReturnItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_return_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "salesReturnId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_return_entity_1.SalesReturn, (sr) => sr.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_return_id' }),
    __metadata("design:type", sales_return_entity_1.SalesReturn)
], SalesReturnItem.prototype, "salesReturn", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], SalesReturnItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], SalesReturnItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'returned_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "returnedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "taxableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "cgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "sgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "igstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SalesReturnItem.prototype, "createdAt", void 0);
exports.SalesReturnItem = SalesReturnItem = __decorate([
    (0, typeorm_1.Entity)('sales_return_items')
], SalesReturnItem);
//# sourceMappingURL=sales-return-item.entity.js.map