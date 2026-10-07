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
exports.MastersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const masters_service_1 = require("../services/masters.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
let MastersController = class MastersController {
    mastersService;
    constructor(mastersService) {
        this.mastersService = mastersService;
    }
    async getLedgerGroups(tenantId, companyId) {
        return this.mastersService.getLedgerGroups(tenantId, companyId);
    }
    async createLedgerGroup(tenantId, body) {
        return this.mastersService.createLedgerGroup(tenantId, body.companyId, body);
    }
    async updateLedgerGroup(tenantId, id, body) {
        return this.mastersService.updateLedgerGroup(tenantId, id, body);
    }
    async deleteLedgerGroup(tenantId, id) {
        return this.mastersService.deleteLedgerGroup(tenantId, id);
    }
    async getLedgers(tenantId, companyId, isVendorOnly, isCustomerOnly) {
        return this.mastersService.getLedgers(tenantId, companyId, isVendorOnly === 'true', isCustomerOnly === 'true');
    }
    async createLedger(tenantId, body) {
        return this.mastersService.createLedger(tenantId, body.companyId, body);
    }
    async updateLedger(tenantId, id, body) {
        return this.mastersService.updateLedger(tenantId, id, body);
    }
    async deleteLedger(tenantId, id) {
        return this.mastersService.deleteLedger(tenantId, id);
    }
    async getUnits(tenantId, companyId) {
        return this.mastersService.getUnits(tenantId, companyId);
    }
    async createUnit(tenantId, body) {
        return this.mastersService.createUnit(tenantId, body.companyId, body);
    }
    async updateUnit(tenantId, id, body) {
        return this.mastersService.updateUnit(tenantId, id, body);
    }
    async deleteUnit(tenantId, id) {
        return this.mastersService.deleteUnit(tenantId, id);
    }
    async getItemGroups(tenantId, companyId) {
        return this.mastersService.getItemGroups(tenantId, companyId);
    }
    async createItemGroup(tenantId, body) {
        return this.mastersService.createItemGroup(tenantId, body.companyId, body);
    }
    async updateItemGroup(tenantId, id, body) {
        return this.mastersService.updateItemGroup(tenantId, id, body);
    }
    async deleteItemGroup(tenantId, id) {
        return this.mastersService.deleteItemGroup(tenantId, id);
    }
    async getItemCategories(tenantId, companyId, itemGroupId) {
        return this.mastersService.getItemCategories(tenantId, companyId, itemGroupId);
    }
    async createItemCategory(tenantId, body) {
        return this.mastersService.createItemCategory(tenantId, body.companyId, body);
    }
    async updateItemCategory(tenantId, id, body) {
        return this.mastersService.updateItemCategory(tenantId, id, body);
    }
    async deleteItemCategory(tenantId, id) {
        return this.mastersService.deleteItemCategory(tenantId, id);
    }
    async getVariants(tenantId, companyId, itemId) {
        return this.mastersService.getVariants(tenantId, companyId, itemId);
    }
    async createVariant(tenantId, body) {
        return this.mastersService.createVariant(tenantId, body);
    }
    async updateVariant(tenantId, id, body) {
        return this.mastersService.updateVariant(tenantId, id, body);
    }
    async deleteVariant(tenantId, id) {
        return this.mastersService.deleteVariant(tenantId, id);
    }
    async getVariantDefinitions(tenantId, companyId) {
        return this.mastersService.getVariantDefinitions(tenantId, companyId);
    }
    async createVariantDefinition(tenantId, body) {
        return this.mastersService.createVariantDefinition(tenantId, body.companyId, body);
    }
    async updateVariantDefinition(tenantId, id, body) {
        return this.mastersService.updateVariantDefinition(tenantId, id, body);
    }
    async deleteVariantDefinition(tenantId, id) {
        return this.mastersService.deleteVariantDefinition(tenantId, id);
    }
    async getItems(tenantId, companyId, search) {
        return this.mastersService.getItems(tenantId, companyId, search);
    }
    async getItemById(tenantId, id) {
        return this.mastersService.getItemById(tenantId, id);
    }
    async createItem(tenantId, body) {
        return this.mastersService.createItem(tenantId, body.companyId, body);
    }
    async updateItem(tenantId, id, body) {
        return this.mastersService.updateItem(tenantId, id, body);
    }
    async deleteItem(tenantId, id) {
        return this.mastersService.deleteItem(tenantId, id);
    }
};
exports.MastersController = MastersController;
__decorate([
    (0, common_1.Get)('ledger-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ledger groups (Tally hierarchy)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getLedgerGroups", null);
__decorate([
    (0, common_1.Post)('ledger-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Create custom ledger group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createLedgerGroup", null);
__decorate([
    (0, common_1.Put)('ledger-groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Rename ledger group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateLedgerGroup", null);
__decorate([
    (0, common_1.Delete)('ledger-groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete custom ledger group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteLedgerGroup", null);
__decorate([
    (0, common_1.Get)('ledgers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ledgers (optionally filter vendors or customers)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('isVendorOnly')),
    __param(3, (0, common_1.Query)('isCustomerOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getLedgers", null);
__decorate([
    (0, common_1.Post)('ledgers'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new ledger with GSTIN and address' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createLedger", null);
__decorate([
    (0, common_1.Put)('ledgers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update ledger details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateLedger", null);
__decorate([
    (0, common_1.Delete)('ledgers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete custom ledger' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteLedger", null);
__decorate([
    (0, common_1.Get)('units'),
    (0, swagger_1.ApiOperation)({ summary: 'Get measurement units' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getUnits", null);
__decorate([
    (0, common_1.Post)('units'),
    (0, swagger_1.ApiOperation)({ summary: 'Create unit with decimal precision' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createUnit", null);
__decorate([
    (0, common_1.Put)('units/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update measurement unit' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateUnit", null);
__decorate([
    (0, common_1.Delete)('units/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete measurement unit' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteUnit", null);
__decorate([
    (0, common_1.Get)('item-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get item groups' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getItemGroups", null);
__decorate([
    (0, common_1.Post)('item-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Create item group with group-level GST' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createItemGroup", null);
__decorate([
    (0, common_1.Put)('item-groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateItemGroup", null);
__decorate([
    (0, common_1.Delete)('item-groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete item group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteItemGroup", null);
__decorate([
    (0, common_1.Get)('item-categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get item categories' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('itemGroupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getItemCategories", null);
__decorate([
    (0, common_1.Post)('item-categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Create item category' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createItemCategory", null);
__decorate([
    (0, common_1.Put)('item-categories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item category' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateItemCategory", null);
__decorate([
    (0, common_1.Delete)('item-categories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete item category' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteItemCategory", null);
__decorate([
    (0, common_1.Get)('variants'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all item variants' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getVariants", null);
__decorate([
    (0, common_1.Post)('variants'),
    (0, swagger_1.ApiOperation)({ summary: 'Create item variant' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createVariant", null);
__decorate([
    (0, common_1.Put)('variants/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item variant' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateVariant", null);
__decorate([
    (0, common_1.Delete)('variants/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete item variant' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteVariant", null);
__decorate([
    (0, common_1.Get)('variant-definitions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all variant definitions (attributes)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getVariantDefinitions", null);
__decorate([
    (0, common_1.Post)('variant-definitions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create variant definition with type and options' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createVariantDefinition", null);
__decorate([
    (0, common_1.Put)('variant-definitions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update variant definition' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateVariantDefinition", null);
__decorate([
    (0, common_1.Delete)('variant-definitions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete variant definition' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteVariantDefinition", null);
__decorate([
    (0, common_1.Get)('items'),
    (0, swagger_1.ApiOperation)({ summary: 'Get items with unit, category, and variants' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getItems", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get item by ID with tab details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "getItemById", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, swagger_1.ApiOperation)({ summary: 'Create item across Basic, Sales/Purchase, Image, Description tabs' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "createItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete item' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MastersController.prototype, "deleteItem", null);
exports.MastersController = MastersController = __decorate([
    (0, swagger_1.ApiTags)('Masters (Ledgers, Items, Units)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('masters'),
    __metadata("design:paramtypes", [masters_service_1.MastersService])
], MastersController);
//# sourceMappingURL=masters.controller.js.map