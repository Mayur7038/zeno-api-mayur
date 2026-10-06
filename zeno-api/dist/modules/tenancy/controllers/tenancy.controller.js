"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenancyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenancy_service_1 = require("../services/tenancy.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
let TenancyController = class TenancyController {
    tenancyService;
    constructor(tenancyService) {
        this.tenancyService = tenancyService;
    }
    async getCompanies(tenantId) {
        return this.tenancyService.getCompanies(tenantId);
    }
    async updateCompany(tenantId, companyId, data) {
        return this.tenancyService.updateCompany(tenantId, companyId, data);
    }
    async getBranches(tenantId, companyId) {
        return this.tenancyService.getBranches(tenantId, companyId);
    }
    async createBranch(tenantId, data) {
        return this.tenancyService.createBranch(tenantId, data);
    }
    async getGodowns(tenantId, branchId) {
        return this.tenancyService.getGodowns(tenantId, branchId);
    }
    async createGodown(tenantId, data) {
        return this.tenancyService.createGodown(tenantId, data);
    }
    async updateGodown(tenantId, godownId, data) {
        return this.tenancyService.updateGodown(tenantId, godownId, data);
    }
    async deleteGodown(tenantId, godownId) {
        return this.tenancyService.deleteGodown(tenantId, godownId);
    }
    async getRacksBins(tenantId, godownId) {
        return this.tenancyService.getRacksBins(tenantId, godownId);
    }
    async createRackBin(tenantId, data) {
        return this.tenancyService.createRackBin(tenantId, data);
    }
};
exports.TenancyController = TenancyController;
__decorate([
    (0, common_1.Get)('companies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all companies in the current tenant' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Put)('companies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update company details & branding' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, swagger_1.ApiOperation)({ summary: 'Get branches for tenant/company' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Post)('branches'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new branch' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Get)('godowns'),
    (0, swagger_1.ApiOperation)({ summary: 'Get godowns/warehouses' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "getGodowns", null);
__decorate([
    (0, common_1.Post)('godowns'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new godown / warehouse' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "createGodown", null);
__decorate([
    (0, common_1.Put)('godowns/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update godown / warehouse' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "updateGodown", null);
__decorate([
    (0, common_1.Delete)('godowns/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete godown / warehouse' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "deleteGodown", null);
__decorate([
    (0, common_1.Get)('racks-bins'),
    (0, swagger_1.ApiOperation)({ summary: 'Get racks & bins for a godown' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('godownId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "getRacksBins", null);
__decorate([
    (0, common_1.Post)('racks-bins'),
    (0, swagger_1.ApiOperation)({ summary: 'Create rack/bin in godown' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenancyController.prototype, "createRackBin", null);
exports.TenancyController = TenancyController = __decorate([
    (0, swagger_1.ApiTags)('Tenancy & Hierarchy'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('tenancy'),
    __metadata("design:paramtypes", [tenancy_service_1.TenancyService])
], TenancyController);
//# sourceMappingURL=tenancy.controller.js.map