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
exports.CustomerReceiptAllocation = void 0;
const typeorm_1 = require("typeorm");
const customer_receipt_entity_1 = require("./customer-receipt.entity");
const sales_invoice_entity_1 = require("./sales-invoice.entity");
let CustomerReceiptAllocation = class CustomerReceiptAllocation {
    id;
    customerReceiptId;
    customerReceipt;
    salesInvoiceId;
    salesInvoice;
    allocatedAmount;
    createdAt;
};
exports.CustomerReceiptAllocation = CustomerReceiptAllocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerReceiptAllocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_receipt_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceiptAllocation.prototype, "customerReceiptId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_receipt_entity_1.CustomerReceipt, (cr) => cr.allocations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_receipt_id' }),
    __metadata("design:type", customer_receipt_entity_1.CustomerReceipt)
], CustomerReceiptAllocation.prototype, "customerReceipt", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sales_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerReceiptAllocation.prototype, "salesInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_invoice_entity_1.SalesInvoice, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_invoice_id' }),
    __metadata("design:type", sales_invoice_entity_1.SalesInvoice)
], CustomerReceiptAllocation.prototype, "salesInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allocated_amount', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], CustomerReceiptAllocation.prototype, "allocatedAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CustomerReceiptAllocation.prototype, "createdAt", void 0);
exports.CustomerReceiptAllocation = CustomerReceiptAllocation = __decorate([
    (0, typeorm_1.Entity)('customer_receipt_allocations')
], CustomerReceiptAllocation);
//# sourceMappingURL=customer-receipt-allocation.entity.js.map