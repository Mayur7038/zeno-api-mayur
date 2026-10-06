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
import { LedgerGroupNature } from '../../../common/enums';
import { Ledger } from './ledger.entity';

@Entity('ledger_groups')
export class LedgerGroup {
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

  @Column({ length: 60, nullable: true })
  code: string;

  @Index()
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => LedgerGroup, (lg) => lg.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: LedgerGroup;

  @OneToMany(() => LedgerGroup, (lg) => lg.parent)
  children: LedgerGroup[];

  @Column({ type: 'enum', enum: LedgerGroupNature })
  nature: LedgerGroupNature;

  @Column({ name: 'is_creditor_vendor', default: false })
  isCreditorVendor: boolean;

  @Column({ name: 'is_debtor_customer', default: false })
  isDebtorCustomer: boolean;

  @Column({ name: 'is_predefined', default: false })
  isPredefined: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Ledger, (ledger) => ledger.ledgerGroup)
  ledgers: Ledger[];
}
