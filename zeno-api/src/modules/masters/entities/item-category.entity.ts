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
import { Item } from './item.entity';

@Entity('item_categories')
export class ItemCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'item_group_id', type: 'uuid' })
  itemGroupId: string;

  @ManyToOne(() => ItemGroup, (ig) => ig.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_group_id' })
  itemGroup: ItemGroup;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
