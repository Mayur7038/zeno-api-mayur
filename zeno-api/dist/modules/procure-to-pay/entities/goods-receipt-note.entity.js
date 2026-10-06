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
exports.GoodsReceiptNote = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const grn_item_entity_1 = require("./grn-item.entity");
const grn_po_mapping_entity_1 = require("./grn-po-mapping.entity");
let GoodsReceiptNote = class GoodsReceiptNote {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    godownId;
    godown;
    voucherNo;
    grnDate;
    vendorLedgerId;
    vendorLedger;
    status;
    notes;
    version;
    createdBy;
    createdAt;
    updatedAt;
    items;
    poMappings;
};
exports.GoodsReceiptNote = GoodsReceiptNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], GoodsReceiptNote.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], GoodsReceiptNote.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grn_date', type: 'date' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "grnDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vendor_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "vendorLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], GoodsReceiptNote.prototype, "vendorLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.GrnStatus,
        default: enums_1.GrnStatus.PENDING,
    }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)({ default: 1 }),
    __metadata("design:type", Number)
], GoodsReceiptNote.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GoodsReceiptNote.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GoodsReceiptNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], GoodsReceiptNote.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => grn_item_entity_1.GrnItem, (item) => item.grn, { cascade: true }),
    __metadata("design:type", Array)
], GoodsReceiptNote.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => grn_po_mapping_entity_1.GrnPoMapping, (mapping) => mapping.grn, { cascade: true }),
    __metadata("design:type", Array)
], GoodsReceiptNote.prototype, "poMappings", void 0);
exports.GoodsReceiptNote = GoodsReceiptNote = __decorate([
    (0, typeorm_1.Entity)('goods_receipt_notes')
], GoodsReceiptNote);
//# sourceMappingURL=goods-receipt-note.entity.js.map