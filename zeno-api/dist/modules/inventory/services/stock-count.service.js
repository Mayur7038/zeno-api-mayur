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
exports.StockCountService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_count_entity_1 = require("../entities/stock-count.entity");
const stock_count_item_entity_1 = require("../entities/stock-count-item.entity");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const inventory_service_1 = require("./inventory.service");
let StockCountService = class StockCountService {
    countRepo;
    countItemRepo;
    godownRepo;
    itemRepo;
    stockRepo;
    inventoryService;
    dataSource;
    constructor(countRepo, countItemRepo, godownRepo, itemRepo, stockRepo, inventoryService, dataSource) {
        this.countRepo = countRepo;
        this.countItemRepo = countItemRepo;
        this.godownRepo = godownRepo;
        this.itemRepo = itemRepo;
        this.stockRepo = stockRepo;
        this.inventoryService = inventoryService;
        this.dataSource = dataSource;
    }
    async getStockCounts(tenantId, companyId) {
        return this.countRepo.find({
            where: { tenantId, companyId },
            relations: [
                'godown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
            order: { createdAt: 'DESC' },
        });
    }
    async getStockCountById(tenantId, id) {
        const count = await this.countRepo.findOne({
            where: { id, tenantId },
            relations: [
                'godown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!count)
            throw new common_1.NotFoundException('Stock count record not found');
        return count;
    }
    async initiateStockCount(tenantId, companyId, data) {
        if (!data.godownId)
            throw new common_1.BadRequestException('Warehouse is required to initiate stock count');
        const godown = await this.godownRepo.findOne({ where: { id: data.godownId } });
        if (!godown)
            throw new common_1.BadRequestException('Warehouse not found');
        const branchId = data.branchId || godown.branchId;
        const countDate = data.countDate || new Date().toISOString().split('T')[0];
        const year = new Date().getFullYear();
        const totalCount = await this.countRepo.count({ where: { tenantId, companyId } });
        const voucherNo = data.voucherNo || `SC-${year}-${String(totalCount + 1).padStart(4, '0')}`;
        const bookStocksRaw = await this.stockRepo
            .createQueryBuilder('sl')
            .innerJoin('sl.item', 'item')
            .select('sl.item_id', 'itemId')
            .addSelect('COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0)', 'bookQty')
            .addSelect('COALESCE(AVG(sl.unit_rate), 0)', 'unitRate')
            .where('sl.tenant_id = :tenantId', { tenantId })
            .andWhere('sl.company_id = :companyId', { companyId })
            .andWhere('sl.godown_id = :godownId', { godownId: data.godownId })
            .groupBy('sl.item_id')
            .getRawMany();
        const stockMap = new Map();
        for (const b of bookStocksRaw) {
            stockMap.set(b.itemId, {
                bookQty: Number(b.bookQty || 0),
                unitRate: Number(b.unitRate || 0),
            });
        }
        const allItems = await this.itemRepo.find({
            where: { tenantId, companyId, isActive: true },
            order: { name: 'ASC' },
        });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const stockCount = queryRunner.manager.create(stock_count_entity_1.StockCount, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                countDate,
                godownId: data.godownId,
                status: 'IN_PROGRESS',
                totalBookQty: 0,
                totalPhysicalQty: 0,
                discrepancyQty: 0,
                discrepancyValue: 0,
                notes: data.notes || null,
            });
            const savedCount = await queryRunner.manager.save(stock_count_entity_1.StockCount, stockCount);
            let totalBookQty = 0;
            let totalPhysicalQty = 0;
            const itemsToSave = [];
            const targetItems = data.items && data.items.length > 0 ? data.items : allItems.map((i) => ({ itemId: i.id }));
            for (const t of targetItems) {
                const itemInfo = stockMap.get(t.itemId);
                const bookQty = itemInfo ? itemInfo.bookQty : 0;
                const fallbackRate = allItems.find((i) => i.id === t.itemId)?.purchaseRate || 0;
                const unitRate = itemInfo && itemInfo.unitRate > 0 ? itemInfo.unitRate : Number(fallbackRate);
                const physicalQty = t.physicalQty !== undefined ? Number(t.physicalQty) : bookQty;
                const diffQty = physicalQty - bookQty;
                const diffVal = Number((diffQty * unitRate).toFixed(2));
                totalBookQty += bookQty;
                totalPhysicalQty += physicalQty;
                const countItem = queryRunner.manager.create(stock_count_item_entity_1.StockCountItem, {
                    tenantId,
                    stockCountId: savedCount.id,
                    itemId: t.itemId,
                    variantId: t.variantId || null,
                    bookQty,
                    physicalQty,
                    differenceQty: diffQty,
                    unitRate,
                    differenceValue: diffVal,
                    remarks: t.remarks || null,
                });
                itemsToSave.push(countItem);
            }
            await queryRunner.manager.save(stock_count_item_entity_1.StockCountItem, itemsToSave);
            savedCount.totalBookQty = totalBookQty;
            savedCount.totalPhysicalQty = totalPhysicalQty;
            savedCount.discrepancyQty = totalPhysicalQty - totalBookQty;
            savedCount.discrepancyValue = Number(itemsToSave.reduce((acc, curr) => acc + Number(curr.differenceValue), 0).toFixed(2));
            await queryRunner.manager.save(stock_count_entity_1.StockCount, savedCount);
            await queryRunner.commitTransaction();
            return this.getStockCountById(tenantId, savedCount.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateStockCount(tenantId, id, data) {
        const existing = await this.countRepo.findOne({
            where: { id, tenantId },
            relations: ['items'],
        });
        if (!existing)
            throw new common_1.NotFoundException('Stock count not found');
        if (existing.status === 'RECONCILED') {
            throw new common_1.BadRequestException('Cannot edit an already reconciled stock count');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            existing.notes = data.notes !== undefined ? data.notes : existing.notes;
            existing.countDate = data.countDate || existing.countDate;
            const itemUpdates = data.items || [];
            const itemMap = new Map(itemUpdates.map((it) => [it.id || it.itemId, it]));
            let totalBookQty = 0;
            let totalPhysicalQty = 0;
            let totalDiscrepancyVal = 0;
            for (const item of existing.items) {
                const update = itemMap.get(item.id) || itemMap.get(item.itemId);
                if (update) {
                    const physicalQty = Number(update.physicalQty !== undefined ? update.physicalQty : item.physicalQty);
                    item.physicalQty = physicalQty;
                    item.differenceQty = physicalQty - Number(item.bookQty);
                    item.differenceValue = Number((item.differenceQty * Number(item.unitRate)).toFixed(2));
                    item.remarks = update.remarks !== undefined ? update.remarks : item.remarks;
                }
                totalBookQty += Number(item.bookQty);
                totalPhysicalQty += Number(item.physicalQty);
                totalDiscrepancyVal += Number(item.differenceValue);
            }
            await queryRunner.manager.save(stock_count_item_entity_1.StockCountItem, existing.items);
            existing.totalBookQty = totalBookQty;
            existing.totalPhysicalQty = totalPhysicalQty;
            existing.discrepancyQty = totalPhysicalQty - totalBookQty;
            existing.discrepancyValue = Number(totalDiscrepancyVal.toFixed(2));
            await queryRunner.manager.save(stock_count_entity_1.StockCount, existing);
            await queryRunner.commitTransaction();
            return this.getStockCountById(tenantId, id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async reconcileStockCount(tenantId, id) {
        const count = await this.getStockCountById(tenantId, id);
        if (!count)
            throw new common_1.NotFoundException('Stock count not found');
        if (count.status === 'RECONCILED') {
            throw new common_1.BadRequestException('Stock count is already reconciled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const discrepancyItems = count.items.filter((it) => Number(it.differenceQty) !== 0);
            if (discrepancyItems.length > 0) {
                const movementLines = discrepancyItems.map((it) => {
                    const diff = Number(it.differenceQty);
                    return {
                        godownId: count.godownId,
                        itemId: it.itemId,
                        variantId: it.variantId || undefined,
                        qtyIn: diff > 0 ? diff : 0,
                        qtyOut: diff < 0 ? Math.abs(diff) : 0,
                        unitRate: Number(it.unitRate),
                    };
                });
                await this.inventoryService.recordStockMovement(queryRunner.manager, {
                    tenantId,
                    companyId: count.companyId,
                    branchId: count.branchId,
                    entryDate: count.countDate,
                    voucherType: 'STOCK_COUNT',
                    voucherId: count.id,
                    voucherNo: count.voucherNo,
                    lines: movementLines,
                });
            }
            count.status = 'RECONCILED';
            await queryRunner.manager.save(stock_count_entity_1.StockCount, count);
            await queryRunner.commitTransaction();
            return this.getStockCountById(tenantId, id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelStockCount(tenantId, id) {
        const count = await this.countRepo.findOne({ where: { id, tenantId } });
        if (!count)
            throw new common_1.NotFoundException('Stock count not found');
        if (count.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Stock count is already cancelled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (count.status === 'RECONCILED') {
                await this.inventoryService.reverseStockMovement(queryRunner.manager, 'STOCK_COUNT', count.id);
            }
            count.status = 'CANCELLED';
            await queryRunner.manager.save(stock_count_entity_1.StockCount, count);
            await queryRunner.commitTransaction();
            return { success: true, message: 'Stock count cancelled successfully' };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.StockCountService = StockCountService;
exports.StockCountService = StockCountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_count_entity_1.StockCount)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_count_item_entity_1.StockCountItem)),
    __param(2, (0, typeorm_1.InjectRepository)(godown_entity_1.Godown)),
    __param(3, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(4, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        typeorm_2.DataSource])
], StockCountService);
//# sourceMappingURL=stock-count.service.js.map