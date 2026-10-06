"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../entities/role.entity");
const role_permission_entity_1 = require("../entities/role-permission.entity");
const user_branch_access_entity_1 = require("../entities/user-branch-access.entity");
const user_entity_1 = require("../../auth/entities/user.entity");
const enums_1 = require("../../../common/enums");
let RbacService = class RbacService {
    roleRepo;
    permissionRepo;
    branchAccessRepo;
    userRepo;
    constructor(roleRepo, permissionRepo, branchAccessRepo, userRepo) {
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
        this.branchAccessRepo = branchAccessRepo;
        this.userRepo = userRepo;
    }
    async getRoles(tenantId) {
        let roles = await this.roleRepo.find({
            where: { tenantId },
            relations: ['permissions'],
            order: { isSystem: 'DESC', name: 'ASC' },
        });
        if (roles.length === 0) {
            const standardRoles = [
                { name: enums_1.RoleType.ADMIN, desc: 'Full enterprise administrative access' },
                { name: enums_1.RoleType.ACCOUNTANT, desc: 'Financial accounting, vouchers, bank & tax reconciliation' },
                { name: enums_1.RoleType.PURCHASE_MANAGER, desc: 'Purchase orders, vendor bills, and supplier ledger control' },
                { name: enums_1.RoleType.STORE_KEEPER, desc: 'Warehouse stock in/out, goods receipt, delivery challans' },
                { name: enums_1.RoleType.VIEWER, desc: 'Read-only audit and reporting access' },
            ];
            for (const r of standardRoles) {
                const createdRole = this.roleRepo.create({
                    tenantId,
                    name: r.name,
                    description: r.desc,
                    isSystem: true,
                });
                const saved = await this.roleRepo.save(createdRole);
                const perms = [];
                const allModules = Object.values(enums_1.PermissionModule);
                for (const mod of allModules) {
                    if (r.name === enums_1.RoleType.ADMIN) {
                        for (const act of Object.values(enums_1.PermissionAction)) {
                            perms.push(this.permissionRepo.create({ roleId: saved.id, moduleName: mod, action: act }));
                        }
                    }
                    else {
                        perms.push(this.permissionRepo.create({ roleId: saved.id, moduleName: mod, action: enums_1.PermissionAction.VIEW }));
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
    async createRole(tenantId, name, description, permissions) {
        const existing = await this.roleRepo.findOne({ where: { tenantId, name } });
        if (existing) {
            throw new common_1.BadRequestException(`Role with name "${name}" already exists`);
        }
        const role = this.roleRepo.create({
            tenantId,
            name,
            description,
            isSystem: false,
        });
        const savedRole = await this.roleRepo.save(role);
        if (permissions && permissions.length > 0) {
            const perms = permissions.map((p) => this.permissionRepo.create({
                roleId: savedRole.id,
                moduleName: p.module || p.moduleName,
                action: p.action,
            }));
            await this.permissionRepo.save(perms);
        }
        return this.roleRepo.findOne({
            where: { id: savedRole.id },
            relations: ['permissions'],
        });
    }
    async updateRole(tenantId, roleId, name, description, permissions) {
        let role = await this.roleRepo.findOne({ where: { id: roleId, tenantId } });
        if (!role) {
            role = await this.roleRepo.findOne({ where: { id: roleId } });
        }
        if (!role) {
            throw new common_1.BadRequestException('Role not found');
        }
        if (name && !role.isSystem)
            role.name = name.trim();
        if (description !== undefined)
            role.description = description;
        await this.roleRepo.save(role);
        if (permissions) {
            await this.permissionRepo.delete({ roleId });
            const seen = new Set();
            const perms = [];
            for (const p of permissions) {
                const mod = p.module || p.moduleName;
                const act = p.action;
                if (!mod || !act)
                    continue;
                const key = `${mod}_${act}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    perms.push(this.permissionRepo.create({
                        roleId: role.id,
                        moduleName: mod,
                        action: act,
                    }));
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
    async deleteRole(tenantId, roleId) {
        const role = await this.roleRepo.findOne({ where: { id: roleId, tenantId } });
        if (!role) {
            throw new common_1.BadRequestException('Role not found');
        }
        if (role.isSystem) {
            throw new common_1.BadRequestException('System predefined roles cannot be deleted');
        }
        await this.roleRepo.delete({ id: roleId, tenantId });
        return { success: true, message: 'Role deleted successfully' };
    }
    async assignUserBranch(userId, branchId, isDefault = false) {
        if (isDefault) {
            await this.branchAccessRepo.update({ userId }, { isDefault: false });
        }
        const access = this.branchAccessRepo.create({ userId, branchId, isDefault });
        return this.branchAccessRepo.save(access);
    }
    async getUsers(tenantId) {
        return this.userRepo.find({
            where: { tenantId },
            relations: ['role'],
            order: { createdAt: 'ASC' },
        });
    }
    async createUser(tenantId, data) {
        const email = data.email.toLowerCase().trim();
        const existing = await this.userRepo.findOne({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const cleanRoleId = data.roleId && data.roleId !== 'null' && data.roleId !== '' ? data.roleId : null;
        const user = this.userRepo.create({
            tenantId,
            email,
            fullName: data.fullName,
            phone: data.phone,
            roleId: cleanRoleId,
            passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyG0vK4QWjL7oA8U1J2h3i4k5l6m7n8o',
            isEmailVerified: true,
            isActive: true,
        });
        const saved = await this.userRepo.save(user);
        return this.userRepo.findOne({ where: { id: saved.id }, relations: ['role'] });
    }
    async updateUserRole(tenantId, userId, roleId, isActive) {
        let user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
        if (!user) {
            user = await this.userRepo.findOne({ where: { id: userId } });
        }
        if (!user) {
            throw new common_1.BadRequestException('User not found');
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
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(2, (0, typeorm_1.InjectRepository)(user_branch_access_entity_1.UserBranchAccess)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RbacService);
//# sourceMappingURL=rbac.service.js.map