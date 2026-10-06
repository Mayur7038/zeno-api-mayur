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
exports.VendorPaymentAllocation = void 0;
const typeorm_1 = require("typeorm");
const vendor_payment_entity_1 = require("./vendor-payment.entity");
const purchase_invoice_entity_1 = require("./purchase-invoice.entity");
let VendorPaymentAllocation = class VendorPaymentAllocation {
    id;
    vendorPaymentId;
    vendorPayment;
    purchaseInvoiceId;
    purchaseInvoice;
    allocatedAmount;
    discountAmount;
    createdAt;
};
exports.VendorPaymentAllocation = VendorPaymentAllocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VendorPaymentAllocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'vendor_payment_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPaymentAllocation.prototype, "vendorPaymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_payment_entity_1.VendorPayment, (vp) => vp.allocations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_payment_id' }),
    __metadata("design:type", vendor_payment_entity_1.VendorPayment)
], VendorPaymentAllocation.prototype, "vendorPayment", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'purchase_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], VendorPaymentAllocation.prototype, "purchaseInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_invoice_entity_1.PurchaseInvoice, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_invoice_id' }),
    __metadata("design:type", purchase_invoice_entity_1.PurchaseInvoice)
], VendorPaymentAllocation.prototype, "purchaseInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allocated_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], VendorPaymentAllocation.prototype, "allocatedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], VendorPaymentAllocation.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VendorPaymentAllocation.prototype, "createdAt", void 0);
exports.VendorPaymentAllocation = VendorPaymentAllocation = __decorate([
    (0, typeorm_1.Entity)('vendor_payment_allocations')
], VendorPaymentAllocation);
//# sourceMappingURL=vendor-payment-allocation.entity.js.map