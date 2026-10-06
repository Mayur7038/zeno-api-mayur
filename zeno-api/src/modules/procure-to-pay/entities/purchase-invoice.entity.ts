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
  VersionColumn,
} from 'typeorm';
import { PurchaseInvoiceStatus, PurchaseType } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';
import { PurchaseInvoiceGrnMapping } from './purchase-invoice-grn-mapping.entity';

@Entity('purchase_invoices')
export class PurchaseInvoice {
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

  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: string;

  @Column({
    name: 'purchase_type',
    type: 'enum',
    enum: PurchaseType,
    default: PurchaseType.GOODS,
  })
  purchaseType: PurchaseType;

  @Index()
  @Column({ name: 'vendor_ledger_id', type: 'uuid' })
  vendorLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_ledger_id' })
  vendorLedger: Ledger;

  @Column({ name: 'vendor_bill_no', length: 60, nullable: true })
  vendorBillNo: string;

  @Column({ name: 'vendor_bill_date', type: 'date', nullable: true })
  vendorBillDate: string;

  @Column({ name: 'place_of_supply_state_code', length: 2, default: '27' })
  placeOfSupplyStateCode: string;

  @Column({ name: 'is_interstate', default: false })
  isInterstate: boolean;

  @Column({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'discount_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountTotal: number;

  @Column({ name: 'taxable_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxableTotal: number;

  @Column({ name: 'cgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  cgstTotal: number;

  @Column({ name: 'sgst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  sgstTotal: number;

  @Column({ name: 'igst_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  igstTotal: number;

  @Column({ name: 'cess_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  cessTotal: number;

  @Column({ name: 'round_off', type: 'decimal', precision: 8, scale: 2, default: 0 })
  roundOff: number;

  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: PurchaseInvoiceStatus,
    default: PurchaseInvoiceStatus.PENDING,
  })
  status: PurchaseInvoiceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @VersionColumn({ default: 1 })
  version: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PurchaseInvoiceItem, (item) => item.purchaseInvoice, { cascade: true })
  items: PurchaseInvoiceItem[];

  @OneToMany(() => PurchaseInvoiceGrnMapping, (mapping) => mapping.purchaseInvoice, { cascade: true })
  grnMappings: PurchaseInvoiceGrnMapping[];
}
