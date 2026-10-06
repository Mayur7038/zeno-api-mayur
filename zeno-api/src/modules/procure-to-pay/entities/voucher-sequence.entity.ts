import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { VoucherType } from '../../../common/enums';

@Entity('voucher_sequences')
@Unique(['tenantId', 'companyId', 'branchId', 'voucherType', 'financialYear'])
export class VoucherSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @Column({ name: 'voucher_type', type: 'enum', enum: VoucherType })
  voucherType: VoucherType;

  @Column({ name: 'financial_year', length: 10, default: '2025-2026' })
  financialYear: string;

  @Column({ length: 20, default: '' })
  prefix: string;

  @Column({ length: 20, default: '' })
  suffix: string;

  @Column({ name: 'current_number', type: 'bigint', default: 0 })
  currentNumber: number;

  @Column({ name: 'padding_digits', default: 4 })
  paddingDigits: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
