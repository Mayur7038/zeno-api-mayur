import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { DeliveryChallan } from './entities/delivery-challan.entity';
import { DeliveryChallanItem } from './entities/delivery-challan-item.entity';
import { DeliveryChallanSoMapping } from './entities/delivery-challan-so-mapping.entity';
import { SalesInvoice } from './entities/sales-invoice.entity';
import { SalesInvoiceItem } from './entities/sales-invoice-item.entity';
import { SalesInvoiceDcMapping } from './entities/sales-invoice-dc-mapping.entity';
import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';
import { CustomerReceipt } from './entities/customer-receipt.entity';
import { CustomerReceiptAllocation } from './entities/customer-receipt-allocation.entity';

import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';

import { ProcureToPayModule } from '../procure-to-pay/procure-to-pay.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderItem,
      DeliveryChallan,
      DeliveryChallanItem,
      DeliveryChallanSoMapping,
      SalesInvoice,
      SalesInvoiceItem,
      SalesInvoiceDcMapping,
      SalesReturn,
      SalesReturnItem,
      CustomerReceipt,
      CustomerReceiptAllocation,
    ]),
    ProcureToPayModule,
    AccountingModule,
    InventoryModule,
    SettingsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, TypeOrmModule],
})
export class SalesModule {}
