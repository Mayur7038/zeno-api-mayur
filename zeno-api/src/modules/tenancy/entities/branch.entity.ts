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
import { Company } from './company.entity';
import { Godown } from './godown.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'branch_name', length: 150 })
  branchName: string;

  @Column({ name: 'branch_code', length: 20 })
  branchCode: string;

  @Column({ name: 'state_code', length: 2, default: '27' })
  stateCode: string;

  @Column({ name: 'state_name', length: 100, default: 'Maharashtra' })
  stateName: string;

  @Column({ name: 'address_line1', type: 'text', nullable: true })
  addressLine1: string;

  @Column({ length: 10, nullable: true })
  pincode: string;

  @Column({ name: 'is_head_office', default: false })
  isHeadOffice: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Godown, (godown) => godown.branch)
  godowns: Godown[];
}
