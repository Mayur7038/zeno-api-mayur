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
exports.StockLedger = void 0;
const typeorm_1 = require("typeorm");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const rack_bin_entity_1 = require("../../tenancy/entities/rack-bin.entity");
let StockLedger = class StockLedger {
    id;
    tenantId;
    companyId;
    branchId;
    godownId;
    godown;
    rackBinId;
    rackBin;
    itemId;
    item;
    variantId;
    variant;
    entryDate;
    voucherType;
    voucherId;
    voucherNo;
    qtyIn;
    qtyOut;
    unitRate;
    totalValue;
    createdAt;
};
exports.StockLedger = StockLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], StockLedger.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'rack_bin_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StockLedger.prototype, "rackBinId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rack_bin_entity_1.RackBin, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'rack_bin_id' }),
    __metadata("design:type", rack_bin_entity_1.RackBin)
], StockLedger.prototype, "rackBin", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], StockLedger.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StockLedger.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], StockLedger.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_date', type: 'date' }),
    __metadata("design:type", String)
], StockLedger.prototype, "entryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_type', length: 40 }),
    __metadata("design:type", String)
], StockLedger.prototype, "voucherType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'voucher_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockLedger.prototype, "voucherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 60 }),
    __metadata("design:type", String)
], StockLedger.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qty_in', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockLedger.prototype, "qtyIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qty_out', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], StockLedger.prototype, "qtyOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], StockLedger.prototype, "unitRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StockLedger.prototype, "totalValue", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockLedger.prototype, "createdAt", void 0);
exports.StockLedger = StockLedger = __decorate([
    (0, typeorm_1.Entity)('stock_ledger')
], StockLedger);
//# sourceMappingURL=stock-ledger.entity.js.map