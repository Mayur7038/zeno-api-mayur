"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("./entities/sales-order.entity");
const sales_order_item_entity_1 = require("./entities/sales-order-item.entity");
const delivery_challan_entity_1 = require("./entities/delivery-challan.entity");
const delivery_challan_item_entity_1 = require("./entities/delivery-challan-item.entity");
const delivery_challan_so_mapping_entity_1 = require("./entities/delivery-challan-so-mapping.entity");
const sales_invoice_entity_1 = require("./entities/sales-invoice.entity");
const sales_invoice_item_entity_1 = require("./entities/sales-invoice-item.entity");
const sales_invoice_dc_mapping_entity_1 = require("./entities/sales-invoice-dc-mapping.entity");
const sales_return_entity_1 = require("./entities/sales-return.entity");
const sales_return_item_entity_1 = require("./entities/sales-return-item.entity");
const customer_receipt_entity_1 = require("./entities/customer-receipt.entity");
const customer_receipt_allocation_entity_1 = require("./entities/customer-receipt-allocation.entity");
const sales_service_1 = require("./services/sales.service");
const sales_controller_1 = require("./controllers/sales.controller");
const procure_to_pay_module_1 = require("../procure-to-pay/procure-to-pay.module");
const accounting_module_1 = require("../accounting/accounting.module");
const inventory_module_1 = require("../inventory/inventory.module");
const settings_module_1 = require("../settings/settings.module");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sales_order_entity_1.SalesOrder,
                sales_order_item_entity_1.SalesOrderItem,
                delivery_challan_entity_1.DeliveryChallan,
                delivery_challan_item_entity_1.DeliveryChallanItem,
                delivery_challan_so_mapping_entity_1.DeliveryChallanSoMapping,
                sales_invoice_entity_1.SalesInvoice,
                sales_invoice_item_entity_1.SalesInvoiceItem,
                sales_invoice_dc_mapping_entity_1.SalesInvoiceDcMapping,
                sales_return_entity_1.SalesReturn,
                sales_return_item_entity_1.SalesReturnItem,
                customer_receipt_entity_1.CustomerReceipt,
                customer_receipt_allocation_entity_1.CustomerReceiptAllocation,
            ]),
            procure_to_pay_module_1.ProcureToPayModule,
            accounting_module_1.AccountingModule,
            inventory_module_1.InventoryModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [sales_service_1.SalesService],
        exports: [sales_service_1.SalesService, typeorm_1.TypeOrmModule],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map