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
exports.PurchaseReturnItem = void 0;
const typeorm_1 = require("typeorm");
const purchase_return_entity_1 = require("./purchase-return.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
let PurchaseReturnItem = class PurchaseReturnItem {
    id;
    purchaseReturnId;
    purchaseReturn;
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
exports.PurchaseReturnItem = PurchaseReturnItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseReturnItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_return_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturnItem.prototype, "purchaseReturnId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_return_entity_1.PurchaseReturn, (pr) => pr.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_return_id' }),
    __metadata("design:type", purchase_return_entity_1.PurchaseReturn)
], PurchaseReturnItem.prototype, "purchaseReturn", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseReturnItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], PurchaseReturnItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PurchaseReturnItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], PurchaseReturnItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'returned_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "returnedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "taxableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "cgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "sgstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "igstAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseReturnItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseReturnItem.prototype, "createdAt", void 0);
exports.PurchaseReturnItem = PurchaseReturnItem = __decorate([
    (0, typeorm_1.Entity)('purchase_return_items')
], PurchaseReturnItem);
//# sourceMappingURL=purchase-return-item.entity.js.map