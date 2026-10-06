import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DeliveryChallan } from './delivery-challan.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';

@Entity('delivery_challan_items')
export class DeliveryChallanItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'delivery_challan_id', type: 'uuid' })
  deliveryChallanId: string;

  @ManyToOne(() => DeliveryChallan, (dc) => dc.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_challan_id' })
  deliveryChallan: DeliveryChallan;

  @Index()
  @Column({ name: 'sales_order_item_id', type: 'uuid', nullable: true })
  salesOrderItemId: string;

  @ManyToOne(() => SalesOrderItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sales_order_item_id' })
  salesOrderItem: SalesOrderItem;

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

  @Column({ name: 'dispatched_qty', type: 'decimal', precision: 15, scale: 3 })
  dispatchedQty: number;

  @Column({ name: 'invoiced_qty', type: 'decimal', precision: 15, scale: 3, default: 0 })
  invoicedQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  rate: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxableAmount: number;

  @Column({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ name: 'cgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  cgstAmount: number;

  @Column({ name: 'sgst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  sgstAmount: number;

  @Column({ name: 'igst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  igstAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
