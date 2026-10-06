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
  Unique,
} from 'typeorm';
import { DeliveryChallanStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { DeliveryChallanItem } from './delivery-challan-item.entity';
import { DeliveryChallanSoMapping } from './delivery-challan-so-mapping.entity';

@Entity('delivery_challans')
@Unique(['tenantId', 'companyId', 'branchId', 'voucherNo'])
export class DeliveryChallan {
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

  @Column({ name: 'voucher_no', length: 50 })
  voucherNo: string;

  @Column({ name: 'challan_date', type: 'date' })
  challanDate: string;

  @Index()
  @Column({ name: 'customer_ledger_id', type: 'uuid' })
  customerLedgerId: string;

  @ManyToOne(() => Ledger, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_ledger_id' })
  customerLedger: Ledger;

  @Column({ name: 'transport_mode', length: 50, nullable: true })
  transportMode: string;

  @Column({ name: 'vehicle_no', length: 50, nullable: true })
  vehicleNo: string;

  @Column({ name: 'e_way_bill_no', length: 50, nullable: true })
  eWayBillNo: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'tax_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({
    type: 'enum',
    enum: DeliveryChallanStatus,
    default: DeliveryChallanStatus.PENDING,
  })
  status: DeliveryChallanStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DeliveryChallanItem, (item) => item.deliveryChallan, { cascade: true })
  items: DeliveryChallanItem[];

  @OneToMany(() => DeliveryChallanSoMapping, (mapping) => mapping.deliveryChallan, {
    cascade: true,
  })
  salesOrders: DeliveryChallanSoMapping[];
}
