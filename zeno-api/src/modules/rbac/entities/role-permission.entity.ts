import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Role } from './role.entity';
import { PermissionAction, PermissionModule } from '../../../common/enums';

@Entity('role_permissions')
@Unique(['roleId', 'moduleName', 'action'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'module_name', type: 'enum', enum: PermissionModule })
  moduleName: PermissionModule;

  @Column({ type: 'enum', enum: PermissionAction })
  action: PermissionAction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
