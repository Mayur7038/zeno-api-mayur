import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ItemCategory } from './item-category.entity';
import { Item } from './item.entity';

@Entity('item_groups')
export class ItemGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'hsn_sac', length: 20, nullable: true })
  hsnSac: string;

  @Column({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ItemCategory, (cat) => cat.itemGroup)
  categories: ItemCategory[];

  @OneToMany(() => Item, (item) => item.itemGroup)
  items: Item[];
}
