import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VoucherSequence } from './entities/voucher-sequence.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GrnItem } from './entities/grn-item.entity';
import { GrnPoMapping } from './entities/grn-po-mapping.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { PurchaseInvoiceGrnMapping } from './entities/purchase-invoice-grn-mapping.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { VendorPayment } from './entities/vendor-payment.entity';
import { VendorPaymentAllocation } from './entities/vendor-payment-allocation.entity';

import { VoucherSequenceService } from './services/voucher-sequence.service';
import { ProcureToPayService } from './services/procure-to-pay.service';
import { ProcureToPayController } from './controllers/procure-to-pay.controller';

import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherSequence,
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceiptNote,
      GrnItem,
      GrnPoMapping,
      PurchaseInvoice,
      PurchaseInvoiceItem,
      PurchaseInvoiceGrnMapping,
      PurchaseReturn,
      PurchaseReturnItem,
      VendorPayment,
      VendorPaymentAllocation,
    ]),
    AccountingModule,
    InventoryModule,
    SettingsModule,
  ],
  controllers: [ProcureToPayController],
  providers: [VoucherSequenceService, ProcureToPayService],
  exports: [VoucherSequenceService, ProcureToPayService, TypeOrmModule],
})
export class ProcureToPayModule {}
