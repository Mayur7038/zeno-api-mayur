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
exports.Item = void 0;
const typeorm_1 = require("typeorm");
const item_group_entity_1 = require("./item-group.entity");
const item_category_entity_1 = require("./item-category.entity");
const unit_entity_1 = require("./unit.entity");
const item_variant_entity_1 = require("./item-variant.entity");
let Item = class Item {
    id;
    tenantId;
    companyId;
    productType;
    name;
    sku;
    itemGroupId;
    itemGroup;
    itemCategoryId;
    category;
    unitId;
    unit;
    isGstApplicable;
    hsnSac;
    gstRate;
    cessRate;
    inventoryTracking;
    purchaseRate;
    saleRate;
    mrp;
    openingQty;
    openingRate;
    reorderLevel;
    hasVariants;
    imageUrl;
    description;
    isActive;
    createdAt;
    updatedAt;
    variants;
};
exports.Item = Item;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Item.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], Item.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], Item.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_type', length: 20, default: 'GOODS' }),
    __metadata("design:type", String)
], Item.prototype, "productType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Item.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_group_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "itemGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_group_entity_1.ItemGroup, (ig) => ig.items, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_group_id' }),
    __metadata("design:type", item_group_entity_1.ItemGroup)
], Item.prototype, "itemGroup", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_category_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "itemCategoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_category_entity_1.ItemCategory, (ic) => ic.items, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_category_id' }),
    __metadata("design:type", item_category_entity_1.ItemCategory)
], Item.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'unit_id', type: 'uuid' }),
    __metadata("design:type", String)
], Item.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", unit_entity_1.Unit)
], Item.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_gst_applicable', default: true }),
    __metadata("design:type", Boolean)
], Item.prototype, "isGstApplicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hsn_sac', length: 20, nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "hsnSac", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "gstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cess_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "cessRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inventory_tracking', length: 30, default: 'ITEM_WISE' }),
    __metadata("design:type", String)
], Item.prototype, "inventoryTracking", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "purchaseRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "saleRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "mrp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "openingQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "openingRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reorder_level', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], Item.prototype, "reorderLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'has_variants', default: false }),
    __metadata("design:type", Boolean)
], Item.prototype, "hasVariants", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Item.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Item.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Item.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_variant_entity_1.ItemVariant, (variant) => variant.item),
    __metadata("design:type", Array)
], Item.prototype, "variants", void 0);
exports.Item = Item = __decorate([
    (0, typeorm_1.Entity)('items')
], Item);
//# sourceMappingURL=item.entity.js.map