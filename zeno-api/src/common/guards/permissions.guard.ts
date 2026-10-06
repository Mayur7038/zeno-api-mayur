import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/require-permissions.decorator';
import { RoleType } from '../enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Super Admin or Admin role has full access
    if (user.role?.name === RoleType.SUPER_ADMIN || user.role?.name === RoleType.ADMIN) {
      return true;
    }

    const userPermissions = user.role?.permissions || [];

    const hasAll = requiredPermissions.every((req) =>
      userPermissions.some(
        (up: any) => up.moduleName === req.module && up.action === req.action,
      ),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }

    return true;
  }
}
