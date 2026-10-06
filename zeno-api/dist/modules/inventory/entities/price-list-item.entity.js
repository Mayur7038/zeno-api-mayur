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
exports.PriceListItem = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const price_list_entity_1 = require("./price-list.entity");
let PriceListItem = class PriceListItem {
    id;
    tenantId;
    priceListId;
    priceList;
    itemId;
    item;
    variantId;
    variant;
    standardRate;
    customRate;
    discountPercentage;
    minSellingPrice;
    notes;
};
exports.PriceListItem = PriceListItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PriceListItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], PriceListItem.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'price_list_id', type: 'uuid' }),
    __metadata("design:type", String)
], PriceListItem.prototype, "priceListId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => price_list_entity_1.PriceList, (pl) => pl.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'price_list_id' }),
    __metadata("design:type", price_list_entity_1.PriceList)
], PriceListItem.prototype, "priceList", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], PriceListItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], PriceListItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PriceListItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], PriceListItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'standard_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], PriceListItem.prototype, "standardRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'custom_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], PriceListItem.prototype, "customRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PriceListItem.prototype, "discountPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_selling_price', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], PriceListItem.prototype, "minSellingPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PriceListItem.prototype, "notes", void 0);
exports.PriceListItem = PriceListItem = __decorate([
    (0, typeorm_1.Entity)('price_list_items')
], PriceListItem);
//# sourceMappingURL=price-list-item.entity.js.map