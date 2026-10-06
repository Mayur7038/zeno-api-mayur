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
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { VendorPaymentAllocation } from './vendor-payment-allocation.entity';

@Entity('vendor_payments')
export class VendorPayment {
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

  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Index()
  @Column({ name: 'vendor_ledger_id', type: 'uuid' })
  vendorLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_ledger_id' })
  vendorLedger: Ledger;

  @Index()
  @Column({ name: 'payment_mode_ledger_id', type: 'uuid' })
  paymentModeLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_mode_ledger_id' })
  paymentModeLedger: Ledger;

  @Column({ name: 'total_amount_paid', type: 'decimal', precision: 15, scale: 2 })
  totalAmountPaid: number;

  @Column({ name: 'total_discount_received', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDiscountReceived: number;

  @Column({ name: 'reference_cheque_no', length: 60, nullable: true })
  referenceChequeNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => VendorPaymentAllocation, (alloc) => alloc.vendorPayment, { cascade: true })
  allocations: VendorPaymentAllocation[];
}
