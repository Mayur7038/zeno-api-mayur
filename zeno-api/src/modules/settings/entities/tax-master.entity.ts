import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tax_masters')
export class TaxMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2 })
  taxRate: number;

  @Column({ name: 'cgst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cgstRate: number;

  @Column({ name: 'sgst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  sgstRate: number;

  @Column({ name: 'igst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  igstRate: number;

  @Column({ name: 'cess_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cessRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
