import { RbacService } from '../services/rbac.service';
export declare class RbacController {
    private rbacService;
    constructor(rbacService: RbacService);
    getRoles(tenantId: string): Promise<import("../entities/role.entity").Role[]>;
    createRole(tenantId: string, body: {
        name: string;
        description: string;
        permissions: any[];
    }): Promise<import("../entities/role.entity").Role>;
    updateRole(tenantId: string, roleId: string, body: {
        name?: string;
        description?: string;
        permissions?: any[];
    }): Promise<import("../entities/role.entity").Role>;
    deleteRole(tenantId: string, roleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    assignBranch(body: {
        userId: string;
        branchId: string;
        isDefault?: boolean;
    }): Promise<import("../entities/user-branch-access.entity").UserBranchAccess>;
    getUsers(tenantId: string): Promise<import("../../auth/entities/user.entity").User[]>;
    createUser(tenantId: string, body: {
        fullName: string;
        email: string;
        phone?: string;
        roleId?: string;
    }): Promise<import("../../auth/entities/user.entity").User>;
    updateUser(tenantId: string, userId: string, body: {
        roleId?: string;
        isActive?: boolean;
    }): Promise<import("../../auth/entities/user.entity").User>;
}
