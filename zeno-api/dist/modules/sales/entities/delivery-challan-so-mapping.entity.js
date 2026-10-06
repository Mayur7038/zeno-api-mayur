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
exports.DeliveryChallanSoMapping = void 0;
const typeorm_1 = require("typeorm");
const delivery_challan_entity_1 = require("./delivery-challan.entity");
const sales_order_entity_1 = require("./sales-order.entity");
let DeliveryChallanSoMapping = class DeliveryChallanSoMapping {
    id;
    deliveryChallanId;
    deliveryChallan;
    salesOrderId;
    salesOrder;
    createdAt;
};
exports.DeliveryChallanSoMapping = DeliveryChallanSoMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryChallanSoMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'delivery_challan_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallanSoMapping.prototype, "deliveryChallanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_challan_entity_1.DeliveryChallan, (dc) => dc.salesOrders, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_challan_id' }),
    __metadata("design:type", delivery_challan_entity_1.DeliveryChallan)
], DeliveryChallanSoMapping.prototype, "deliveryChallan", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_order_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallanSoMapping.prototype, "salesOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], DeliveryChallanSoMapping.prototype, "salesOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeliveryChallanSoMapping.prototype, "createdAt", void 0);
exports.DeliveryChallanSoMapping = DeliveryChallanSoMapping = __decorate([
    (0, typeorm_1.Entity)('delivery_challan_so_mappings'),
    (0, typeorm_1.Unique)(['deliveryChallanId', 'salesOrderId'])
], DeliveryChallanSoMapping);
//# sourceMappingURL=delivery-challan-so-mapping.entity.js.map