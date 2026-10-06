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
exports.ManufacturingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const manufacturing_service_1 = require("../services/manufacturing.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
let ManufacturingController = class ManufacturingController {
    manufacturingService;
    constructor(manufacturingService) {
        this.manufacturingService = manufacturingService;
    }
    async getBoms(tenantId, companyId) {
        return this.manufacturingService.getBoms(tenantId, companyId);
    }
    async getBomById(tenantId, id) {
        return this.manufacturingService.getBomById(tenantId, id);
    }
    async createBom(tenantId, body) {
        return this.manufacturingService.createBom(tenantId, body.companyId, body);
    }
    async updateBom(tenantId, id, body) {
        return this.manufacturingService.updateBom(tenantId, id, body);
    }
    async deleteBom(tenantId, id) {
        return this.manufacturingService.deleteBom(tenantId, id);
    }
    async getProductionEntries(tenantId, companyId) {
        return this.manufacturingService.getProductionEntries(tenantId, companyId);
    }
    async getProductionEntryById(tenantId, id) {
        return this.manufacturingService.getProductionEntryById(tenantId, id);
    }
    async createProductionEntry(tenantId, body) {
        return this.manufacturingService.createProductionEntry(tenantId, body.companyId, body);
    }
    async cancelProductionEntry(tenantId, id) {
        return this.manufacturingService.cancelProductionEntry(tenantId, id);
    }
};
exports.ManufacturingController = ManufacturingController;
__decorate([
    (0, common_1.Get)('boms'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Bills of Materials for company' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "getBoms", null);
__decorate([
    (0, common_1.Get)('boms/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get BOM by ID with component lines' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "getBomById", null);
__decorate([
    (0, common_1.Post)('boms'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new Bill of Materials recipe' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "createBom", null);
__decorate([
    (0, common_1.Put)('boms/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update Bill of Materials recipe' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "updateBom", null);
__decorate([
    (0, common_1.Delete)('boms/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete Bill of Materials' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "deleteBom", null);
__decorate([
    (0, common_1.Get)('production-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Assembly/Production entries' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "getProductionEntries", null);
__decorate([
    (0, common_1.Get)('production-entries/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Production entry by ID with lines and stock details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "getProductionEntryById", null);
__decorate([
    (0, common_1.Post)('production-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute Assembly/Production run (deducts raw materials, creates finished goods)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "createProductionEntry", null);
__decorate([
    (0, common_1.Put)('production-entries/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel/Reverse assembly run and restore stock atomically' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManufacturingController.prototype, "cancelProductionEntry", null);
exports.ManufacturingController = ManufacturingController = __decorate([
    (0, swagger_1.ApiTags)('Manufacturing (BOM & Assembly)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('manufacturing'),
    __metadata("design:paramtypes", [manufacturing_service_1.ManufacturingService])
], ManufacturingController);
//# sourceMappingURL=manufacturing.controller.js.map