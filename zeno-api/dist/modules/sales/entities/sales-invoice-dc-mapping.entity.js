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
exports.SalesInvoiceDcMapping = void 0;
const typeorm_1 = require("typeorm");
const sales_invoice_entity_1 = require("./sales-invoice.entity");
const delivery_challan_entity_1 = require("./delivery-challan.entity");
let SalesInvoiceDcMapping = class SalesInvoiceDcMapping {
    id;
    salesInvoiceId;
    salesInvoice;
    deliveryChallanId;
    deliveryChallan;
    createdAt;
};
exports.SalesInvoiceDcMapping = SalesInvoiceDcMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesInvoiceDcMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoiceDcMapping.prototype, "salesInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_invoice_entity_1.SalesInvoice, (si) => si.deliveryChallans, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_invoice_id' }),
    __metadata("design:type", sales_invoice_entity_1.SalesInvoice)
], SalesInvoiceDcMapping.prototype, "salesInvoice", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'delivery_challan_id', type: 'uuid' }),
    __metadata("design:type", String)
], SalesInvoiceDcMapping.prototype, "deliveryChallanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_challan_entity_1.DeliveryChallan, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_challan_id' }),
    __metadata("design:type", delivery_challan_entity_1.DeliveryChallan)
], SalesInvoiceDcMapping.prototype, "deliveryChallan", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SalesInvoiceDcMapping.prototype, "createdAt", void 0);
exports.SalesInvoiceDcMapping = SalesInvoiceDcMapping = __decorate([
    (0, typeorm_1.Entity)('sales_invoice_dc_mappings'),
    (0, typeorm_1.Unique)(['salesInvoiceId', 'deliveryChallanId'])
], SalesInvoiceDcMapping);
//# sourceMappingURL=sales-invoice-dc-mapping.entity.js.map