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
const stock_transfer_service_1 = require("../services/stock-transfer.service");
const stock_adjustment_service_1 = require("../services/stock-adjustment.service");
const price_list_service_1 = require("../services/price-list.service");
const price_list_entity_1 = require("../entities/price-list.entity");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
let InventoryController = class InventoryController {
    inventoryService;
    transferService;
    adjustmentService;
    priceListService;
    stockRepo;
    constructor(inventoryService, transferService, adjustmentService, priceListService, stockRepo) {
        this.inventoryService = inventoryService;
        this.transferService = transferService;
        this.adjustmentService = adjustmentService;
        this.priceListService = priceListService;
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
    async getItemStatement(tenantId, companyId, itemId, startDate, endDate) {
        const qb = this.stockRepo.createQueryBuilder('s')
            .leftJoinAndSelect('s.godown', 'godown')
            .leftJoinAndSelect('s.variant', 'variant')
            .where('s.tenant_id = :tenantId', { tenantId })
            .andWhere('s.company_id = :companyId', { companyId })
            .andWhere('s.item_id = :itemId', { itemId })
            .orderBy('s.entry_date', 'ASC')
            .addOrderBy('s.created_at', 'ASC');
        if (startDate)
            qb.andWhere('s.entry_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('s.entry_date <= :endDate', { endDate });
        const entries = await qb.getMany();
        let runningQty = 0;
        let runningVal = 0;
        let totalInQty = 0;
        let totalOutQty = 0;
        const processedEntries = entries.map(e => {
            const qIn = Number(e.qtyIn || 0);
            const qOut = Number(e.qtyOut || 0);
            const v = Number(e.totalValue || 0);
            runningQty += (qIn - qOut);
            if (qIn > 0) {
                runningVal += v;
                totalInQty += qIn;
            }
            else if (qOut > 0) {
                runningVal -= v;
                totalOutQty += qOut;
            }
            return {
                id: e.id,
                entryDate: e.entryDate,
                voucherType: e.voucherType,
                voucherNo: e.voucherNo,
                qtyIn: qIn,
                qtyOut: qOut,
                unitRate: Number(e.unitRate || 0),
                totalValue: v,
                runningQty: Number(runningQty.toFixed(3)),
                godownName: e.godown ? e.godown.name : '',
            };
        });
        return {
            itemId,
            entries: processedEntries,
            totalInQty: Number(totalInQty.toFixed(3)),
            totalOutQty: Number(totalOutQty.toFixed(3)),
            closingQty: Number(runningQty.toFixed(3)),
            closingValue: Number(runningVal.toFixed(2)),
        };
    }
    async getOpeningBalances(tenantId, companyId, godownId) {
        if (!godownId)
            throw new common_1.BadRequestException('Warehouse ID is required');
        return this.inventoryService.getOpeningBalances(this.stockRepo.manager, tenantId, companyId, godownId);
    }
    async updateOpeningBalances(tenantId, body) {
        return this.inventoryService.updateOpeningBalances(this.stockRepo.manager, tenantId, body.companyId, body);
    }
    async getTransfers(tenantId, companyId) {
        return this.transferService.getTransfers(tenantId, companyId);
    }
    async getTransferById(tenantId, id) {
        return this.transferService.getTransferById(tenantId, id);
    }
    async createTransfer(tenantId, body) {
        return this.transferService.createTransfer(tenantId, body.companyId, body);
    }
    async cancelTransfer(tenantId, id) {
        return this.transferService.cancelTransfer(tenantId, id);
    }
    async getAdjustments(tenantId, companyId) {
        return this.adjustmentService.getAdjustments(tenantId, companyId);
    }
    async getAdjustmentById(tenantId, id) {
        return this.adjustmentService.getAdjustmentById(tenantId, id);
    }
    async createAdjustment(tenantId, body) {
        return this.adjustmentService.createAdjustment(tenantId, body.companyId, body);
    }
    async cancelAdjustment(tenantId, id) {
        return this.adjustmentService.cancelAdjustment(tenantId, id);
    }
    async getPriceLists(tenantId, companyId, pricingType, activeOnly) {
        return this.priceListService.getPriceLists(tenantId, companyId, {
            pricingType,
            activeOnly: activeOnly === 'true',
        });
    }
    async getEffectivePrice(tenantId, companyId, itemId, customerId, asOfDate) {
        if (!itemId)
            throw new common_1.BadRequestException('Item ID is required');
        return this.priceListService.getEffectivePrice(tenantId, companyId, itemId, customerId, asOfDate);
    }
    async getPriceListById(tenantId, id) {
        return this.priceListService.getPriceListById(tenantId, id);
    }
    async createPriceList(tenantId, body) {
        return this.priceListService.createPriceList(tenantId, body.companyId, body);
    }
    async updatePriceList(tenantId, id, body) {
        return this.priceListService.updatePriceList(tenantId, id, body);
    }
    async deletePriceList(tenantId, id) {
        return this.priceListService.deletePriceList(tenantId, id);
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
__decorate([
    (0, common_1.Get)('item-statement'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chronological stock ledger entries for a specific item' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('itemId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getItemStatement", null);
__decorate([
    (0, common_1.Get)('opening-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get opening stock balances for items in a warehouse' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('godownId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getOpeningBalances", null);
__decorate([
    (0, common_1.Post)('opening-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Set or update opening stock balances for items in a warehouse' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateOpeningBalances", null);
__decorate([
    (0, common_1.Get)('transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'List all stock transfer vouchers' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getTransfers", null);
__decorate([
    (0, common_1.Get)('transfers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock transfer details by ID' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getTransferById", null);
__decorate([
    (0, common_1.Post)('transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'Create and complete warehouse-to-warehouse stock transfer' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Put)('transfers/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel stock transfer and reverse ledger movement' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "cancelTransfer", null);
__decorate([
    (0, common_1.Get)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: 'List all stock adjustment vouchers' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAdjustments", null);
__decorate([
    (0, common_1.Get)('adjustments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock adjustment details by ID' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAdjustmentById", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: 'Create and post manual stock adjustment (increase / decrease)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Put)('adjustments/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel stock adjustment and reverse ledger movement' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "cancelAdjustment", null);
__decorate([
    (0, common_1.Get)('price-lists'),
    (0, swagger_1.ApiOperation)({ summary: 'Get price lists filtered by type, customer, or group' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('pricingType')),
    __param(3, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPriceLists", null);
__decorate([
    (0, common_1.Get)('price-lists/effective-price'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve effective selling price for an item based on customer & group rules' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('itemId')),
    __param(3, (0, common_1.Query)('customerId')),
    __param(4, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getEffectivePrice", null);
__decorate([
    (0, common_1.Get)('price-lists/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get price list by ID' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPriceListById", null);
__decorate([
    (0, common_1.Post)('price-lists'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new price list rule with effective dates' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createPriceList", null);
__decorate([
    (0, common_1.Put)('price-lists/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update price list rule' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updatePriceList", null);
__decorate([
    (0, common_1.Delete)('price-lists/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete price list rule' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deletePriceList", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('inventory'),
    __param(4, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        stock_transfer_service_1.StockTransferService,
        stock_adjustment_service_1.StockAdjustmentService,
        price_list_service_1.PriceListService,
        typeorm_2.Repository])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map