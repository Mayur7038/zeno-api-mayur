import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SalesReturn } from './sales-return.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';

@Entity('sales_return_items')
export class SalesReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'sales_return_id', type: 'uuid' })
  salesReturnId: string;

  @ManyToOne(() => SalesReturn, (sr) => sr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_return_id' })
  salesReturn: SalesReturn;

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

  @Column({ name: 'returned_qty', type: 'decimal', precision: 15, scale: 3 })
  returnedQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  rate: number;

  @Column({ name: 'taxable_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxableAmount: number;

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
