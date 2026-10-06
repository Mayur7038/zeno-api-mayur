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
exports.GrnItem = void 0;
const typeorm_1 = require("typeorm");
const goods_receipt_note_entity_1 = require("./goods-receipt-note.entity");
const purchase_order_item_entity_1 = require("./purchase-order-item.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const item_variant_entity_1 = require("../../masters/entities/item-variant.entity");
const unit_entity_1 = require("../../masters/entities/unit.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const rack_bin_entity_1 = require("../../tenancy/entities/rack-bin.entity");
let GrnItem = class GrnItem {
    id;
    grnId;
    grn;
    poItemId;
    poItem;
    itemId;
    item;
    variantId;
    variant;
    unitId;
    unit;
    godownId;
    godown;
    rackBinId;
    rackBin;
    receivedQty;
    invoicedQty;
    rate;
    totalAmount;
    createdAt;
};
exports.GrnItem = GrnItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GrnItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'grn_id', type: 'uuid' }),
    __metadata("design:type", String)
], GrnItem.prototype, "grnId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => goods_receipt_note_entity_1.GoodsReceiptNote, (grn) => grn.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grn_id' }),
    __metadata("design:type", goods_receipt_note_entity_1.GoodsReceiptNote)
], GrnItem.prototype, "grn", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'po_item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GrnItem.prototype, "poItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_item_entity_1.PurchaseOrderItem, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'po_item_id' }),
    __metadata("design:type", purchase_order_item_entity_1.PurchaseOrderItem)
], GrnItem.prototype, "poItem", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid' }),
    __metadata("design:type", String)
], GrnItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], GrnItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GrnItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_variant_entity_1.ItemVariant, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", item_variant_entity_1.ItemVariant)
], GrnItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'unit_id', type: 'uuid' }),
    __metadata("design:type", String)
], GrnItem.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", unit_entity_1.Unit)
], GrnItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GrnItem.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], GrnItem.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'rack_bin_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GrnItem.prototype, "rackBinId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rack_bin_entity_1.RackBin, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'rack_bin_id' }),
    __metadata("design:type", rack_bin_entity_1.RackBin)
], GrnItem.prototype, "rackBin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_qty', type: 'decimal', precision: 15, scale: 3 }),
    __metadata("design:type", Number)
], GrnItem.prototype, "receivedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoiced_qty', type: 'decimal', precision: 15, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], GrnItem.prototype, "invoicedQty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], GrnItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], GrnItem.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GrnItem.prototype, "createdAt", void 0);
exports.GrnItem = GrnItem = __decorate([
    (0, typeorm_1.Entity)('grn_items')
], GrnItem);
//# sourceMappingURL=grn-item.entity.js.map