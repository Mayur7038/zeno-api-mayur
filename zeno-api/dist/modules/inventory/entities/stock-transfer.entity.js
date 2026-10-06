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
exports.StockTransfer = void 0;
const typeorm_1 = require("typeorm");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const stock_transfer_item_entity_1 = require("./stock-transfer-item.entity");
let StockTransfer = class StockTransfer {
    id;
    tenantId;
    companyId;
    branchId;
    voucherNo;
    transferDate;
    sourceGodownId;
    sourceGodown;
    destinationGodownId;
    destinationGodown;
    status;
    totalQty;
    totalAmount;
    notes;
    items;
    createdAt;
    updatedAt;
};
exports.StockTransfer = StockTransfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockTransfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], StockTransfer.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transfer_date', type: 'date' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "transferDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'source_godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "sourceGodownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'source_godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], StockTransfer.prototype, "sourceGodown", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'destination_godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "destinationGodownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'destination_godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], StockTransfer.prototype, "destinationGodown", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'COMPLETED' }),
    __metadata("design:type", String)
], StockTransfer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockTransfer.prototype, "totalQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StockTransfer.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockTransfer.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_transfer_item_entity_1.StockTransferItem, (item) => item.transfer, { cascade: true }),
    __metadata("design:type", Array)
], StockTransfer.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockTransfer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StockTransfer.prototype, "updatedAt", void 0);
exports.StockTransfer = StockTransfer = __decorate([
    (0, typeorm_1.Entity)('stock_transfers')
], StockTransfer);
//# sourceMappingURL=stock-transfer.entity.js.map