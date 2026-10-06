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
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { BomItem } from './bom-item.entity';

@Entity('bill_of_materials')
export class BillOfMaterials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'bom_no', length: 60 })
  bomNo: string;

  @Column({ length: 150 })
  name: string;

  @Index()
  @Column({ name: 'finished_item_id', type: 'uuid' })
  finishedItemId: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'finished_item_id' })
  finishedItem: Item;

  @Index()
  @Column({ name: 'finished_variant_id', type: 'uuid', nullable: true })
  finishedVariantId: string;

  @ManyToOne(() => ItemVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'finished_variant_id' })
  finishedVariant: ItemVariant;

  @Column({ name: 'produced_qty', type: 'decimal', precision: 15, scale: 3, default: 1 })
  producedQty: number;

  @Column({ name: 'estimated_labor_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedLaborCost: number;

  @Column({ name: 'estimated_overhead_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedOverheadCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => BomItem, (item) => item.bom, { cascade: true })
  items: BomItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
