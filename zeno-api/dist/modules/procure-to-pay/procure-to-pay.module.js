"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcureToPayModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const voucher_sequence_entity_1 = require("./entities/voucher-sequence.entity");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const purchase_order_item_entity_1 = require("./entities/purchase-order-item.entity");
const goods_receipt_note_entity_1 = require("./entities/goods-receipt-note.entity");
const grn_item_entity_1 = require("./entities/grn-item.entity");
const grn_po_mapping_entity_1 = require("./entities/grn-po-mapping.entity");
const purchase_invoice_entity_1 = require("./entities/purchase-invoice.entity");
const purchase_invoice_item_entity_1 = require("./entities/purchase-invoice-item.entity");
const purchase_invoice_grn_mapping_entity_1 = require("./entities/purchase-invoice-grn-mapping.entity");
const purchase_return_entity_1 = require("./entities/purchase-return.entity");
const purchase_return_item_entity_1 = require("./entities/purchase-return-item.entity");
const vendor_payment_entity_1 = require("./entities/vendor-payment.entity");
const vendor_payment_allocation_entity_1 = require("./entities/vendor-payment-allocation.entity");
const voucher_sequence_service_1 = require("./services/voucher-sequence.service");
const procure_to_pay_service_1 = require("./services/procure-to-pay.service");
const procure_to_pay_controller_1 = require("./controllers/procure-to-pay.controller");
const accounting_module_1 = require("../accounting/accounting.module");
const inventory_module_1 = require("../inventory/inventory.module");
const settings_module_1 = require("../settings/settings.module");
let ProcureToPayModule = class ProcureToPayModule {
};
exports.ProcureToPayModule = ProcureToPayModule;
exports.ProcureToPayModule = ProcureToPayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                voucher_sequence_entity_1.VoucherSequence,
                purchase_order_entity_1.PurchaseOrder,
                purchase_order_item_entity_1.PurchaseOrderItem,
                goods_receipt_note_entity_1.GoodsReceiptNote,
                grn_item_entity_1.GrnItem,
                grn_po_mapping_entity_1.GrnPoMapping,
                purchase_invoice_entity_1.PurchaseInvoice,
                purchase_invoice_item_entity_1.PurchaseInvoiceItem,
                purchase_invoice_grn_mapping_entity_1.PurchaseInvoiceGrnMapping,
                purchase_return_entity_1.PurchaseReturn,
                purchase_return_item_entity_1.PurchaseReturnItem,
                vendor_payment_entity_1.VendorPayment,
                vendor_payment_allocation_entity_1.VendorPaymentAllocation,
            ]),
            accounting_module_1.AccountingModule,
            inventory_module_1.InventoryModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [procure_to_pay_controller_1.ProcureToPayController],
        providers: [voucher_sequence_service_1.VoucherSequenceService, procure_to_pay_service_1.ProcureToPayService],
        exports: [voucher_sequence_service_1.VoucherSequenceService, procure_to_pay_service_1.ProcureToPayService, typeorm_1.TypeOrmModule],
    })
], ProcureToPayModule);
//# sourceMappingURL=procure-to-pay.module.js.map