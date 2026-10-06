"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextMiddleware = exports.tenantContextStorage = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
exports.tenantContextStorage = new async_hooks_1.AsyncLocalStorage();
let TenantContextMiddleware = class TenantContextMiddleware {
    use(req, res, next) {
        const tenantId = req.headers['x-tenant-id'] || undefined;
        const companyId = req.headers['x-company-id'] || undefined;
        const branchId = req.headers['x-branch-id'] || undefined;
        req.tenantId = tenantId;
        req.companyId = companyId;
        req.branchId = branchId;
        exports.tenantContextStorage.run({
            tenantId,
            companyId,
            branchId,
        }, () => {
            next();
        });
    }
};
exports.TenantContextMiddleware = TenantContextMiddleware;
exports.TenantContextMiddleware = TenantContextMiddleware = __decorate([
    (0, common_1.Injectable)()
], TenantContextMiddleware);
//# sourceMappingURL=tenant-context.middleware.js.map