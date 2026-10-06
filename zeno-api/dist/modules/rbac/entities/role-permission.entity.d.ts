import { Role } from './role.entity';
import { PermissionAction, PermissionModule } from '../../../common/enums';
export declare class RolePermission {
    id: string;
    roleId: string;
    role: Role;
    moduleName: PermissionModule;
    action: PermissionAction;
    createdAt: Date;
}
