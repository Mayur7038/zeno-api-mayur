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
exports.ItemVariant = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("./item.entity");
let ItemVariant = class ItemVariant {
    id;
    tenantId;
    itemId;
    item;
    name;
    sku;
    barcode;
    attributes;
    purchaseRate;
    saleRate;
    mrp;
    openingQty;
    openingRate;
    isActive;
    createdAt;
    updatedAt;
};
exports.ItemVariant = ItemVariant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ItemVariant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemVariant.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemVariant.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, (item) => item.variants, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], ItemVariant.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], ItemVariant.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], ItemVariant.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], ItemVariant.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ItemVariant.prototype, "attributes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_rate', type: 'decimal', precision: 15, scale: 4, nullable: true, default: 0 }),
    __metadata("design:type", Number)
], ItemVariant.prototype, "purchaseRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_rate', type: 'decimal', precision: 15, scale: 4, nullable: true, default: 0 }),
    __metadata("design:type", Number)
], ItemVariant.prototype, "saleRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ItemVariant.prototype, "mrp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], ItemVariant.prototype, "openingQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ItemVariant.prototype, "openingRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], ItemVariant.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ItemVariant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ItemVariant.prototype, "updatedAt", void 0);
exports.ItemVariant = ItemVariant = __decorate([
    (0, typeorm_1.Entity)('item_variants')
], ItemVariant);
//# sourceMappingURL=item-variant.entity.js.map