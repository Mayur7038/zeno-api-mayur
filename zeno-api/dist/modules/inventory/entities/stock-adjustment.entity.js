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
exports.StockAdjustment = void 0;
const typeorm_1 = require("typeorm");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const stock_adjustment_item_entity_1 = require("./stock-adjustment-item.entity");
let StockAdjustment = class StockAdjustment {
    id;
    tenantId;
    companyId;
    branchId;
    voucherNo;
    adjustmentDate;
    godownId;
    godown;
    reason;
    status;
    totalQty;
    totalAmount;
    notes;
    items;
    createdAt;
    updatedAt;
};
exports.StockAdjustment = StockAdjustment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockAdjustment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adjustment_date', type: 'date' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "adjustmentDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], StockAdjustment.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40, default: 'CORRECTION' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'COMPLETED' }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockAdjustment.prototype, "totalQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StockAdjustment.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockAdjustment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_adjustment_item_entity_1.StockAdjustmentItem, (item) => item.adjustment, { cascade: true }),
    __metadata("design:type", Array)
], StockAdjustment.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockAdjustment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StockAdjustment.prototype, "updatedAt", void 0);
exports.StockAdjustment = StockAdjustment = __decorate([
    (0, typeorm_1.Entity)('stock_adjustments')
], StockAdjustment);
//# sourceMappingURL=stock-adjustment.entity.js.map