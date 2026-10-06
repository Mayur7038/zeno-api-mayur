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
exports.ItemGroup = void 0;
const typeorm_1 = require("typeorm");
const item_category_entity_1 = require("./item-category.entity");
const item_entity_1 = require("./item.entity");
let ItemGroup = class ItemGroup {
    id;
    tenantId;
    companyId;
    name;
    hsnSac;
    gstRate;
    createdAt;
    updatedAt;
    categories;
    items;
};
exports.ItemGroup = ItemGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ItemGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemGroup.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], ItemGroup.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], ItemGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hsn_sac', length: 20, nullable: true }),
    __metadata("design:type", String)
], ItemGroup.prototype, "hsnSac", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ItemGroup.prototype, "gstRate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ItemGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ItemGroup.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_category_entity_1.ItemCategory, (cat) => cat.itemGroup),
    __metadata("design:type", Array)
], ItemGroup.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_entity_1.Item, (item) => item.itemGroup),
    __metadata("design:type", Array)
], ItemGroup.prototype, "items", void 0);
exports.ItemGroup = ItemGroup = __decorate([
    (0, typeorm_1.Entity)('item_groups')
], ItemGroup);
//# sourceMappingURL=item-group.entity.js.map