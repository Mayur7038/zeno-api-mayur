import { Tenant } from '../../tenancy/entities/tenant.entity';
import { Role } from '../../rbac/entities/role.entity';
import { UserBranchAccess } from '../../rbac/entities/user-branch-access.entity';
export declare class User {
    id: string;
    tenantId: string;
    tenant: Tenant;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    roleId: string;
    role: Role;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    branchAccess: UserBranchAccess[];
}
