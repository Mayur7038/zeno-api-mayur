import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { GoodsReceiptNote } from './goods-receipt-note.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { RackBin } from '../../tenancy/entities/rack-bin.entity';

@Entity('grn_items')
export class GrnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'grn_id', type: 'uuid' })
  grnId: string;

  @ManyToOne(() => GoodsReceiptNote, (grn) => grn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grn_id' })
  grn: GoodsReceiptNote;

  @Index()
  @Column({ name: 'po_item_id', type: 'uuid', nullable: true })
  poItemId: string;

  @ManyToOne(() => PurchaseOrderItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'po_item_id' })
  poItem: PurchaseOrderItem;

  @Index()
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Index()
  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string;

  @ManyToOne(() => ItemVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant: ItemVariant;

  @Index()
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Index()
  @Column({ name: 'godown_id', type: 'uuid', nullable: true })
  godownId: string;

  @ManyToOne(() => Godown, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Index()
  @Column({ name: 'rack_bin_id', type: 'uuid', nullable: true })
  rackBinId: string;

  @ManyToOne(() => RackBin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rack_bin_id' })
  rackBin: RackBin;

  @Column({ name: 'received_qty', type: 'decimal', precision: 15, scale: 3 })
  receivedQty: number;

  @Column({ name: 'invoiced_qty', type: 'decimal', precision: 15, scale: 3, default: 0 })
  invoicedQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  rate: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
