import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLedger } from './entities/stock-ledger.entity';
import { StockTransfer } from './entities/stock-transfer.entity';
import { StockTransferItem } from './entities/stock-transfer-item.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { StockAdjustmentItem } from './entities/stock-adjustment-item.entity';
import { PriceList } from './entities/price-list.entity';
import { PriceListItem } from './entities/price-list-item.entity';
import { Godown } from '../tenancy/entities/godown.entity';
import { Item } from '../masters/entities/item.entity';

import { InventoryService } from './services/inventory.service';
import { StockTransferService } from './services/stock-transfer.service';
import { StockAdjustmentService } from './services/stock-adjustment.service';
import { PriceListService } from './services/price-list.service';

import { InventoryController } from './controllers/inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockLedger,
      StockTransfer,
      StockTransferItem,
      StockAdjustment,
      StockAdjustmentItem,
      PriceList,
      PriceListItem,
      Godown,
      Item,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockTransferService,
    StockAdjustmentService,
    PriceListService,
  ],
  exports: [
    InventoryService,
    StockTransferService,
    StockAdjustmentService,
    PriceListService,
    TypeOrmModule,
  ],
})
export class InventoryModule {}
