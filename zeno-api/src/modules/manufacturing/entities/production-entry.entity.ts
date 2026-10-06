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
import { Godown } from '../../tenancy/entities/godown.entity';
import { BillOfMaterials } from './bom.entity';
import { ProductionItem } from './production-item.entity';

@Entity('production_entries')
export class ProductionEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @Index()
  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Index()
  @Column({ name: 'bom_id', type: 'uuid', nullable: true })
  bomId: string;

  @ManyToOne(() => BillOfMaterials, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bom_id' })
  bom: BillOfMaterials;

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

  @Column({ name: 'assembled_qty', type: 'decimal', precision: 15, scale: 3 })
  assembledQty: number;

  @Index()
  @Column({ name: 'source_godown_id', type: 'uuid' })
  sourceGodownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_godown_id' })
  sourceGodown: Godown;

  @Index()
  @Column({ name: 'target_godown_id', type: 'uuid' })
  targetGodownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_godown_id' })
  targetGodown: Godown;

  @Column({ name: 'raw_material_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  rawMaterialCost: number;

  @Column({ name: 'additional_labor_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  additionalLaborCost: number;

  @Column({ name: 'additional_overhead_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  additionalOverheadCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4, default: 0 })
  unitCost: number;

  @Column({ length: 30, default: 'COMPLETED' })
  status: 'COMPLETED' | 'CANCELLED';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ProductionItem, (item) => item.productionEntry, { cascade: true })
  items: ProductionItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
