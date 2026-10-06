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
  Unique,
} from 'typeorm';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { CustomerReceiptAllocation } from './customer-receipt-allocation.entity';

@Entity('customer_receipts')
@Unique(['tenantId', 'companyId', 'branchId', 'voucherNo'])
export class CustomerReceipt {
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

  @Column({ name: 'voucher_no', length: 50 })
  voucherNo: string;

  @Column({ name: 'receipt_date', type: 'date' })
  receiptDate: string;

  @Index()
  @Column({ name: 'customer_ledger_id', type: 'uuid' })
  customerLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_ledger_id' })
  customerLedger: Ledger;

  @Index()
  @Column({ name: 'payment_ledger_id', type: 'uuid' })
  paymentLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_ledger_id' })
  paymentLedger: Ledger;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    name: 'payment_mode',
    length: 50,
    default: 'BANK',
  })
  paymentMode: string;

  @Column({ name: 'reference_no', length: 100, nullable: true })
  referenceNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CustomerReceiptAllocation, (alloc) => alloc.customerReceipt, {
    cascade: true,
  })
  allocations: CustomerReceiptAllocation[];
}
