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
exports.Company = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const branch_entity_1 = require("./branch.entity");
let Company = class Company {
    id;
    tenantId;
    tenant;
    legalName;
    tradeName;
    code;
    businessType;
    gstin;
    pan;
    currencyCode;
    financialYearStart;
    financialYearEnd;
    booksBeginFrom;
    gstRegistrationType;
    stateName;
    filingFrequency;
    tanNumber;
    arnNumber;
    billingAddress;
    shippingAddress;
    contactDetails;
    logoUrl;
    extraDetails;
    createdAt;
    updatedAt;
    branches;
};
exports.Company = Company;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Company.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], Company.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, (tenant) => tenant.companies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], Company.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legal_name', length: 200 }),
    __metadata("design:type", String)
], Company.prototype, "legalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trade_name', length: 200, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "tradeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_type', length: 100, nullable: true, default: 'Private Limited Company' }),
    __metadata("design:type", String)
], Company.prototype, "businessType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 15, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "gstin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "pan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_code', length: 3, default: 'INR' }),
    __metadata("design:type", String)
], Company.prototype, "currencyCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'financial_year_start', type: 'date', default: '2025-04-01' }),
    __metadata("design:type", String)
], Company.prototype, "financialYearStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'financial_year_end', type: 'date', default: '2026-03-31', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "financialYearEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'books_begin_from', type: 'date', default: '2025-04-01', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "booksBeginFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_registration_type', length: 50, nullable: true, default: 'Regular' }),
    __metadata("design:type", String)
], Company.prototype, "gstRegistrationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_name', length: 100, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "stateName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filing_frequency', length: 50, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "filingFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tan_number', length: 20, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "tanNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'arn_number', length: 50, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "arnNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_address', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "billingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shipping_address', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "shippingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_details', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "contactDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra_details', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "extraDetails", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Company.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Company.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => branch_entity_1.Branch, (branch) => branch.company),
    __metadata("design:type", Array)
], Company.prototype, "branches", void 0);
exports.Company = Company = __decorate([
    (0, typeorm_1.Entity)('companies')
], Company);
//# sourceMappingURL=company.entity.js.map