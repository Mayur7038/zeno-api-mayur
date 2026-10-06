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
exports.StockCount = void 0;
const typeorm_1 = require("typeorm");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const stock_count_item_entity_1 = require("./stock-count-item.entity");
let StockCount = class StockCount {
    id;
    tenantId;
    companyId;
    branchId;
    voucherNo;
    countDate;
    godownId;
    godown;
    status;
    totalBookQty;
    totalPhysicalQty;
    discrepancyQty;
    discrepancyValue;
    notes;
    items;
    createdAt;
    updatedAt;
};
exports.StockCount = StockCount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockCount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCount.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCount.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCount.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], StockCount.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'count_date', type: 'date' }),
    __metadata("design:type", String)
], StockCount.prototype, "countDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockCount.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], StockCount.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'IN_PROGRESS' }),
    __metadata("design:type", String)
], StockCount.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_book_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCount.prototype, "totalBookQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_physical_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCount.prototype, "totalPhysicalQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discrepancy_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockCount.prototype, "discrepancyQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discrepancy_value', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StockCount.prototype, "discrepancyValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockCount.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_count_item_entity_1.StockCountItem, (item) => item.stockCount, { cascade: true }),
    __metadata("design:type", Array)
], StockCount.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockCount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StockCount.prototype, "updatedAt", void 0);
exports.StockCount = StockCount = __decorate([
    (0, typeorm_1.Entity)('stock_counts')
], StockCount);
//# sourceMappingURL=stock-count.entity.js.map