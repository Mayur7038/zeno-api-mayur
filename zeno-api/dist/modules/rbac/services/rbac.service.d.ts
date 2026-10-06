import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserBranchAccess } from '../entities/user-branch-access.entity';
import { User } from '../../auth/entities/user.entity';
import { PermissionAction, PermissionModule } from '../../../common/enums';
export declare class RbacService {
    private roleRepo;
    private permissionRepo;
    private branchAccessRepo;
    private userRepo;
    constructor(roleRepo: Repository<Role>, permissionRepo: Repository<RolePermission>, branchAccessRepo: Repository<UserBranchAccess>, userRepo: Repository<User>);
    getRoles(tenantId: string): Promise<Role[]>;
    createRole(tenantId: string, name: string, description: string, permissions: Array<{
        module: PermissionModule;
        action: PermissionAction;
    }>): Promise<Role>;
    updateRole(tenantId: string, roleId: string, name?: string, description?: string, permissions?: Array<{
        module: PermissionModule;
        action: PermissionAction;
    }>): Promise<Role>;
    deleteRole(tenantId: string, roleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    assignUserBranch(userId: string, branchId: string, isDefault?: boolean): Promise<UserBranchAccess>;
    getUsers(tenantId: string): Promise<User[]>;
    createUser(tenantId: string, data: {
        fullName: string;
        email: string;
        phone?: string;
        roleId?: string;
        password?: string;
    }): Promise<User>;
    updateUserRole(tenantId: string, userId: string, roleId?: string, isActive?: boolean): Promise<User>;
}
