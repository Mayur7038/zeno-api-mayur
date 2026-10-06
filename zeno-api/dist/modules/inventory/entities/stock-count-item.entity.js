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
exports.StockCountItem = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const stock_count_entity_1 = require("./stock-count.entity");
let StockCountItem = class StockCountItem {
    id;
    tenantId;
    stockCountId;
    stockCount;
    itemId;
    item;
    variantId;
    variant;
    bookQty;
    physicalQty;
    differenceQty;
    unitRate;
    differenceValue;
    remarks;
};
exports.StockCountItem = StockCountItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockCountItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCountItem.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'stock_count_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCountItem.prototype, "stockCountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => stock_count_entity_1.StockCount, (sc) => sc.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'stock_count_id' }),
    __metadata("design:type", stock_count_entity_1.StockCount)
], StockCountItem.prototype, "stockCount", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCountItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], StockCountItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StockCountItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], StockCountItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'book_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCountItem.prototype, "bookQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'physical_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCountItem.prototype, "physicalQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'difference_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCountItem.prototype, "differenceQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], StockCountItem.prototype, "unitRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'difference_value', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StockCountItem.prototype, "differenceValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockCountItem.prototype, "remarks", void 0);
exports.StockCountItem = StockCountItem = __decorate([
    (0, typeorm_1.Entity)('stock_count_items')
], StockCountItem);
//# sourceMappingURL=stock-count-item.entity.js.map