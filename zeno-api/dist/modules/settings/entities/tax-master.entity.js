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
exports.TaxMaster = void 0;
const typeorm_1 = require("typeorm");
let TaxMaster = class TaxMaster {
    id;
    tenantId;
    companyId;
    name;
    taxRate;
    cgstRate;
    sgstRate;
    igstRate;
    cessRate;
    isActive;
    createdAt;
    updatedAt;
};
exports.TaxMaster = TaxMaster;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaxMaster.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaxMaster.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaxMaster.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], TaxMaster.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], TaxMaster.prototype, "taxRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cgst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TaxMaster.prototype, "cgstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sgst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TaxMaster.prototype, "sgstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'igst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TaxMaster.prototype, "igstRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cess_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TaxMaster.prototype, "cessRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], TaxMaster.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TaxMaster.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TaxMaster.prototype, "updatedAt", void 0);
exports.TaxMaster = TaxMaster = __decorate([
    (0, typeorm_1.Entity)('tax_masters')
], TaxMaster);
//# sourceMappingURL=tax-master.entity.js.map