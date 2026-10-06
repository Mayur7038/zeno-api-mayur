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
exports.ItemCategory = void 0;
const typeorm_1 = require("typeorm");
const item_group_entity_1 = require("./item-group.entity");
const item_entity_1 = require("./item.entity");
let ItemCategory = class ItemCategory {
    id;
    tenantId;
    companyId;
    itemGroupId;
    itemGroup;
    name;
    gstRate;
    createdAt;
    updatedAt;
    items;
};
exports.ItemCategory = ItemCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ItemCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemCategory.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemCategory.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_group_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemCategory.prototype, "itemGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_group_entity_1.ItemGroup, (ig) => ig.categories, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_group_id' }),
    __metadata("design:type", item_group_entity_1.ItemGroup)
], ItemCategory.prototype, "itemGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], ItemCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ItemCategory.prototype, "gstRate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ItemCategory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ItemCategory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_entity_1.Item, (item) => item.category),
    __metadata("design:type", Array)
], ItemCategory.prototype, "items", void 0);
exports.ItemCategory = ItemCategory = __decorate([
    (0, typeorm_1.Entity)('item_categories')
], ItemCategory);
//# sourceMappingURL=item-category.entity.js.map