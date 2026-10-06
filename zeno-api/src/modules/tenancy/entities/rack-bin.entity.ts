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
import { Godown } from './godown.entity';

@Entity('racks_bins')
export class RackBin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'godown_id', type: 'uuid' })
  godownId: string;

  @ManyToOne(() => Godown, (godown) => godown.racksBins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'godown_id' })
  godown: Godown;

  @Column({ name: 'rack_code', length: 50 })
  rackCode: string;

  @Column({ name: 'bin_code', length: 50 })
  binCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
