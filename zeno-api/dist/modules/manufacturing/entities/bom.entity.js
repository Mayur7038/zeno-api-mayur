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
exports.BillOfMaterials = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const bom_item_entity_1 = require("./bom-item.entity");
let BillOfMaterials = class BillOfMaterials {
    id;
    tenantId;
    companyId;
    bomNo;
    name;
    finishedItemId;
    finishedItem;
    finishedVariantId;
    finishedVariant;
    producedQty;
    estimatedLaborCost;
    estimatedOverheadCost;
    totalCost;
    isActive;
    description;
    items;
    createdAt;
    updatedAt;
};
exports.BillOfMaterials = BillOfMaterials;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'bom_no', length: 60 }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "bomNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'finished_item_id', type: 'uuid' }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "finishedItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'finished_item_id' }),
    __metadata("design:type", item_entity_1.Item)
], BillOfMaterials.prototype, "finishedItem", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'finished_variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "finishedVariantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'finished_variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], BillOfMaterials.prototype, "finishedVariant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'produced_qty', type: 'decimal', precision: 15, scale: 3, default: 1 }),
    __metadata("design:type", Number)
], BillOfMaterials.prototype, "producedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_labor_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BillOfMaterials.prototype, "estimatedLaborCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_overhead_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BillOfMaterials.prototype, "estimatedOverheadCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BillOfMaterials.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], BillOfMaterials.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BillOfMaterials.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bom_item_entity_1.BomItem, (item) => item.bom, { cascade: true }),
    __metadata("design:type", Array)
], BillOfMaterials.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BillOfMaterials.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BillOfMaterials.prototype, "updatedAt", void 0);
exports.BillOfMaterials = BillOfMaterials = __decorate([
    (0, typeorm_1.Entity)('bill_of_materials')
], BillOfMaterials);
//# sourceMappingURL=bom.entity.js.map