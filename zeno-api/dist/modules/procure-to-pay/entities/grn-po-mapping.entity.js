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
exports.GrnPoMapping = void 0;
const typeorm_1 = require("typeorm");
const goods_receipt_note_entity_1 = require("./goods-receipt-note.entity");
const purchase_order_entity_1 = require("./purchase-order.entity");
let GrnPoMapping = class GrnPoMapping {
    id;
    grnId;
    grn;
    purchaseOrderId;
    purchaseOrder;
};
exports.GrnPoMapping = GrnPoMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GrnPoMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'grn_id', type: 'uuid' }),
    __metadata("design:type", String)
], GrnPoMapping.prototype, "grnId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => goods_receipt_note_entity_1.GoodsReceiptNote, (grn) => grn.poMappings, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grn_id' }),
    __metadata("design:type", goods_receipt_note_entity_1.GoodsReceiptNote)
], GrnPoMapping.prototype, "grn", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_order_id', type: 'uuid' }),
    __metadata("design:type", String)
], GrnPoMapping.prototype, "purchaseOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_entity_1.PurchaseOrder, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_id' }),
    __metadata("design:type", purchase_order_entity_1.PurchaseOrder)
], GrnPoMapping.prototype, "purchaseOrder", void 0);
exports.GrnPoMapping = GrnPoMapping = __decorate([
    (0, typeorm_1.Entity)('grn_po_mappings'),
    (0, typeorm_1.Unique)(['grnId', 'purchaseOrderId'])
], GrnPoMapping);
//# sourceMappingURL=grn-po-mapping.entity.js.map