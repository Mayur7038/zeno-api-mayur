import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from './item.entity';

@Entity('item_variants')
export class ItemVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, (item) => item.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 60, nullable: true })
  sku: string;

  @Column({ length: 60, nullable: true })
  barcode: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, string>;

  @Column({ name: 'purchase_rate', type: 'decimal', precision: 15, scale: 4, nullable: true, default: 0 })
  purchaseRate: number;

  @Column({ name: 'sale_rate', type: 'decimal', precision: 15, scale: 4, nullable: true, default: 0 })
  saleRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  mrp: number;

  @Column({ name: 'opening_qty', type: 'decimal', precision: 15, scale: 3, default: 0 })
  openingQty: number;

  @Column({ name: 'opening_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  openingRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
