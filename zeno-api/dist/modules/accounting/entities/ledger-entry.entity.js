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
exports.LedgerEntry = void 0;
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
let LedgerEntry = class LedgerEntry {
    id;
    tenantId;
    companyId;
    branchId;
    entryDate;
    voucherType;
    voucherId;
    voucherNo;
    ledgerId;
    ledger;
    debitAmount;
    creditAmount;
    narration;
    createdAt;
};
exports.LedgerEntry = LedgerEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_date', type: 'date' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "entryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_type', length: 40 }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "voucherType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "voucherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "ledgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], LedgerEntry.prototype, "ledger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'debit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LedgerEntry.prototype, "debitAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LedgerEntry.prototype, "creditAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "narration", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LedgerEntry.prototype, "createdAt", void 0);
exports.LedgerEntry = LedgerEntry = __decorate([
    (0, typeorm_1.Entity)('ledger_entries')
], LedgerEntry);
//# sourceMappingURL=ledger-entry.entity.js.map