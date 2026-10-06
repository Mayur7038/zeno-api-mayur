import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VendorPayment } from './vendor-payment.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';

@Entity('vendor_payment_allocations')
export class VendorPaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vendor_payment_id', type: 'uuid' })
  vendorPaymentId: string;

  @ManyToOne(() => VendorPayment, (vp) => vp.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_payment_id' })
  vendorPayment: VendorPayment;

  @Index()
  @Column({ name: 'purchase_invoice_id', type: 'uuid' })
  purchaseInvoiceId: string;

  @ManyToOne(() => PurchaseInvoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchaseInvoice: PurchaseInvoice;

  @Column({ name: 'allocated_amount', type: 'decimal', precision: 15, scale: 2 })
  allocatedAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
