import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestTenantContext {
  tenantId?: string;
  userId?: string;
  companyId?: string;
  branchId?: string;
}

export const tenantContextStorage = new AsyncLocalStorage<RequestTenantContext>();

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = (req.headers['x-tenant-id'] as string) || undefined;
    const companyId = (req.headers['x-company-id'] as string) || undefined;
    const branchId = (req.headers['x-branch-id'] as string) || undefined;

    (req as any).tenantId = tenantId;
    (req as any).companyId = companyId;
    (req as any).branchId = branchId;

    tenantContextStorage.run(
      {
        tenantId,
        companyId,
        branchId,
      },
      () => {
        next();
      },
    );
  }
}
