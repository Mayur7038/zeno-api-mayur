import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { AccountingVoucher } from '../entities/accounting-voucher.entity';
import { AccountingVoucherLine } from '../entities/accounting-voucher-line.entity';
import { VoucherSequenceService } from '../../procure-to-pay/services/voucher-sequence.service';
import { VoucherType } from '../../../common/enums';
import { CreateAccountingVoucherDto } from '../dto/create-accounting-voucher.dto';

export interface LedgerPostingLine {
  ledgerId: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

export interface PostVoucherParams {
  tenantId: string;
  companyId: string;
  branchId: string;
  entryDate: string;
  voucherType: string;
  voucherId: string;
  voucherNo: string;
  lines: LedgerPostingLine[];
}

@Injectable()
export class AccountingService {
  constructor(
    private dataSource: DataSource,
    private sequenceService: VoucherSequenceService,
    @InjectRepository(AccountingVoucher)
    private voucherRepo: Repository<AccountingVoucher>,
    @InjectRepository(AccountingVoucherLine)
    private voucherLineRepo: Repository<AccountingVoucherLine>,
    @InjectRepository(LedgerEntry)
    private entryRepo: Repository<LedgerEntry>,
  ) {}

  /**
   * Posts double-entry balanced debit/credit lines into the general ledger.
   * Throws BadRequestException if total debit does not equal total credit.
   */
  async postTransaction(
    manager: EntityManager,
    params: PostVoucherParams,
  ): Promise<LedgerEntry[]> {
    const {
      tenantId,
      companyId,
      branchId,
      entryDate,
      voucherType,
      voucherId,
      voucherNo,
      lines,
    } = params;

    // Filter out zero-amount lines
    const activeLines = lines.filter(
      (l) => Number(l.debitAmount || 0) > 0 || Number(l.creditAmount || 0) > 0,
    );

    if (activeLines.length < 2) {
      throw new BadRequestException(
        'Double-entry transaction requires at least two balanced accounts',
      );
    }

    // Verify debit == credit
    const totalDebit = activeLines.reduce(
      (sum, l) => sum + Number(l.debitAmount || 0),
      0,
    );
    const totalCredit = activeLines.reduce(
      (sum, l) => sum + Number(l.creditAmount || 0),
      0,
    );

    const diff = Math.abs(Number(totalDebit.toFixed(2)) - Number(totalCredit.toFixed(2)));
    if (diff > 0.05) {
      throw new BadRequestException(
        `Double-entry unbalanced! Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`,
      );
    }

    const entries: LedgerEntry[] = [];
    for (const line of activeLines) {
      const entry = manager.create(LedgerEntry, {
        tenantId,
        companyId,
        branchId,
        entryDate,
        voucherType,
        voucherId,
        voucherNo,
        ledgerId: line.ledgerId,
        debitAmount: Number(Number(line.debitAmount || 0).toFixed(2)),
        creditAmount: Number(Number(line.creditAmount || 0).toFixed(2)),
        narration: line.narration || `${voucherType} #${voucherNo}`,
      });
      entries.push(entry);
    }

    return await manager.save(LedgerEntry, entries);
  }

  /**
   * Reverses an existing voucher's entries with compensating debits and credits.
   */
  async reverseTransaction(
    manager: EntityManager,
    voucherType: string,
    voucherId: string,
    reversalReason: string,
  ): Promise<void> {
    const originalEntries = await manager.find(LedgerEntry, {
      where: { voucherType, voucherId },
    });

    if (!originalEntries || originalEntries.length === 0) {
      return;
    }

    const reversalEntries = originalEntries.map((entry) => {
      return manager.create(LedgerEntry, {
        tenantId: entry.tenantId,
        companyId: entry.companyId,
        branchId: entry.branchId,
        entryDate: new Date().toISOString().split('T')[0],
        voucherType: `${entry.voucherType}_REVERSAL`,
        voucherId: entry.voucherId,
        voucherNo: entry.voucherNo,
        ledgerId: entry.ledgerId,
        debitAmount: entry.creditAmount, // Inverted
        creditAmount: entry.debitAmount, // Inverted
        narration: `Reversal: ${reversalReason} (Orig: ${entry.voucherNo})`,
      });
    });

    await manager.save(LedgerEntry, reversalEntries);
  }

