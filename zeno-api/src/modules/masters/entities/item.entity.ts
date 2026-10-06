import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ItemGroup } from './item-group.entity';
import { ItemCategory } from './item-category.entity';
import { Unit } from './unit.entity';
import { ItemVariant } from './item-variant.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  // Tab 1: Basic
  @Column({ length: 150 })
  name: string;

  @Column({ length: 60, nullable: true })
  sku: string;

  @Index()
  @Column({ name: 'item_group_id', type: 'uuid', nullable: true })
  itemGroupId: string;

  @ManyToOne(() => ItemGroup, (ig) => ig.items, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_group_id' })
  itemGroup: ItemGroup;

  @Index()
  @Column({ name: 'item_category_id', type: 'uuid', nullable: true })
  itemCategoryId: string;

  @ManyToOne(() => ItemCategory, (ic) => ic.items, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_category_id' })
  category: ItemCategory;

  @Index()
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'hsn_sac', length: 20, nullable: true })
  hsnSac: string;

  @Column({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ name: 'cess_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cessRate: number;

  // Tab 2: Sales / Purchase
  @Column({ name: 'purchase_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  purchaseRate: number;

  @Column({ name: 'sale_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  saleRate: number;

  @Column({ name: 'reorder_level', type: 'decimal', precision: 15, scale: 3, default: 0 })
  reorderLevel: number;

  @Column({ name: 'has_variants', default: false })
  hasVariants: boolean;

  // Tab 3: Image
  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  // Tab 4: Description
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ItemVariant, (variant) => variant.item)
  variants: ItemVariant[];
}
