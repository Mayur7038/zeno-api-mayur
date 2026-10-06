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
exports.FeatureToggle = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
let FeatureToggle = class FeatureToggle {
    id;
    tenantId;
    companyId;
    featureKey;
    isEnabled;
    createdAt;
    updatedAt;
};
exports.FeatureToggle = FeatureToggle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeatureToggle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], FeatureToggle.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], FeatureToggle.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feature_key', type: 'enum', enum: enums_1.FeatureKey }),
    __metadata("design:type", String)
], FeatureToggle.prototype, "featureKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_enabled', default: true }),
    __metadata("design:type", Boolean)
], FeatureToggle.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FeatureToggle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FeatureToggle.prototype, "updatedAt", void 0);
exports.FeatureToggle = FeatureToggle = __decorate([
    (0, typeorm_1.Entity)('feature_toggles'),
    (0, typeorm_1.Unique)(['companyId', 'featureKey'])
], FeatureToggle);
//# sourceMappingURL=feature-toggle.entity.js.map