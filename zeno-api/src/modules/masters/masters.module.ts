import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerGroup } from './entities/ledger-group.entity';
import { Ledger } from './entities/ledger.entity';
import { Unit } from './entities/unit.entity';
import { ItemGroup } from './entities/item-group.entity';
import { ItemCategory } from './entities/item-category.entity';
import { Item } from './entities/item.entity';
import { ItemVariant } from './entities/item-variant.entity';
import { VariantDefinition } from './entities/variant-definition.entity';
import { MastersService } from './services/masters.service';
import { MastersController } from './controllers/masters.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerGroup,
      Ledger,
      Unit,
      ItemGroup,
      ItemCategory,
      Item,
      ItemVariant,
      VariantDefinition,
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService, TypeOrmModule],
})
export class MastersModule {}
