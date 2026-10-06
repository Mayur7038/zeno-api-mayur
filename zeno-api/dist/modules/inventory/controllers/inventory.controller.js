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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const inventory_service_1 = require("../services/inventory.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
let InventoryController = class InventoryController {
    inventoryService;
    stockRepo;
    constructor(inventoryService, stockRepo) {
        this.inventoryService = inventoryService;
        this.stockRepo = stockRepo;
    }
    async getStockSummary(tenantId, companyId, godownId) {
        const qb = this.stockRepo
            .createQueryBuilder('sl')
            .innerJoin('sl.item', 'item')
            .leftJoin('sl.godown', 'godown')
            .leftJoin('item.unit', 'unit')
            .select('item.id', 'itemId')
            .addSelect('item.name', 'itemName')
            .addSelect('item.sku', 'sku')
            .addSelect('unit.code', 'unitCode')
            .addSelect('COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0)', 'currentStock')
            .addSelect('COALESCE(AVG(sl.unit_rate), 0)', 'averageRate')
            .where('sl.tenant_id = :tenantId', { tenantId })
            .andWhere('sl.company_id = :companyId', { companyId });
        if (godownId) {
            qb.andWhere('sl.godown_id = :godownId', { godownId });
        }
        qb.groupBy('item.id')
            .addGroupBy('item.name')
            .addGroupBy('item.sku')
            .addGroupBy('unit.code');
        const results = await qb.getRawMany();
        return results.map((r) => {
            const stock = Number(r.currentStock || 0);
            const rate = Number(r.averageRate || 0);
            return {
                itemId: r.itemId,
                itemName: r.itemName,
                sku: r.sku,
                unit: r.unitCode || 'NOS',
                currentStock: Number(stock.toFixed(3)),
                averageRate: Number(rate.toFixed(4)),
                totalValue: Number((stock * rate).toFixed(2)),
            };
        });
    }
    async getItemBalance(tenantId, companyId, godownId, itemId, variantId) {
        const balance = await this.inventoryService.getCurrentStockBalance(this.stockRepo.manager, tenantId, companyId, godownId, itemId, variantId);
        return {
            itemId,
            godownId,
            variantId: variantId || null,
            currentBalance: balance,
        };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock summary report with available quantity and valuation' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('godownId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStockSummary", null);
__decorate([
    (0, common_1.Get)('item-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Check real-time stock balance for a specific item in godown' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('godownId')),
    __param(3, (0, common_1.Query)('itemId')),
    __param(4, (0, common_1.Query)('variantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getItemBalance", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory & Stock Ledger'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('inventory'),
    __param(1, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        typeorm_2.Repository])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map