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
import { Godown } from '../../tenancy/entities/godown.entity';
import { StockAdjustmentItem } from './stock-adjustment-item.entity';

@Entity('stock_adjustments')
export class StockAdjustment {
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

  @Column({ name: 'adjustment_date', type: 'date' })
  adjustmentDate: string;

  @Index()
  @Column({ name: 'godown_id', type: 'uuid' })
  godownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Column({ length: 40, default: 'CORRECTION' })
  reason: string; // DAMAGE | EXPIRATION | SHRINKAGE | SCRAP | FOUND_SURPLUS | CORRECTION | OTHER

  @Column({ length: 20, default: 'COMPLETED' })
  status: string; // DRAFT | COMPLETED | CANCELLED

  @Column({ name: 'total_qty', type: 'decimal', precision: 15, scale: 3, default: 0 })
  totalQty: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => StockAdjustmentItem, (item) => item.adjustment, { cascade: true })
  items: StockAdjustmentItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
