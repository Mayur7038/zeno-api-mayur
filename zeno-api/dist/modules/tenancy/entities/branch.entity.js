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
exports.Branch = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./company.entity");
const godown_entity_1 = require("./godown.entity");
let Branch = class Branch {
    id;
    tenantId;
    companyId;
    company;
    branchName;
    branchCode;
    stateCode;
    stateName;
    addressLine1;
    pincode;
    isHeadOffice;
    createdAt;
    updatedAt;
    godowns;
};
exports.Branch = Branch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Branch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], Branch.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], Branch.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.branches, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], Branch.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_name', length: 150 }),
    __metadata("design:type", String)
], Branch.prototype, "branchName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_code', length: 20 }),
    __metadata("design:type", String)
], Branch.prototype, "branchCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_code', length: 2, default: '27' }),
    __metadata("design:type", String)
], Branch.prototype, "stateCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_name', length: 100, default: 'Maharashtra' }),
    __metadata("design:type", String)
], Branch.prototype, "stateName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_line1', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Branch.prototype, "addressLine1", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], Branch.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_head_office', default: false }),
    __metadata("design:type", Boolean)
], Branch.prototype, "isHeadOffice", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Branch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Branch.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => godown_entity_1.Godown, (godown) => godown.branch),
    __metadata("design:type", Array)
], Branch.prototype, "godowns", void 0);
exports.Branch = Branch = __decorate([
    (0, typeorm_1.Entity)('branches')
], Branch);
//# sourceMappingURL=branch.entity.js.map