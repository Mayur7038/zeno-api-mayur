import { PermissionAction, PermissionModule } from '../enums';
export interface RequiredPermission {
    module: PermissionModule;
    action: PermissionAction;
}
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: RequiredPermission[]) => import("@nestjs/common").CustomDecorator<string>;
