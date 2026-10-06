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
exports.SalesReturn = void 0;
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const sales_invoice_entity_1 = require("./sales-invoice.entity");
const sales_return_item_entity_1 = require("./sales-return-item.entity");
let SalesReturn = class SalesReturn {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    godownId;
    godown;
    salesInvoiceId;
    salesInvoice;
    voucherNo;
    returnDate;
    customerLedgerId;
    customerLedger;
    subtotal;
    taxTotal;
    grandTotal;
    reason;
    createdBy;
    createdAt;
    updatedAt;
    items;
};
exports.SalesReturn = SalesReturn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesReturn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturn.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturn.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturn.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], SalesReturn.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesReturn.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], SalesReturn.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_invoice_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesReturn.prototype, "salesInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_invoice_entity_1.SalesInvoice, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_invoice_id' }),
    __metadata("design:type", sales_invoice_entity_1.SalesInvoice)
], SalesReturn.prototype, "salesInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 50 }),
    __metadata("design:type", String)
], SalesReturn.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'return_date', type: 'date' }),
    __metadata("design:type", String)
], SalesReturn.prototype, "returnDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesReturn.prototype, "customerLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], SalesReturn.prototype, "customerLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturn.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturn.prototype, "taxTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesReturn.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SalesReturn.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesReturn.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SalesReturn.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SalesReturn.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_return_item_entity_1.SalesReturnItem, (item) => item.salesReturn, { cascade: true }),
    __metadata("design:type", Array)
], SalesReturn.prototype, "items", void 0);
exports.SalesReturn = SalesReturn = __decorate([
    (0, typeorm_1.Entity)('sales_returns'),
    (0, typeorm_1.Unique)(['tenantId', 'companyId', 'branchId', 'voucherNo'])
], SalesReturn);
//# sourceMappingURL=sales-return.entity.js.map