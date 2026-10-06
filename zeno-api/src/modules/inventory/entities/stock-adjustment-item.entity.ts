import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { StockAdjustment } from './stock-adjustment.entity';

@Entity('stock_adjustment_items')
export class StockAdjustmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'adjustment_id', type: 'uuid' })
  adjustmentId: string;

  @ManyToOne(() => StockAdjustment, (adj) => adj.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adjustment_id' })
  adjustment: StockAdjustment;

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

  @Column({ name: 'adjustment_type', length: 20 })
  adjustmentType: string; // INCREASE | DECREASE

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  qty: number;

  @Column({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  unitRate: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;
}