  /**
   * Creates an accounting voucher (Payment, Receipt, Contra, Journal, Debit Note, Credit Note)
   * with automatic sequence numbering and double-entry general ledger posting.
   */
  async createVoucher(
    tenantId: string,
    userId: string,
    dto: CreateAccountingVoucherDto,
  ): Promise<AccountingVoucher> {
    return await this.dataSource.transaction(async (manager) => {
      const vEnum = (VoucherType[dto.voucherType as keyof typeof VoucherType] ||
        dto.voucherType) as VoucherType;

      const voucherNo = await this.sequenceService.getNextVoucherNumber(
        manager,
        tenantId,
        dto.companyId,
        dto.branchId,
        vEnum,
      );

      // Prepare voucher record & GL posting lines based on voucher type
      const postingLines: LedgerPostingLine[] = [];
      const voucherLinesToSave: Partial<AccountingVoucherLine>[] = [];
      let calculatedTotal = 0;

      if (dto.voucherType === 'PAYMENT') {
        if (!dto.sourceAccountLedgerId) {
          throw new BadRequestException('Cash or Bank account is required for Payment voucher');
        }
        if (!dto.lines || dto.lines.length === 0) {
          throw new BadRequestException('At least one payment line/expense account is required');
        }

        for (const line of dto.lines) {
          const amt = Number(line.amount || line.debitAmount || 0);
          if (amt <= 0) continue;
          calculatedTotal += amt;

          voucherLinesToSave.push({
            ledgerId: line.ledgerId,
            debitAmount: amt,
            creditAmount: 0,
            narration: line.narration || dto.narration,
          });

          postingLines.push({
            ledgerId: line.ledgerId,
            debitAmount: amt,
            creditAmount: 0,
            narration: line.narration || dto.narration || `Payment towards ledger`,
          });
        }

        // Credit the Cash / Bank ledger
        postingLines.push({
          ledgerId: dto.sourceAccountLedgerId,
          debitAmount: 0,
          creditAmount: Number(calculatedTotal.toFixed(2)),
          narration: dto.narration || `Payment via Cash/Bank account`,
        });
      } else if (dto.voucherType === 'RECEIPT') {
        if (!dto.sourceAccountLedgerId) {
          throw new BadRequestException('Cash or Bank account is required for Receipt voucher');
        }
        if (!dto.lines || dto.lines.length === 0) {
          throw new BadRequestException('At least one receipt line/income account is required');
        }

        for (const line of dto.lines) {
          const amt = Number(line.amount || line.creditAmount || 0);
          if (amt <= 0) continue;
          calculatedTotal += amt;

          voucherLinesToSave.push({
            ledgerId: line.ledgerId,
            debitAmount: 0,
            creditAmount: amt,
            narration: line.narration || dto.narration,
          });

          postingLines.push({
            ledgerId: line.ledgerId,
            debitAmount: 0,
            creditAmount: amt,
            narration: line.narration || dto.narration || `Receipt from ledger`,
          });
        }

        // Debit the Cash / Bank ledger
        postingLines.push({
          ledgerId: dto.sourceAccountLedgerId,
          debitAmount: Number(calculatedTotal.toFixed(2)),
          creditAmount: 0,
          narration: dto.narration || `Receipt into Cash/Bank account`,
        });
      } else if (dto.voucherType === 'CONTRA') {
        if (!dto.sourceAccountLedgerId) {
          throw new BadRequestException('Source Cash/Bank account is required for Contra transfer');
        }
        if (!dto.destinationLedgerId) {
          throw new BadRequestException('Destination Cash/Bank account is required for Contra transfer');
        }
        if (dto.sourceAccountLedgerId === dto.destinationLedgerId) {
          throw new BadRequestException('Source and Destination accounts cannot be the same for Contra');
        }

        const amt = Number(dto.totalAmount || (dto.lines && dto.lines[0]?.amount) || 0);
        if (amt <= 0) {
          throw new BadRequestException('Contra transfer amount must be greater than zero');
        }
        calculatedTotal = amt;

        voucherLinesToSave.push({
          ledgerId: dto.destinationLedgerId,
          debitAmount: amt,
          creditAmount: 0,
          narration: dto.narration || `Transfer into ${dto.destinationLedgerId}`,
        });

        // Debit destination, Credit source
        postingLines.push({
          ledgerId: dto.destinationLedgerId,
          debitAmount: amt,
          creditAmount: 0,
          narration: dto.narration || `Fund transfer in`,
        });
        postingLines.push({
          ledgerId: dto.sourceAccountLedgerId,
          debitAmount: 0,
          creditAmount: amt,
          narration: dto.narration || `Fund transfer out`,
        });
      } else if (dto.voucherType === 'JOURNAL') {
        if (!dto.lines || dto.lines.length < 2) {
          throw new BadRequestException('Journal voucher requires at least two balanced debit/credit lines');
        }

        let totalDebit = 0;
        let totalCredit = 0;

        for (const line of dto.lines) {
          const dr = Number(line.debitAmount || 0);
          const cr = Number(line.creditAmount || 0);
          totalDebit += dr;
          totalCredit += cr;

          voucherLinesToSave.push({
            ledgerId: line.ledgerId,
            debitAmount: dr,
            creditAmount: cr,
            narration: line.narration || dto.narration,
          });

          postingLines.push({
            ledgerId: line.ledgerId,
            debitAmount: dr,
            creditAmount: cr,
            narration: line.narration || dto.narration || `Journal adjustment`,
          });
        }

        if (Math.abs(totalDebit - totalCredit) > 0.05) {
          throw new BadRequestException(
            `Journal unbalanced: Total Debit (₹${totalDebit.toFixed(2)}) != Total Credit (₹${totalCredit.toFixed(2)})`,
          );
        }
        calculatedTotal = totalDebit;
      } else if (dto.voucherType === 'DEBIT_NOTE') {
        if (!dto.sourceAccountLedgerId) {
          throw new BadRequestException('Party account to debit is required');
        }
        if (!dto.lines || dto.lines.length === 0) {
          throw new BadRequestException('At least one line account to credit is required');
        }

        for (const line of dto.lines) {
          const amt = Number(line.amount || line.creditAmount || 0);
          if (amt <= 0) continue;
          calculatedTotal += amt;

          voucherLinesToSave.push({
            ledgerId: line.ledgerId,
            debitAmount: 0,
            creditAmount: amt,
            narration: line.narration || dto.narration,
          });

          postingLines.push({
            ledgerId: line.ledgerId,
            debitAmount: 0,
            creditAmount: amt,
            narration: line.narration || dto.narration || `Debit Note offset`,
          });
        }

        // Debit the Party
        postingLines.push({
          ledgerId: dto.sourceAccountLedgerId,
          debitAmount: Number(calculatedTotal.toFixed(2)),
          creditAmount: 0,
          narration: dto.narration || `Debit Note issued to party`,
        });
      } else if (dto.voucherType === 'CREDIT_NOTE') {
        if (!dto.sourceAccountLedgerId) {
          throw new BadRequestException('Party account to credit is required');
        }
        if (!dto.lines || dto.lines.length === 0) {
          throw new BadRequestException('At least one line account to debit is required');
        }

        for (const line of dto.lines) {
          const amt = Number(line.amount || line.debitAmount || 0);
          if (amt <= 0) continue;
          calculatedTotal += amt;

          voucherLinesToSave.push({
            ledgerId: line.ledgerId,
            debitAmount: amt,
            creditAmount: 0,
            narration: line.narration || dto.narration,
          });

          postingLines.push({
            ledgerId: line.ledgerId,
            debitAmount: amt,
            creditAmount: 0,
            narration: line.narration || dto.narration || `Credit Note offset`,
          });
        }

        // Credit the Party
        postingLines.push({
          ledgerId: dto.sourceAccountLedgerId,
          debitAmount: 0,
          creditAmount: Number(calculatedTotal.toFixed(2)),
          narration: dto.narration || `Credit Note issued to party`,
        });
      }

      // Save Header Voucher
      const voucher = manager.create(AccountingVoucher, {
        tenantId,
        companyId: dto.companyId,
        branchId: dto.branchId,
        voucherType: dto.voucherType,
        voucherNo,
        voucherDate: dto.voucherDate,
        totalAmount: Number(calculatedTotal.toFixed(2)),
        paymentMode: dto.paymentMode || 'CASH',
        referenceNo: dto.referenceNo,
        referenceDate: dto.referenceDate,
        narration: dto.narration,
        sourceAccountLedgerId: dto.sourceAccountLedgerId,
        status: 'POSTED',
        createdBy: userId,
      });

      const savedVoucher = await manager.save(AccountingVoucher, voucher);

      // Save Lines
      const linesWithVoucher = voucherLinesToSave.map((l) =>
        manager.create(AccountingVoucherLine, {
          ...l,
          voucherId: savedVoucher.id,
        }),
      );
      await manager.save(AccountingVoucherLine, linesWithVoucher);

      // Post balanced General Ledger entries
      await this.postTransaction(manager, {
        tenantId,
        companyId: dto.companyId,
        branchId: dto.branchId,
        entryDate: dto.voucherDate,
        voucherType: dto.voucherType,
        voucherId: savedVoucher.id,
        voucherNo,
        lines: postingLines,
      });

      return await manager.findOne(AccountingVoucher, {
        where: { id: savedVoucher.id },
        relations: ['lines', 'lines.ledger', 'sourceAccountLedger', 'branch'],
      });
    });
  }

