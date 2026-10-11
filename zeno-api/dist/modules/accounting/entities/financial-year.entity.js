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
exports.FinancialYear = void 0;
const typeorm_1 = require("typeorm");
let FinancialYear = class FinancialYear {
    id;
    tenantId;
    companyId;
    name;
    startDate;
    endDate;
    isClosed;
    closedAt;
    isCurrent;
    closingNotes;
    createdAt;
    updatedAt;
};
exports.FinancialYear = FinancialYear;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinancialYear.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], FinancialYear.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], FinancialYear.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], FinancialYear.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date' }),
    __metadata("design:type", String)
], FinancialYear.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date' }),
    __metadata("design:type", String)
], FinancialYear.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_closed', default: false }),
    __metadata("design:type", Boolean)
], FinancialYear.prototype, "isClosed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'closed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], FinancialYear.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_current', default: false }),
    __metadata("design:type", Boolean)
], FinancialYear.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'closing_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], FinancialYear.prototype, "closingNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FinancialYear.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FinancialYear.prototype, "updatedAt", void 0);
exports.FinancialYear = FinancialYear = __decorate([
    (0, typeorm_1.Entity)('financial_years')
], FinancialYear);
//# sourceMappingURL=financial-year.entity.js.map