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
import { Godown } from '../../tenancy/entities/godown.entity';
import { SalesInvoice } from './sales-invoice.entity';
import { SalesReturnItem } from './sales-return-item.entity';

@Entity('sales_returns')
@Unique(['tenantId', 'companyId', 'branchId', 'voucherNo'])
export class SalesReturn {
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
  @Column({ name: 'godown_id', type: 'uuid', nullable: true })
  godownId: string;

  @ManyToOne(() => Godown, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Index()
  @Column({ name: 'sales_invoice_id', type: 'uuid', nullable: true })
  salesInvoiceId: string;

  @ManyToOne(() => SalesInvoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sales_invoice_id' })
  salesInvoice: SalesInvoice;

  @Column({ name: 'voucher_no', length: 50 })
  voucherNo: string;

  @Column({ name: 'return_date', type: 'date' })
  returnDate: string;

  @Index()
  @Column({ name: 'customer_ledger_id', type: 'uuid' })
  customerLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_ledger_id' })
  customerLedger: Ledger;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'tax_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SalesReturnItem, (item) => item.salesReturn, { cascade: true })
  items: SalesReturnItem[];
}
