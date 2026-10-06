import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { GoodsReceiptNote } from './goods-receipt-note.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('grn_po_mappings')
@Unique(['grnId', 'purchaseOrderId'])
export class GrnPoMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'grn_id', type: 'uuid' })
  grnId: string;

  @ManyToOne(() => GoodsReceiptNote, (grn) => grn.poMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grn_id' })
  grn: GoodsReceiptNote;

  @Index()
  @Column({ name: 'purchase_order_id', type: 'uuid' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;
}
