import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('financial_years')
export class FinancialYear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 100 })
  name: string; // e.g. "F.Y. 2025-2026"

  @Column({ name: 'start_date', type: 'date' })
  startDate: string; // "2025-04-01"

  @Column({ name: 'end_date', type: 'date' })
  endDate: string; // "2026-03-31"

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @Column({ name: 'closing_notes', type: 'text', nullable: true })
  closingNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
