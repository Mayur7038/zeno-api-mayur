import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { SalesInvoice } from './sales-invoice.entity';
import { DeliveryChallan } from './delivery-challan.entity';

@Entity('sales_invoice_dc_mappings')
@Unique(['salesInvoiceId', 'deliveryChallanId'])
export class SalesInvoiceDcMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'sales_invoice_id', type: 'uuid' })
  salesInvoiceId: string;

  @ManyToOne(() => SalesInvoice, (si) => si.deliveryChallans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_invoice_id' })
  salesInvoice: SalesInvoice;

  @Index()
  @Column({ name: 'delivery_challan_id', type: 'uuid' })
  deliveryChallanId: string;

  @ManyToOne(() => DeliveryChallan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_challan_id' })
  deliveryChallan: DeliveryChallan;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
