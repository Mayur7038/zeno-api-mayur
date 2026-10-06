import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillOfMaterials } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionEntry } from './entities/production-entry.entity';
import { ProductionItem } from './entities/production-item.entity';
import { StockLedger } from '../inventory/entities/stock-ledger.entity';
import { Item } from '../masters/entities/item.entity';
import { ManufacturingService } from './services/manufacturing.service';
import { ManufacturingController } from './controllers/manufacturing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillOfMaterials,
      BomItem,
      ProductionEntry,
      ProductionItem,
      StockLedger,
      Item,
    ]),
  ],
  controllers: [ManufacturingController],
  providers: [ManufacturingService],
  exports: [ManufacturingService],
})
export class ManufacturingModule {}
