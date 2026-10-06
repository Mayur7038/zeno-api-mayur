import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AccountingVoucher } from './accounting-voucher.entity';
import { Ledger } from '../../masters/entities/ledger.entity';

@Entity('accounting_voucher_lines')
export class AccountingVoucherLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'voucher_id', type: 'uuid' })
  voucherId: string;

  @ManyToOne(() => AccountingVoucher, (v) => v.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher: AccountingVoucher;

  @Index()
  @Column({ name: 'ledger_id', type: 'uuid' })
  ledgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_id' })
  ledger: Ledger;

  @Column({ name: 'debit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  debitAmount: number;

  @Column({ name: 'credit_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ type: 'text', nullable: true })
  narration: string;
}
