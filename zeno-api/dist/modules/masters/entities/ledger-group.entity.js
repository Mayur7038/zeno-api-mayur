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
exports.LedgerGroup = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("./ledger.entity");
let LedgerGroup = class LedgerGroup {
    id;
    tenantId;
    companyId;
    name;
    code;
    parentId;
    parent;
    children;
    nature;
    isCreditorVendor;
    isDebtorCustomer;
    isPredefined;
    createdAt;
    updatedAt;
    ledgers;
};
exports.LedgerGroup = LedgerGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LedgerGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LedgerGroup, (lg) => lg.children, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", LedgerGroup)
], LedgerGroup.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LedgerGroup, (lg) => lg.parent),
    __metadata("design:type", Array)
], LedgerGroup.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.LedgerGroupNature }),
    __metadata("design:type", String)
], LedgerGroup.prototype, "nature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_creditor_vendor', default: false }),
    __metadata("design:type", Boolean)
], LedgerGroup.prototype, "isCreditorVendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_debtor_customer', default: false }),
    __metadata("design:type", Boolean)
], LedgerGroup.prototype, "isDebtorCustomer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_predefined', default: false }),
    __metadata("design:type", Boolean)
], LedgerGroup.prototype, "isPredefined", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LedgerGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LedgerGroup.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ledger_entity_1.Ledger, (ledger) => ledger.ledgerGroup),
    __metadata("design:type", Array)
], LedgerGroup.prototype, "ledgers", void 0);
exports.LedgerGroup = LedgerGroup = __decorate([
    (0, typeorm_1.Entity)('ledger_groups')
], LedgerGroup);
//# sourceMappingURL=ledger-group.entity.js.map