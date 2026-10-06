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
import { ItemGroup } from '../../masters/entities/item-group.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Item } from '../../masters/entities/item.entity';
import { PriceListItem } from './price-list-item.entity';

export enum PricingDimension {
  STOCK_GROUP_WISE = 'STOCK_GROUP_WISE',
  CUSTOMER_WISE = 'CUSTOMER_WISE',
  PRODUCT_WISE = 'PRODUCT_WISE',
}

@Entity('price_lists')
export class PriceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 50, nullable: true })
  code: string;

  @Index()
  @Column({
    name: 'pricing_type',
    type: 'enum',
    enum: PricingDimension,
    default: PricingDimension.PRODUCT_WISE,
  })
  pricingType: PricingDimension;

  @Index()
  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: string;

  // Relation for STOCK_GROUP_WISE
  @Index()
  @Column({ name: 'item_group_id', type: 'uuid', nullable: true })
  itemGroupId: string;

  @ManyToOne(() => ItemGroup, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_group_id' })
  itemGroup: ItemGroup;

  // Relation for CUSTOMER_WISE (ledger)
  @Index()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne(() => Ledger, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Ledger;

  // Relation for single PRODUCT_WISE header item (optional if lines used)
  @Index()
  @Column({ name: 'item_id', type: 'uuid', nullable: true })
  itemId: string;

  @ManyToOne(() => Item, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ name: 'margin_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  marginPercentage: number;

  @Column({ length: 10, default: 'INR' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => PriceListItem, (item) => item.priceList, { cascade: true })
  items: PriceListItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
