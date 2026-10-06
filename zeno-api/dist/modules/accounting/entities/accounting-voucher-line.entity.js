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
exports.AccountingVoucherLine = void 0;
const typeorm_1 = require("typeorm");
const accounting_voucher_entity_1 = require("./accounting-voucher.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
let AccountingVoucherLine = class AccountingVoucherLine {
    id;
    voucherId;
    voucher;
    ledgerId;
    ledger;
    debitAmount;
    creditAmount;
    narration;
};
exports.AccountingVoucherLine = AccountingVoucherLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AccountingVoucherLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_id', type: 'uuid' }),
    __metadata("design:type", String)
], AccountingVoucherLine.prototype, "voucherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => accounting_voucher_entity_1.AccountingVoucher, (v) => v.lines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'voucher_id' }),
    __metadata("design:type", accounting_voucher_entity_1.AccountingVoucher)
], AccountingVoucherLine.prototype, "voucher", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], AccountingVoucherLine.prototype, "ledgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], AccountingVoucherLine.prototype, "ledger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'debit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AccountingVoucherLine.prototype, "debitAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], AccountingVoucherLine.prototype, "creditAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AccountingVoucherLine.prototype, "narration", void 0);
exports.AccountingVoucherLine = AccountingVoucherLine = __decorate([
    (0, typeorm_1.Entity)('accounting_voucher_lines')
], AccountingVoucherLine);
//# sourceMappingURL=accounting-voucher-line.entity.js.map