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
exports.VariantDefinition = void 0;
const typeorm_1 = require("typeorm");
let VariantDefinition = class VariantDefinition {
    id;
    tenantId;
    companyId;
    name;
    code;
    type;
    options;
    isActive;
    createdAt;
    updatedAt;
};
exports.VariantDefinition = VariantDefinition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VariantDefinition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], VariantDefinition.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], VariantDefinition.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], VariantDefinition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], VariantDefinition.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'DROPDOWN' }),
    __metadata("design:type", String)
], VariantDefinition.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], VariantDefinition.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], VariantDefinition.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VariantDefinition.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], VariantDefinition.prototype, "updatedAt", void 0);
exports.VariantDefinition = VariantDefinition = __decorate([
    (0, typeorm_1.Entity)('variant_definitions')
], VariantDefinition);
//# sourceMappingURL=variant-definition.entity.js.map