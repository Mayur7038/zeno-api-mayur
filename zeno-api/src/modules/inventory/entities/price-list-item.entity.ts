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
import { PriceList } from './price-list.entity';

@Entity('price_list_items')
export class PriceListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'price_list_id', type: 'uuid' })
  priceListId: string;

  @ManyToOne(() => PriceList, (pl) => pl.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_list_id' })
  priceList: PriceList;

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

  @Column({ name: 'standard_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  standardRate: number;

  @Column({ name: 'custom_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  customRate: number;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ name: 'min_selling_price', type: 'decimal', precision: 15, scale: 4, default: 0 })
  minSellingPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
