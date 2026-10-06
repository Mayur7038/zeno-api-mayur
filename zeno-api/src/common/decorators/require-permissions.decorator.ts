import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionModule } from '../enums';

export interface RequiredPermission {
  module: PermissionModule;
  action: PermissionAction;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
