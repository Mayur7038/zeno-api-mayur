import { RolePermission } from './role-permission.entity';
export declare class Role {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions: RolePermission[];
}
