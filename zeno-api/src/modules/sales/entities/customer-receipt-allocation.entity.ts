import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomerReceipt } from './customer-receipt.entity';
import { SalesInvoice } from './sales-invoice.entity';

@Entity('customer_receipt_allocations')
export class CustomerReceiptAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_receipt_id', type: 'uuid' })
  customerReceiptId: string;

  @ManyToOne(() => CustomerReceipt, (cr) => cr.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_receipt_id' })
  customerReceipt: CustomerReceipt;

  @Index()
  @Column({ name: 'sales_invoice_id', type: 'uuid' })
  salesInvoiceId: string;

  @ManyToOne(() => SalesInvoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sales_invoice_id' })
  salesInvoice: SalesInvoice;

  @Column({ name: 'allocated_amount', type: 'decimal', precision: 15, scale: 2 })
  allocatedAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
