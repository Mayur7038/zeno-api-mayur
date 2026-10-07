import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('variant_definitions')
export class VariantDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  code: string;

  @Column({ length: 30, default: 'DROPDOWN' })
  type: string; // 'DATE' | 'NUMBER' | 'TEXT' | 'DROPDOWN'

  @Column({ type: 'jsonb', default: () => "'[]'" })
  options: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
