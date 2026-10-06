import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BillOfMaterials } from './bom.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';

@Entity('bom_items')
export class BomItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'bom_id', type: 'uuid' })
  bomId: string;

  @ManyToOne(() => BillOfMaterials, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  bom: BillOfMaterials;

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

  @Column({ name: 'consumed_qty', type: 'decimal', precision: 15, scale: 3 })
  consumedQty: number;

  @Column({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  unitRate: number;

  @Column({ name: 'scrap_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  scrapPercentage: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ length: 255, nullable: true })
  notes: string;
}
