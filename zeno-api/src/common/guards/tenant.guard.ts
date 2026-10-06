import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Global Super Admin has bypass
    if (user?.role?.isSystem && !user?.tenantId) {
      return true;
    }

    const tenantId = user?.tenantId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required for this operation');
    }

    if (user?.tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access forbidden');
    }

    request.tenantId = tenantId;
    return true;
  }
}
