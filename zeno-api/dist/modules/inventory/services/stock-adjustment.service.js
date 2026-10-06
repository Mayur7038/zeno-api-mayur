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
exports.StockAdjustmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_adjustment_entity_1 = require("../entities/stock-adjustment.entity");
const stock_adjustment_item_entity_1 = require("../entities/stock-adjustment-item.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const inventory_service_1 = require("./inventory.service");
let StockAdjustmentService = class StockAdjustmentService {
    adjustmentRepo;
    adjustmentItemRepo;
    godownRepo;
    inventoryService;
    dataSource;
    constructor(adjustmentRepo, adjustmentItemRepo, godownRepo, inventoryService, dataSource) {
        this.adjustmentRepo = adjustmentRepo;
        this.adjustmentItemRepo = adjustmentItemRepo;
        this.godownRepo = godownRepo;
        this.inventoryService = inventoryService;
        this.dataSource = dataSource;
    }
    async getAdjustments(tenantId, companyId) {
        return this.adjustmentRepo.find({
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
    async getAdjustmentById(tenantId, id) {
        const adjustment = await this.adjustmentRepo.findOne({
            where: { id, tenantId },
            relations: [
                'godown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!adjustment)
            throw new common_1.NotFoundException('Stock adjustment not found');
        return adjustment;
    }
    async createAdjustment(tenantId, companyId, data) {
        if (!data.godownId)
            throw new common_1.BadRequestException('Warehouse is required');
        if (!data.items || data.items.length === 0) {
            throw new common_1.BadRequestException('At least one item line is required for adjustment');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const godown = await queryRunner.manager.findOne(godown_entity_1.Godown, {
                where: { id: data.godownId },
            });
            if (!godown)
                throw new common_1.BadRequestException('Warehouse not found');
            const branchId = data.branchId || godown.branchId;
            const adjustmentDate = data.adjustmentDate || new Date().toISOString().split('T')[0];
            const year = new Date().getFullYear();
            const count = await this.adjustmentRepo.count({ where: { tenantId, companyId } });
            const voucherNo = data.voucherNo || `SA-${year}-${String(count + 1).padStart(4, '0')}`;
            let totalQty = 0;
            let totalAmount = 0;
            for (const line of data.items) {
                const qty = Number(line.qty || 0);
                if (qty <= 0) {
                    throw new common_1.BadRequestException('Adjustment quantity must be greater than zero');
                }
                const type = (line.adjustmentType || 'INCREASE').toUpperCase();
                if (type === 'DECREASE') {
                    const currentStock = await this.inventoryService.getCurrentStockBalance(queryRunner.manager, tenantId, companyId, data.godownId, line.itemId, line.variantId);
                    if (currentStock < qty) {
                        throw new common_1.BadRequestException(`Insufficient stock to decrease item! Available: ${currentStock}, Requested: ${qty}`);
                    }
                }
                const rate = Number(line.unitRate || 0);
                const amount = Number(line.totalAmount || qty * rate);
                totalQty += qty;
                totalAmount += amount;
            }
            const adjustment = queryRunner.manager.create(stock_adjustment_entity_1.StockAdjustment, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                adjustmentDate,
                godownId: data.godownId,
                reason: data.reason || 'CORRECTION',
                status: data.status || 'COMPLETED',
                totalQty,
                totalAmount,
                notes: data.notes || null,
            });
            const savedAdjustment = await queryRunner.manager.save(stock_adjustment_entity_1.StockAdjustment, adjustment);
            const itemsToSave = [];
            for (const line of data.items) {
                const qty = Number(line.qty || 0);
                const rate = Number(line.unitRate || 0);
                const amount = Number(line.totalAmount || qty * rate);
                const item = queryRunner.manager.create(stock_adjustment_item_entity_1.StockAdjustmentItem, {
                    tenantId,
                    adjustmentId: savedAdjustment.id,
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    adjustmentType: (line.adjustmentType || 'INCREASE').toUpperCase(),
                    qty,
                    unitRate: rate,
                    totalAmount: amount,
                    reason: line.reason || savedAdjustment.reason,
                });
                itemsToSave.push(item);
            }
            await queryRunner.manager.save(stock_adjustment_item_entity_1.StockAdjustmentItem, itemsToSave);
            if (savedAdjustment.status === 'COMPLETED') {
                const lines = itemsToSave.map((it) => ({
                    godownId: savedAdjustment.godownId,
                    itemId: it.itemId,
                    variantId: it.variantId || undefined,
                    qtyIn: it.adjustmentType === 'INCREASE' ? it.qty : 0,
                    qtyOut: it.adjustmentType === 'DECREASE' ? it.qty : 0,
                    unitRate: it.unitRate,
                }));
                await this.inventoryService.recordStockMovement(queryRunner.manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: adjustmentDate,
                    voucherType: 'STOCK_ADJUSTMENT',
                    voucherId: savedAdjustment.id,
                    voucherNo,
                    lines,
                });
            }
            await queryRunner.commitTransaction();
            return this.getAdjustmentById(tenantId, savedAdjustment.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelAdjustment(tenantId, id) {
        const adjustment = await this.adjustmentRepo.findOne({ where: { id, tenantId } });
        if (!adjustment)
            throw new common_1.NotFoundException('Stock adjustment not found');
        if (adjustment.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Adjustment is already cancelled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (adjustment.status === 'COMPLETED') {
                await this.inventoryService.reverseStockMovement(queryRunner.manager, 'STOCK_ADJUSTMENT', adjustment.id);
            }
            adjustment.status = 'CANCELLED';
            await queryRunner.manager.save(stock_adjustment_entity_1.StockAdjustment, adjustment);
            await queryRunner.commitTransaction();
            return { success: true, message: 'Stock adjustment cancelled successfully' };
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
exports.StockAdjustmentService = StockAdjustmentService;
exports.StockAdjustmentService = StockAdjustmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_adjustment_entity_1.StockAdjustment)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_adjustment_item_entity_1.StockAdjustmentItem)),
    __param(2, (0, typeorm_1.InjectRepository)(godown_entity_1.Godown)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        typeorm_2.DataSource])
], StockAdjustmentService);
//# sourceMappingURL=stock-adjustment.service.js.map