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
exports.BomItem = void 0;
const typeorm_1 = require("typeorm");
const bom_entity_1 = require("./bom.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
let BomItem = class BomItem {
    id;
    tenantId;
    bomId;
    bom;
    itemId;
    item;
    variantId;
    variant;
    consumedQty;
    unitRate;
    scrapPercentage;
    totalAmount;
    notes;
};
exports.BomItem = BomItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BomItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], BomItem.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'bom_id', type: 'uuid' }),
    __metadata("design:type", String)
], BomItem.prototype, "bomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bom_entity_1.BillOfMaterials, (b) => b.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'bom_id' }),
    __metadata("design:type", bom_entity_1.BillOfMaterials)
], BomItem.prototype, "bom", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], BomItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], BomItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], BomItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], BomItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumed_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], BomItem.prototype, "consumedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], BomItem.prototype, "unitRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scrap_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BomItem.prototype, "scrapPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BomItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], BomItem.prototype, "notes", void 0);
exports.BomItem = BomItem = __decorate([
    (0, typeorm_1.Entity)('bom_items')
], BomItem);
//# sourceMappingURL=bom-item.entity.js.map