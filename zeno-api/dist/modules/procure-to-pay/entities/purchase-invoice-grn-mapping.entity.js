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
exports.PurchaseInvoiceGrnMapping = void 0;
const typeorm_1 = require("typeorm");
const purchase_invoice_entity_1 = require("./purchase-invoice.entity");
const goods_receipt_note_entity_1 = require("./goods-receipt-note.entity");
let PurchaseInvoiceGrnMapping = class PurchaseInvoiceGrnMapping {
    id;
    purchaseInvoiceId;
    purchaseInvoice;
    grnId;
    grn;
};
exports.PurchaseInvoiceGrnMapping = PurchaseInvoiceGrnMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseInvoiceGrnMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoiceGrnMapping.prototype, "purchaseInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_invoice_entity_1.PurchaseInvoice, (pi) => pi.grnMappings, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_invoice_id' }),
    __metadata("design:type", purchase_invoice_entity_1.PurchaseInvoice)
], PurchaseInvoiceGrnMapping.prototype, "purchaseInvoice", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'grn_id', type: 'uuid' }),
    __metadata("design:type", String)
], PurchaseInvoiceGrnMapping.prototype, "grnId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => goods_receipt_note_entity_1.GoodsReceiptNote, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'grn_id' }),
    __metadata("design:type", goods_receipt_note_entity_1.GoodsReceiptNote)
], PurchaseInvoiceGrnMapping.prototype, "grn", void 0);
exports.PurchaseInvoiceGrnMapping = PurchaseInvoiceGrnMapping = __decorate([
    (0, typeorm_1.Entity)('purchase_invoice_grn_mappings'),
    (0, typeorm_1.Unique)(['purchaseInvoiceId', 'grnId'])
], PurchaseInvoiceGrnMapping);
//# sourceMappingURL=purchase-invoice-grn-mapping.entity.js.map