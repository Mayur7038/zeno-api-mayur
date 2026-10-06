import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { AccountingVoucherLine } from './accounting-voucher-line.entity';

@Entity('accounting_vouchers')
export class AccountingVoucher {
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

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Index()
  @Column({ name: 'voucher_type', length: 40 })
  voucherType: string;

  @Index()
  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'voucher_date', type: 'date' })
  voucherDate: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'payment_mode', length: 40, default: 'CASH' })
  paymentMode: string;

  @Column({ name: 'reference_no', length: 100, nullable: true })
  referenceNo: string;

  @Column({ name: 'reference_date', type: 'date', nullable: true })
  referenceDate: string;

  @Column({ type: 'text', nullable: true })
  narration: string;

  @Index()
  @Column({ name: 'source_account_ledger_id', type: 'uuid', nullable: true })
  sourceAccountLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'source_account_ledger_id' })
  sourceAccountLedger: Ledger;

  @Column({ length: 30, default: 'POSTED' })
  status: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AccountingVoucherLine, (line) => line.voucher, { cascade: true })
  lines: AccountingVoucherLine[];
}