  /**
   * Retrieves list of vouchers filtered by type, company, date range, or search.
   */
  async getVouchers(
    tenantId: string,
    companyId: string,
    query: {
      voucherType?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ): Promise<AccountingVoucher[]> {
    const qb = this.voucherRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.lines', 'line')
      .leftJoinAndSelect('line.ledger', 'lineLedger')
      .leftJoinAndSelect('v.sourceAccountLedger', 'sourceLedger')
      .leftJoinAndSelect('v.branch', 'branch')
      .where('v.tenant_id = :tenantId', { tenantId })
      .andWhere('v.company_id = :companyId', { companyId });

    if (query.voucherType) {
      qb.andWhere('v.voucher_type = :vType', { vType: query.voucherType });
    }
    if (query.startDate) {
      qb.andWhere('v.voucher_date >= :sDate', { sDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('v.voucher_date <= :eDate', { eDate: query.endDate });
    }
    if (query.search) {
      qb.andWhere(
        '(v.voucher_no ILIKE :q OR v.narration ILIKE :q OR sourceLedger.name ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    return await qb.orderBy('v.voucher_date', 'DESC').addOrderBy('v.created_at', 'DESC').getMany();
  }

  /**
   * Retrieves single voucher by ID with all relations and posted general ledger entries.
   */
  async getVoucherById(
    tenantId: string,
    companyId: string,
    id: string,
  ): Promise<any> {
    const voucher = await this.voucherRepo.findOne({
      where: { id, tenantId, companyId },
      relations: ['lines', 'lines.ledger', 'sourceAccountLedger', 'branch'],
    });

    if (!voucher) {
      throw new NotFoundException(`Accounting voucher not found`);
    }

    const glEntries = await this.entryRepo.find({
      where: { voucherId: id },
      relations: ['ledger'],
      order: { debitAmount: 'DESC' },
    });

    return {
      ...voucher,
      ledgerEntries: glEntries,
    };
  }

  /**
   * Cancels a voucher and reverses its general ledger entries.
   */
  async cancelVoucher(
    tenantId: string,
    userId: string,
    id: string,
    reason?: string,
  ): Promise<AccountingVoucher> {
    return await this.dataSource.transaction(async (manager) => {
      const voucher = await manager.findOne(AccountingVoucher, {
        where: { id, tenantId },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found');
      }
      if (voucher.status === 'CANCELLED') {
        throw new BadRequestException('Voucher is already cancelled');
      }

      await this.reverseTransaction(
        manager,
        voucher.voucherType,
        voucher.id,
        reason || 'Voucher cancelled by user',
      );

      voucher.status = 'CANCELLED';
      return await manager.save(AccountingVoucher, voucher);
    });
  }
}
