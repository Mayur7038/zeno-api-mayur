import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { AccountingService } from '../services/accounting.service';
import { CreateAccountingVoucherDto } from '../dto/create-accounting-voucher.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Accounting & Ledgers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private accountingService: AccountingService,
    @InjectRepository(LedgerEntry)
    private entryRepo: Repository<LedgerEntry>,
  ) {}

  @Get('vouchers')
  @ApiOperation({ summary: 'Get list of accounting vouchers (Payment, Receipt, Contra, Journal, Debit/Credit Notes)' })
  async getVouchers(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('voucherType') voucherType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return await this.accountingService.getVouchers(tenantId, companyId, {
      voucherType,
      startDate,
      endDate,
      search,
    });
  }

  @Get('vouchers/:id')
  @ApiOperation({ summary: 'Get voucher details with lines and general ledger postings' })
  async getVoucherById(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return await this.accountingService.getVoucherById(tenantId, companyId, id);
  }

  @Post('vouchers')
  @ApiOperation({ summary: 'Create accounting voucher and post double-entry ledger entries' })
  async createVoucher(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateAccountingVoucherDto,
  ) {
    return await this.accountingService.createVoucher(tenantId, user?.id, dto);
  }

  @Put('vouchers/:id/cancel')
  @ApiOperation({ summary: 'Cancel voucher and reverse general ledger entries' })
  async cancelVoucher(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.accountingService.cancelVoucher(tenantId, user?.id, id, reason);
  }

  @Get('ledger-statement')
  @ApiOperation({ summary: 'Get statement of entries for a ledger' })
  async getLedgerStatement(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('ledgerId') ledgerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const qb = this.entryRepo
      .createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.company_id = :companyId', { companyId })
      .andWhere('e.ledger_id = :ledgerId', { ledgerId });

    if (startDate) qb.andWhere('e.entry_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.entry_date <= :endDate', { endDate });

    const entries = await qb.orderBy('e.entry_date', 'ASC').addOrderBy('e.created_at', 'ASC').getMany();

    const totalDebit = entries.reduce((s, e) => s + Number(e.debitAmount), 0);
    const totalCredit = entries.reduce((s, e) => s + Number(e.creditAmount), 0);

    return {
      ledgerId,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      netBalance: Number((totalDebit - totalCredit).toFixed(2)),
      entries,
    };
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Generate balanced Trial Balance report' })
  async getTrialBalance(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    const raw = await this.entryRepo
      .createQueryBuilder('e')
      .innerJoin('e.ledger', 'ledger')
      .select('ledger.id', 'ledgerId')
      .addSelect('ledger.name', 'ledgerName')
      .addSelect('SUM(e.debit_amount)', 'totalDebit')
      .addSelect('SUM(e.credit_amount)', 'totalCredit')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.company_id = :companyId', { companyId })
      .groupBy('ledger.id')
      .addGroupBy('ledger.name')
      .getRawMany();

    let grandDebit = 0;
    let grandCredit = 0;

    const rows = raw.map((r) => {
      const dr = Number(r.totalDebit || 0);
      const cr = Number(r.totalCredit || 0);
      grandDebit += dr;
      grandCredit += cr;
      return {
        ledgerId: r.ledgerId,
        ledgerName: r.ledgerName,
        debit: Number(dr.toFixed(2)),
        credit: Number(cr.toFixed(2)),
        balance: Number((dr - cr).toFixed(2)),
      };
    });

    return {
      totalDebit: Number(grandDebit.toFixed(2)),
      totalCredit: Number(grandCredit.toFixed(2)),
      isBalanced: Math.abs(grandDebit - grandCredit) < 0.05,
      rows,
    };
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss statement grouped by Income and Expense ledger groups' })
  async getProfitLoss(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const qb = this.entryRepo
      .createQueryBuilder('e')
      .innerJoin('e.ledger', 'ledger')
      .innerJoin('ledger.ledgerGroup', 'grp')
      .select('ledger.id', 'ledgerId')
      .addSelect('ledger.name', 'ledgerName')
      .addSelect('grp.id', 'groupId')
      .addSelect('grp.name', 'groupName')
      .addSelect('grp.nature', 'nature')
      .addSelect('SUM(e.debit_amount)', 'totalDebit')
      .addSelect('SUM(e.credit_amount)', 'totalCredit')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.company_id = :companyId', { companyId })
      .andWhere("grp.nature IN ('INCOME', 'EXPENSE')")
      .groupBy('ledger.id')
      .addGroupBy('ledger.name')
      .addGroupBy('grp.id')
      .addGroupBy('grp.name')
      .addGroupBy('grp.nature');

    if (startDate) qb.andWhere('e.entry_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.entry_date <= :endDate', { endDate });

    const raw = await qb.getRawMany();
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeRows: any[] = [];
    const expenseRows: any[] = [];

    for (const r of raw) {
      const dr = Number(r.totalDebit || 0);
      const cr = Number(r.totalCredit || 0);
      const row = {
        ledgerId: r.ledgerId,
        ledgerName: r.ledgerName,
        groupId: r.groupId,
        groupName: r.groupName,
        nature: r.nature,
        debit: Number(dr.toFixed(2)),
        credit: Number(cr.toFixed(2)),
        amount: r.nature === 'INCOME'
          ? Number((cr - dr).toFixed(2))
          : Number((dr - cr).toFixed(2)),
      };
      if (r.nature === 'INCOME') { totalIncome += row.amount; incomeRows.push(row); }
      else { totalExpense += row.amount; expenseRows.push(row); }
    }

    const netProfit = Number((totalIncome - totalExpense).toFixed(2));
    return {
      incomeRows, expenseRows,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netProfit, isProfit: netProfit >= 0,
    };
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance Sheet grouped by Asset and Liability ledger groups' })
  async getBalanceSheet(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const qb = this.entryRepo
      .createQueryBuilder('e')
      .innerJoin('e.ledger', 'ledger')
      .innerJoin('ledger.ledgerGroup', 'grp')
      .select('ledger.id', 'ledgerId')
      .addSelect('ledger.name', 'ledgerName')
      .addSelect('ledger.opening_balance', 'openingBalance')
      .addSelect('ledger.balance_type', 'balanceType')
      .addSelect('grp.id', 'groupId')
      .addSelect('grp.name', 'groupName')
      .addSelect('grp.nature', 'nature')
      .addSelect('SUM(e.debit_amount)', 'totalDebit')
      .addSelect('SUM(e.credit_amount)', 'totalCredit')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.company_id = :companyId', { companyId })
      .andWhere("grp.nature IN ('ASSET', 'LIABILITY')")
      .groupBy('ledger.id').addGroupBy('ledger.name')
      .addGroupBy('ledger.opening_balance').addGroupBy('ledger.balance_type')
      .addGroupBy('grp.id').addGroupBy('grp.name').addGroupBy('grp.nature');

    if (asOfDate) qb.andWhere('e.entry_date <= :asOfDate', { asOfDate });

    const raw = await qb.getRawMany();
    let totalAssets = 0;
    let totalLiabilities = 0;
    const assetRows: any[] = [];
    const liabilityRows: any[] = [];

    for (const r of raw) {
      const dr = Number(r.totalDebit || 0);
      const cr = Number(r.totalCredit || 0);
      const ob = Number(r.openingBalance || 0);
      const isObDr = (r.balanceType || 'DR') === 'DR';
      const netDebit = dr + (isObDr ? ob : 0);
      const netCredit = cr + (isObDr ? 0 : ob);
      const row = {
        ledgerId: r.ledgerId, ledgerName: r.ledgerName,
        groupId: r.groupId, groupName: r.groupName, nature: r.nature,
        openingBalance: ob,
        debit: Number(netDebit.toFixed(2)), credit: Number(netCredit.toFixed(2)),
        amount: r.nature === 'ASSET'
          ? Number((netDebit - netCredit).toFixed(2))
          : Number((netCredit - netDebit).toFixed(2)),
      };
      if (r.nature === 'ASSET') { totalAssets += row.amount; assetRows.push(row); }
      else { totalLiabilities += row.amount; liabilityRows.push(row); }
    }

    return {
      assetRows, liabilityRows,
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      isBalanced: Math.abs(totalAssets - totalLiabilities) < 1,
    };
  }
}
