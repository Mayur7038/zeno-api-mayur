import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserBranchAccess } from '../entities/user-branch-access.entity';
import { User } from '../../auth/entities/user.entity';
import { PermissionAction, PermissionModule, RoleType } from '../../../common/enums';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private permissionRepo: Repository<RolePermission>,
    @InjectRepository(UserBranchAccess)
    private branchAccessRepo: Repository<UserBranchAccess>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getRoles(tenantId: string) {
    let roles = await this.roleRepo.find({
      where: { tenantId },
      relations: ['permissions'],
      order: { isSystem: 'DESC', name: 'ASC' },
    });

    if (roles.length === 0) {
      // Auto-provision standard roles if tenant has none
      const standardRoles = [
        { name: RoleType.ADMIN, desc: 'Full enterprise administrative access' },
        { name: RoleType.ACCOUNTANT, desc: 'Financial accounting, vouchers, bank & tax reconciliation' },
        { name: RoleType.PURCHASE_MANAGER, desc: 'Purchase orders, vendor bills, and supplier ledger control' },
        { name: RoleType.STORE_KEEPER, desc: 'Warehouse stock in/out, goods receipt, delivery challans' },
        { name: RoleType.VIEWER, desc: 'Read-only audit and reporting access' },
      ];

      for (const r of standardRoles) {
        const createdRole = this.roleRepo.create({
          tenantId,
          name: r.name,
          description: r.desc,
          isSystem: true,
        });
        const saved = await this.roleRepo.save(createdRole);

        // Assign basic permissions
        const perms: RolePermission[] = [];
        const allModules = Object.values(PermissionModule);
        for (const mod of allModules) {
          if (r.name === RoleType.ADMIN) {
            for (const act of Object.values(PermissionAction)) {
              perms.push(this.permissionRepo.create({ roleId: saved.id, moduleName: mod, action: act }));
            }
          } else {
            perms.push(this.permissionRepo.create({ roleId: saved.id, moduleName: mod, action: PermissionAction.VIEW }));
          }
        }
        if (perms.length > 0) {
          await this.permissionRepo.save(perms);
        }
      }

      roles = await this.roleRepo.find({
        where: { tenantId },
        relations: ['permissions'],
        order: { isSystem: 'DESC', name: 'ASC' },
      });
    }

    return roles;
  }

  async createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: Array<{ module: PermissionModule; action: PermissionAction }>,
  ) {
    const existing = await this.roleRepo.findOne({ where: { tenantId, name } });
    if (existing) {
      throw new BadRequestException(`Role with name "${name}" already exists`);
    }

    const role = this.roleRepo.create({
      tenantId,
      name,
      description,
      isSystem: false,
    });
    const savedRole = await this.roleRepo.save(role);

    if (permissions && permissions.length > 0) {
      const perms = permissions.map((p: any) =>
        this.permissionRepo.create({
          roleId: savedRole.id,
          moduleName: p.module || p.moduleName,
          action: p.action,
        }),
      );
      await this.permissionRepo.save(perms);
    }

    return this.roleRepo.findOne({
      where: { id: savedRole.id },
      relations: ['permissions'],
    });
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    name?: string,
    description?: string,
    permissions?: Array<{ module: PermissionModule; action: PermissionAction }>,
  ) {
    let role = await this.roleRepo.findOne({ where: { id: roleId, tenantId } });
    if (!role) {
      role = await this.roleRepo.findOne({ where: { id: roleId } });
    }
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (name && !role.isSystem) role.name = name.trim();
    if (description !== undefined) role.description = description;
    await this.roleRepo.save(role);

    if (permissions) {
      await this.permissionRepo.delete({ roleId });
      const seen = new Set<string>();
      const perms: RolePermission[] = [];
      for (const p of permissions as any[]) {
        const mod = p.module || p.moduleName;
        const act = p.action;
        if (!mod || !act) continue;
        const key = `${mod}_${act}`;
        if (!seen.has(key)) {
          seen.add(key);
          perms.push(
            this.permissionRepo.create({
              roleId: role.id,
              moduleName: mod,
              action: act,
            }),
          );
        }
      }
      if (perms.length > 0) {
        await this.permissionRepo.save(perms);
      }
    }

    return this.roleRepo.findOne({
      where: { id: role.id },
      relations: ['permissions'],
    });
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('System predefined roles cannot be deleted');
    }
    await this.roleRepo.delete({ id: roleId, tenantId });
    return { success: true, message: 'Role deleted successfully' };
  }

  async assignUserBranch(userId: string, branchId: string, isDefault = false) {
    if (isDefault) {
      await this.branchAccessRepo.update({ userId }, { isDefault: false });
    }
    const access = this.branchAccessRepo.create({ userId, branchId, isDefault });
    return this.branchAccessRepo.save(access);
  }

  // Users in Tenant
  async getUsers(tenantId: string) {
    return this.userRepo.find({
      where: { tenantId },
      relations: ['role'],
      order: { createdAt: 'ASC' },
    });
  }

  async createUser(
    tenantId: string,
    data: { fullName: string; email: string; phone?: string; roleId?: string; password?: string },
  ) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const cleanRoleId = data.roleId && data.roleId !== 'null' && data.roleId !== '' ? data.roleId : null;
    const user = this.userRepo.create({
      tenantId,
      email,
      fullName: data.fullName,
      phone: data.phone,
      roleId: cleanRoleId,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyG0vK4QWjL7oA8U1J2h3i4k5l6m7n8o', // Default hashed pwd
      isEmailVerified: true,
      isActive: true,
    });
    const saved = await this.userRepo.save(user);
    return this.userRepo.findOne({ where: { id: saved.id }, relations: ['role'] });
  }

  async updateUserRole(
    tenantId: string,
    userId: string,
    roleId?: string,
    isActive?: boolean,
  ) {
    let user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      user = await this.userRepo.findOne({ where: { id: userId } });
    }
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (roleId !== undefined) {
      user.roleId = roleId && roleId !== 'null' && roleId !== '' ? roleId : null;
    }
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    await this.userRepo.save(user);
    return this.userRepo.findOne({ where: { id: user.id }, relations: ['role'] });
  }
}
