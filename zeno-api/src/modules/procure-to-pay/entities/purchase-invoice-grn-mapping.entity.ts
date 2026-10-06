import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { GoodsReceiptNote } from './goods-receipt-note.entity';

@Entity('purchase_invoice_grn_mappings')
@Unique(['purchaseInvoiceId', 'grnId'])
export class PurchaseInvoiceGrnMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'purchase_invoice_id', type: 'uuid' })
  purchaseInvoiceId: string;

  @ManyToOne(() => PurchaseInvoice, (pi) => pi.grnMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchaseInvoice: PurchaseInvoice;

  @Index()
  @Column({ name: 'grn_id', type: 'uuid' })
  grnId: string;

  @ManyToOne(() => GoodsReceiptNote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grn_id' })
  grn: GoodsReceiptNote;
}
