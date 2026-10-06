import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { RackBin } from '../../tenancy/entities/rack-bin.entity';

@Entity('stock_ledger')
export class StockLedger {
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
  @Column({ name: 'godown_id', type: 'uuid' })
  godownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Index()
  @Column({ name: 'rack_bin_id', type: 'uuid', nullable: true })
  rackBinId: string;

  @ManyToOne(() => RackBin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rack_bin_id' })
  rackBin: RackBin;

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

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Column({ name: 'voucher_type', length: 40 })
  voucherType: string;

  @Index()
  @Column({ name: 'voucher_id', type: 'uuid' })
  voucherId: string;

  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'qty_in', type: 'decimal', precision: 15, scale: 3, default: 0 })
  qtyIn: number;

  @Column({ name: 'qty_out', type: 'decimal', precision: 15, scale: 3, default: 0 })
  qtyOut: number;

  @Column({ name: 'unit_rate', type: 'decimal', precision: 15, scale: 4, default: 0 })
  unitRate: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
