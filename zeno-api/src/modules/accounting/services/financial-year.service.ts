import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FinancialYear } from '../entities/financial-year.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { LedgerGroupNature, BalanceType } from '../../../common/enums';

@Injectable()
export class FinancialYearService {
  constructor(
    @InjectRepository(FinancialYear)
    private fyRepo: Repository<FinancialYear>,
    @InjectRepository(Ledger)
    private ledgerRepo: Repository<Ledger>,
    private dataSource: DataSource,
  ) {}

  async getFinancialYears(tenantId: string, companyId: string): Promise<FinancialYear[]> {
    let years = await this.fyRepo.find({
      where: { tenantId, companyId },
      order: { startDate: 'DESC' },
    });

    if (years.length === 0) {
      const initialFy = this.fyRepo.create({
        tenantId,
        companyId,
        name: 'F.Y. 2025-2026',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isClosed: false,
        isCurrent: true,
      });
      const saved = await this.fyRepo.save(initialFy);
      years = [saved];
    }

    return years;
  }

  async getCurrentFinancialYear(tenantId: string, companyId: string): Promise<FinancialYear> {
    const years = await this.getFinancialYears(tenantId, companyId);
    let current = years.find((y) => y.isCurrent);
    if (!current) {
      current = years.find((y) => !y.isClosed) || years[0];
    }
    return current;
  }

  async createFinancialYear(
    tenantId: string,
    companyId: string,
    data: { name: string; startDate: string; endDate: string },
  ): Promise<FinancialYear> {
    const years = await this.getFinancialYears(tenantId, companyId);
    const openFy = years.find((y) => !y.isClosed);

    if (openFy) {
      throw new BadRequestException(
        `Cannot create a new Financial Year. The current active Financial Year ('${openFy.name}') must be closed first before opening a new Financial Year.`,
      );
    }

    // Set all existing years as not current
    await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });

    const newFy = this.fyRepo.create({
      tenantId,
      companyId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isClosed: false,
      isCurrent: true,
    });

    return this.fyRepo.save(newFy);
  }

  async closeFinancialYearAndTransferBalances(
    tenantId: string,
    companyId: string,
    data: { fyId?: string; closingNotes?: string },
  ) {
    const years = await this.getFinancialYears(tenantId, companyId);
    let targetFy: FinancialYear | undefined;

    if (data.fyId) {
      targetFy = years.find((y) => y.id === data.fyId);
    } else {
      targetFy = years.find((y) => !y.isClosed);
    }

    if (!targetFy) {
      throw new NotFoundException('No active open Financial Year found to close.');
    }

    if (targetFy.isClosed) {
      throw new BadRequestException(`Financial Year '${targetFy.name}' is already closed.`);
    }

    // 1. Calculate & Transfer Balance Sheet Closing Balances as Opening Balances for the new year
    const ledgers = await this.ledgerRepo.find({
      where: { tenantId, companyId },
      relations: ['ledgerGroup'],
    });

    const balanceSheetNatures = [
      LedgerGroupNature.ASSET,
      LedgerGroupNature.LIABILITY,
    ];

    const balanceSheetLedgers = ledgers.filter(
      (l) => l.ledgerGroup && balanceSheetNatures.includes(l.ledgerGroup.nature),
    );

    for (const ledger of balanceSheetLedgers) {
      const lineRes = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(l.debit_amount), 0)::numeric as total_debit,
           COALESCE(SUM(l.credit_amount), 0)::numeric as total_credit
         FROM accounting_voucher_lines l
         INNER JOIN accounting_vouchers v ON v.id = l.voucher_id
         WHERE l.ledger_id = $1 
           AND v.tenant_id = $2 
           AND v.company_id = $3
           AND v.voucher_date >= $4 
           AND v.voucher_date <= $5`,
        [ledger.id, tenantId, companyId, targetFy.startDate, targetFy.endDate],
      );

      const totalDebit = parseFloat(lineRes?.[0]?.total_debit || '0');
      const totalCredit = parseFloat(lineRes?.[0]?.total_credit || '0');

      const initialOpening = Number(ledger.openingBalance || 0);
      const initialType = ledger.balanceType === BalanceType.CR ? -1 : 1;

      const netClosing = initialOpening * initialType + (totalDebit - totalCredit);

      if (netClosing >= 0) {
        ledger.openingBalance = Number(netClosing.toFixed(2));
        ledger.balanceType = BalanceType.DR;
      } else {
        ledger.openingBalance = Number(Math.abs(netClosing).toFixed(2));
        ledger.balanceType = BalanceType.CR;
      }

      await this.ledgerRepo.save(ledger);
    }

    // 2. Mark current Financial Year as closed
    targetFy.isClosed = true;
    targetFy.closedAt = new Date();
    targetFy.isCurrent = false;
    targetFy.closingNotes = data.closingNotes || 'Closed & transferred closing balances to new F.Y.';
    await this.fyRepo.save(targetFy);

    // 3. Compute next Financial Year dates
    const startYear = parseInt(targetFy.startDate.substring(0, 4), 10) + 1;
    const endYear = parseInt(targetFy.endDate.substring(0, 4), 10) + 1;
    const nextStartDate = `${startYear}-04-01`;
    const nextEndDate = `${endYear}-03-31`;
    const nextName = `F.Y. ${startYear}-${endYear}`;

    // Ensure all other FYs are marked not current
    await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });

    const newFy = this.fyRepo.create({
      tenantId,
      companyId,
      name: nextName,
      startDate: nextStartDate,
      endDate: nextEndDate,
      isClosed: false,
      isCurrent: true,
    });

    const savedNewFy = await this.fyRepo.save(newFy);

    return {
      closedFy: targetFy,
      newFy: savedNewFy,
      transferredLedgersCount: balanceSheetLedgers.length,
      message: `Financial Year '${targetFy.name}' successfully closed. Transferred closing balances for ${balanceSheetLedgers.length} balance sheet head(s) into new active '${savedNewFy.name}'.`,
    };
  }

  async setCurrentFinancialYear(
    tenantId: string,
    companyId: string,
    fyId: string,
  ): Promise<FinancialYear> {
    const year = await this.fyRepo.findOne({ where: { id: fyId, tenantId, companyId } });
    if (!year) {
      throw new NotFoundException('Financial Year not found.');
    }

    await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });
    year.isCurrent = true;
    return this.fyRepo.save(year);
  }
}
