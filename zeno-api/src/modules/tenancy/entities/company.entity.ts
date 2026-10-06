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
import { Tenant } from './tenant.entity';
import { Branch } from './branch.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.companies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'legal_name', length: 200 })
  legalName: string;

  @Column({ name: 'trade_name', length: 200, nullable: true })
  tradeName: string;

  @Column({ length: 15, nullable: true })
  gstin: string;

  @Column({ length: 10, nullable: true })
  pan: string;

  @Column({ name: 'currency_code', length: 3, default: 'INR' })
  currencyCode: string;

  @Column({ name: 'financial_year_start', type: 'date', default: '2025-04-01' })
  financialYearStart: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];
}
