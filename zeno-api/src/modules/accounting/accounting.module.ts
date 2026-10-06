import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { AccountingVoucher } from './entities/accounting-voucher.entity';
import { AccountingVoucherLine } from './entities/accounting-voucher-line.entity';
import { AccountingService } from './services/accounting.service';
import { AccountingController } from './controllers/accounting.controller';
import { VoucherSequenceService } from '../procure-to-pay/services/voucher-sequence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      AccountingVoucher,
      AccountingVoucherLine,
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService, VoucherSequenceService],
  exports: [AccountingService, TypeOrmModule],
})
export class AccountingModule {}

