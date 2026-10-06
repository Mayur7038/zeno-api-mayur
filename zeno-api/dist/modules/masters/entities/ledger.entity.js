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
exports.Ledger = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_group_entity_1 = require("./ledger-group.entity");
let Ledger = class Ledger {
    id;
    tenantId;
    companyId;
    ledgerGroupId;
    ledgerGroup;
    name;
    code;
    openingBalance;
    balanceType;
    gstin;
    pan;
    stateCode;
    creditLimit;
    creditDays;
    address;
    city;
    state;
    pincode;
    country;
    shippingAddress;
    contactPerson;
    phone;
    mobile;
    email;
    website;
    bankName;
    bankAccountName;
    bankAccountNumber;
    bankIfsc;
    bankBranch;
    upiId;
    isPredefined;
    isActive;
    createdAt;
    updatedAt;
};
exports.Ledger = Ledger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Ledger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], Ledger.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], Ledger.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'ledger_group_id', type: 'uuid' }),
    __metadata("design:type", String)
], Ledger.prototype, "ledgerGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_group_entity_1.LedgerGroup, (lg) => lg.ledgers, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'ledger_group_id' }),
    __metadata("design:type", ledger_group_entity_1.LedgerGroup)
], Ledger.prototype, "ledgerGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Ledger.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_balance', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Ledger.prototype, "openingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'balance_type',
        type: 'enum',
        enum: enums_1.BalanceType,
        default: enums_1.BalanceType.DR,
    }),
    __metadata("design:type", String)
], Ledger.prototype, "balanceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 15, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "gstin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "pan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_code', length: 2, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "stateCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Ledger.prototype, "creditLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_days', default: 0 }),
    __metadata("design:type", Number)
], Ledger.prototype, "creditDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true, default: 'India' }),
    __metadata("design:type", String)
], Ledger.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shipping_address', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "shippingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_person', length: 100, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "contactPerson", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "mobile", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_name', length: 120, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_account_name', length: 150, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "bankAccountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_account_number', length: 50, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_ifsc', length: 20, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "bankIfsc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_branch', length: 100, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "bankBranch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'upi_id', length: 80, nullable: true }),
    __metadata("design:type", String)
], Ledger.prototype, "upiId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_predefined', default: false }),
    __metadata("design:type", Boolean)
], Ledger.prototype, "isPredefined", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Ledger.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Ledger.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Ledger.prototype, "updatedAt", void 0);
exports.Ledger = Ledger = __decorate([
    (0, typeorm_1.Entity)('ledgers')
], Ledger);
//# sourceMappingURL=ledger.entity.js.map