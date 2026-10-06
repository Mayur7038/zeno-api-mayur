import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { VoucherSequence } from '../entities/voucher-sequence.entity';
import { VoucherType } from '../../../common/enums';

@Injectable()
export class VoucherSequenceService {
  constructor(private dataSource: DataSource) {}

  /**
   * Generates next gap-safe, concurrency-safe voucher number with pessimistic lock (SELECT ... FOR UPDATE).
   */
  async getNextVoucherNumber(
    manager: EntityManager,
    tenantId: string,
    companyId: string,
    branchId: string,
    voucherType: VoucherType,
    financialYear: string = '2025-2026',
  ): Promise<string> {
    // 1. Lock sequence row or insert initial if not existing
    let seq = await manager
      .createQueryBuilder(VoucherSequence, 'seq')
      .setLock('pessimistic_write')
      .where('seq.tenant_id = :tenantId', { tenantId })
      .andWhere('seq.company_id = :companyId', { companyId })
      .andWhere('seq.branch_id = :branchId', { branchId })
      .andWhere('seq.voucher_type = :voucherType', { voucherType })
      .andWhere('seq.financial_year = :financialYear', { financialYear })
      .getOne();

    if (!seq) {
      // Determine default prefix based on voucher type
      const defaultPrefix = this.getDefaultPrefix(voucherType);
      seq = manager.create(VoucherSequence, {
        tenantId,
        companyId,
        branchId,
        voucherType,
        financialYear,
        prefix: `${defaultPrefix}/${financialYear.substring(2, 4)}-${financialYear.substring(7, 9)}/`,
        suffix: '',
        currentNumber: 0,
        paddingDigits: 4,
      });
      await manager.save(VoucherSequence, seq);

      // Re-query with write lock
      seq = await manager
        .createQueryBuilder(VoucherSequence, 'seq')
        .setLock('pessimistic_write')
        .where('seq.id = :id', { id: seq.id })
        .getOne();
    }

    const nextNumber = Number(seq.currentNumber) + 1;
    seq.currentNumber = nextNumber;
    await manager.save(VoucherSequence, seq);

    const paddedNumber = String(nextNumber).padStart(seq.paddingDigits, '0');
    return `${seq.prefix || ''}${paddedNumber}${seq.suffix || ''}`;
  }

  private getDefaultPrefix(type: VoucherType): string {
    switch (type) {
      case VoucherType.PURCHASE_ORDER:
        return 'PO';
      case VoucherType.GOODS_RECEIPT_NOTE:
        return 'GRN';
      case VoucherType.PURCHASE_INVOICE:
        return 'PI';
      case VoucherType.PURCHASE_RETURN:
        return 'PR';
      case VoucherType.VENDOR_PAYMENT:
      case VoucherType.PAYMENT:
        return 'PAY';
      case VoucherType.SALES_ORDER:
        return 'SO';
      case VoucherType.DELIVERY_CHALLAN:
        return 'DC';
      case VoucherType.SALES_INVOICE:
        return 'SI';
      case VoucherType.SALES_RETURN:
        return 'SR';
      case VoucherType.CUSTOMER_RECEIPT:
      case VoucherType.RECEIPT:
        return 'REC';
      case VoucherType.CONTRA:
        return 'CNT';
      case VoucherType.JOURNAL:
        return 'JRN';
      case VoucherType.DEBIT_NOTE:
        return 'DRN';
      case VoucherType.CREDIT_NOTE:
        return 'CRN';
      default:
        return 'VOUCH';
    }
  }
}
