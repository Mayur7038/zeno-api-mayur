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
  VersionColumn,
} from 'typeorm';
import { GrnStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { GrnItem } from './grn-item.entity';
import { GrnPoMapping } from './grn-po-mapping.entity';

@Entity('goods_receipt_notes')
export class GoodsReceiptNote {
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

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Index()
  @Column({ name: 'godown_id', type: 'uuid' })
  godownId: string;

  @ManyToOne(() => Godown, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Column({ name: 'voucher_no', length: 60 })
  voucherNo: string;

  @Column({ name: 'grn_date', type: 'date' })
  grnDate: string;

  @Index()
  @Column({ name: 'vendor_ledger_id', type: 'uuid' })
  vendorLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_ledger_id' })
  vendorLedger: Ledger;

  @Column({
    type: 'enum',
    enum: GrnStatus,
    default: GrnStatus.PENDING,
  })
  status: GrnStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @VersionColumn({ default: 1 })
  version: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GrnItem, (item) => item.grn, { cascade: true })
  items: GrnItem[];

  @OneToMany(() => GrnPoMapping, (mapping) => mapping.grn, { cascade: true })
  poMappings: GrnPoMapping[];
}
