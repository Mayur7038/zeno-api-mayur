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
exports.ProductionEntry = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const bom_entity_1 = require("./bom.entity");
const production_item_entity_1 = require("./production-item.entity");
let ProductionEntry = class ProductionEntry {
    id;
    tenantId;
    companyId;
    branchId;
    voucherNo;
    entryDate;
    bomId;
    bom;
    finishedItemId;
    finishedItem;
    finishedVariantId;
    finishedVariant;
    assembledQty;
    sourceGodownId;
    sourceGodown;
    targetGodownId;
    targetGodown;
    rawMaterialCost;
    additionalLaborCost;
    additionalOverheadCost;
    totalCost;
    unitCost;
    status;
    notes;
    items;
    createdAt;
    updatedAt;
};
exports.ProductionEntry = ProductionEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductionEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_date', type: 'date' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "entryDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'bom_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "bomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bom_entity_1.BillOfMaterials, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'bom_id' }),
    __metadata("design:type", bom_entity_1.BillOfMaterials)
], ProductionEntry.prototype, "bom", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'finished_item_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "finishedItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'finished_item_id' }),
    __metadata("design:type", item_entity_1.Item)
], ProductionEntry.prototype, "finishedItem", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'finished_variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "finishedVariantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'finished_variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], ProductionEntry.prototype, "finishedVariant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assembled_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "assembledQty", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'source_godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "sourceGodownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'source_godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], ProductionEntry.prototype, "sourceGodown", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'target_godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "targetGodownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'target_godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], ProductionEntry.prototype, "targetGodown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_material_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "rawMaterialCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'additional_labor_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "additionalLaborCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'additional_overhead_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "additionalOverheadCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'COMPLETED' }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProductionEntry.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => production_item_entity_1.ProductionItem, (item) => item.productionEntry, { cascade: true }),
    __metadata("design:type", Array)
], ProductionEntry.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProductionEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProductionEntry.prototype, "updatedAt", void 0);
exports.ProductionEntry = ProductionEntry = __decorate([
    (0, typeorm_1.Entity)('production_entries')
], ProductionEntry);
//# sourceMappingURL=production-entry.entity.js.map