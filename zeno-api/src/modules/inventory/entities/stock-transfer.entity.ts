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
import { StockTransferItem } from './stock-transfer-item.entity';

@Entity('stock_transfers')
export class StockTransfer {
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

  @Column({ name: 'transfer_date', type: 'date' })
  transferDate: string;

  @Index()
  @Column({ name: 'source_godown_id', type: 'uuid' })
  sourceGodownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_godown_id' })
  sourceGodown: Godown;

  @Index()
  @Column({ name: 'destination_godown_id', type: 'uuid' })
  destinationGodownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_godown_id' })
  destinationGodown: Godown;

  @Column({ length: 20, default: 'COMPLETED' })
  status: string; // DRAFT | COMPLETED | CANCELLED

  @Column({ name: 'total_qty', type: 'decimal', precision: 15, scale: 3, default: 0 })
  totalQty: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => StockTransferItem, (item) => item.transfer, { cascade: true })
  items: StockTransferItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
