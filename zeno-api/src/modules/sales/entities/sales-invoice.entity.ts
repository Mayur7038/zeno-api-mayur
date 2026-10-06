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
import { PurchaseType, SalesInvoiceStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { SalesInvoiceItem } from './sales-invoice-item.entity';
import { SalesInvoiceDcMapping } from './sales-invoice-dc-mapping.entity';

@Entity('sales_invoices')
@Unique(['tenantId', 'companyId', 'branchId', 'voucherNo'])
export class SalesInvoice {
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

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: string;

  @Column({
    name: 'sales_type',
    type: 'enum',
    enum: PurchaseType,
    default: PurchaseType.GOODS,
  })
  salesType: PurchaseType;

  @Index()
  @Column({ name: 'customer_ledger_id', type: 'uuid' })
  customerLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_ledger_id' })
  customerLedger: Ledger;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string;

  @Column({ name: 'payment_terms', length: 100, nullable: true })
  paymentTerms: string;

  @Column({ name: 'taxable_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxableTotal: number;

  @Column({ name: 'cgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  cgstTotal: number;

  @Column({ name: 'sgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  sgstTotal: number;

  @Column({ name: 'igst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  igstTotal: number;

  @Column({ name: 'discount_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountTotal: number;

  @Column({ name: 'round_off_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  roundOffTotal: number;

  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: SalesInvoiceStatus,
    default: SalesInvoiceStatus.PENDING,
  })
  status: SalesInvoiceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SalesInvoiceItem, (item) => item.salesInvoice, { cascade: true })
  items: SalesInvoiceItem[];

  @OneToMany(() => SalesInvoiceDcMapping, (mapping) => mapping.salesInvoice, { cascade: true })
  deliveryChallans: SalesInvoiceDcMapping[];
}
