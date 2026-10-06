import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BalanceType } from '../../../common/enums';
import { LedgerGroup } from './ledger-group.entity';

@Entity('ledgers')
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'ledger_group_id', type: 'uuid' })
  ledgerGroupId: string;

  @ManyToOne(() => LedgerGroup, (lg) => lg.ledgers, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_group_id' })
  ledgerGroup: LedgerGroup;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 60, nullable: true })
  code: string;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({
    name: 'balance_type',
    type: 'enum',
    enum: BalanceType,
    default: BalanceType.DR,
  })
  balanceType: BalanceType;

  @Column({ length: 15, nullable: true })
  gstin: string;

  @Column({ length: 10, nullable: true })
  pan: string;

  @Column({ name: 'state_code', length: 2, nullable: true })
  stateCode: string;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ name: 'credit_days', default: 0 })
  creditDays: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  pincode: string;

  @Column({ length: 60, nullable: true, default: 'India' })
  country: string;

  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ name: 'contact_person', length: 100, nullable: true })
  contactPerson: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true })
  mobile: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 150, nullable: true })
  website: string;

  @Column({ name: 'bank_name', length: 120, nullable: true })
  bankName: string;

  @Column({ name: 'bank_account_name', length: 150, nullable: true })
  bankAccountName: string;

  @Column({ name: 'bank_account_number', length: 50, nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_ifsc', length: 20, nullable: true })
  bankIfsc: string;

  @Column({ name: 'bank_branch', length: 100, nullable: true })
  bankBranch: string;

  @Column({ name: 'upi_id', length: 80, nullable: true })
  upiId: string;

  @Column({ name: 'is_predefined', default: false })
  isPredefined: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
