import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { AccountingVoucher } from './entities/accounting-voucher.entity';
import { AccountingVoucherLine } from './entities/accounting-voucher-line.entity';
import { FinancialYear } from './entities/financial-year.entity';
import { Ledger } from '../masters/entities/ledger.entity';
import { AccountingService } from './services/accounting.service';
import { FinancialYearService } from './services/financial-year.service';
import { AccountingController } from './controllers/accounting.controller';
import { FinancialYearController } from './controllers/financial-year.controller';
import { VoucherSequenceService } from '../procure-to-pay/services/voucher-sequence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      AccountingVoucher,
      AccountingVoucherLine,
      FinancialYear,
      Ledger,
    ]),
  ],
  controllers: [AccountingController, FinancialYearController],
  providers: [AccountingService, FinancialYearService, VoucherSequenceService],
  exports: [AccountingService, FinancialYearService, TypeOrmModule],
})
export class AccountingModule {}
