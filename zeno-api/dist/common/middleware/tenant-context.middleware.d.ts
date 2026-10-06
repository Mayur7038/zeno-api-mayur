import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
export interface RequestTenantContext {
    tenantId?: string;
    userId?: string;
    companyId?: string;
    branchId?: string;
}
export declare const tenantContextStorage: AsyncLocalStorage<RequestTenantContext>;
export declare class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
