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
exports.StockTransferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_transfer_entity_1 = require("../entities/stock-transfer.entity");
const stock_transfer_item_entity_1 = require("../entities/stock-transfer-item.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const inventory_service_1 = require("./inventory.service");
let StockTransferService = class StockTransferService {
    transferRepo;
    transferItemRepo;
    godownRepo;
    inventoryService;
    dataSource;
    constructor(transferRepo, transferItemRepo, godownRepo, inventoryService, dataSource) {
        this.transferRepo = transferRepo;
        this.transferItemRepo = transferItemRepo;
        this.godownRepo = godownRepo;
        this.inventoryService = inventoryService;
        this.dataSource = dataSource;
    }
    async getTransfers(tenantId, companyId) {
        return this.transferRepo.find({
            where: { tenantId, companyId },
            relations: [
                'sourceGodown',
                'destinationGodown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
            order: { createdAt: 'DESC' },
        });
    }
    async getTransferById(tenantId, id) {
        const transfer = await this.transferRepo.findOne({
            where: { id, tenantId },
            relations: [
                'sourceGodown',
                'destinationGodown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!transfer)
            throw new common_1.NotFoundException('Stock transfer not found');
        return transfer;
    }
    async createTransfer(tenantId, companyId, data) {
        if (!data.sourceGodownId)
            throw new common_1.BadRequestException('Source warehouse is required');
        if (!data.destinationGodownId)
            throw new common_1.BadRequestException('Destination warehouse is required');
        if (data.sourceGodownId === data.destinationGodownId) {
            throw new common_1.BadRequestException('Source and destination warehouses cannot be the same');
        }
        if (!data.items || data.items.length === 0) {
            throw new common_1.BadRequestException('At least one item line is required for stock transfer');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sourceGodown = await queryRunner.manager.findOne(godown_entity_1.Godown, {
                where: { id: data.sourceGodownId },
            });
            const destGodown = await queryRunner.manager.findOne(godown_entity_1.Godown, {
                where: { id: data.destinationGodownId },
            });
            if (!sourceGodown || !destGodown) {
                throw new common_1.BadRequestException('Invalid source or destination warehouse');
            }
            const branchId = data.branchId || sourceGodown.branchId;
            const transferDate = data.transferDate || new Date().toISOString().split('T')[0];
            const year = new Date().getFullYear();
            const count = await this.transferRepo.count({ where: { tenantId, companyId } });
            const voucherNo = data.voucherNo || `ST-${year}-${String(count + 1).padStart(4, '0')}`;
            let totalQty = 0;
            let totalAmount = 0;
            for (const line of data.items) {
                const qty = Number(line.transferQty || line.qty || 0);
                if (qty <= 0) {
                    throw new common_1.BadRequestException('Transfer quantity must be greater than zero');
                }
                const currentStock = await this.inventoryService.getCurrentStockBalance(queryRunner.manager, tenantId, companyId, data.sourceGodownId, line.itemId, line.variantId);
                if (currentStock < qty) {
                    throw new common_1.BadRequestException(`Insufficient stock in source warehouse for item! Available: ${currentStock}, Requested: ${qty}`);
                }
                const rate = Number(line.unitRate || 0);
                const amount = Number(line.totalAmount || qty * rate);
                totalQty += qty;
                totalAmount += amount;
            }
            const transfer = queryRunner.manager.create(stock_transfer_entity_1.StockTransfer, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                transferDate,
                sourceGodownId: data.sourceGodownId,
                destinationGodownId: data.destinationGodownId,
                status: data.status || 'COMPLETED',
                totalQty,
                totalAmount,
                notes: data.notes || null,
            });
            const savedTransfer = await queryRunner.manager.save(stock_transfer_entity_1.StockTransfer, transfer);
            const itemsToSave = [];
            for (const line of data.items) {
                const qty = Number(line.transferQty || line.qty || 0);
                const rate = Number(line.unitRate || 0);
                const amount = Number(line.totalAmount || qty * rate);
                const item = queryRunner.manager.create(stock_transfer_item_entity_1.StockTransferItem, {
                    tenantId,
                    transferId: savedTransfer.id,
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    transferQty: qty,
                    unitRate: rate,
                    totalAmount: amount,
                    notes: line.notes || null,
                });
                itemsToSave.push(item);
            }
            await queryRunner.manager.save(stock_transfer_item_entity_1.StockTransferItem, itemsToSave);
            if (savedTransfer.status === 'COMPLETED') {
                await this.inventoryService.recordStockMovement(queryRunner.manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: transferDate,
                    voucherType: 'STOCK_TRANSFER',
                    voucherId: savedTransfer.id,
                    voucherNo,
                    lines: itemsToSave.map((it) => ({
                        godownId: savedTransfer.sourceGodownId,
                        itemId: it.itemId,
                        variantId: it.variantId || undefined,
                        qtyOut: it.transferQty,
                        unitRate: it.unitRate,
                    })),
                });
                await this.inventoryService.recordStockMovement(queryRunner.manager, {
                    tenantId,
                    companyId,
                    branchId: destGodown.branchId,
                    entryDate: transferDate,
                    voucherType: 'STOCK_TRANSFER',
                    voucherId: savedTransfer.id,
                    voucherNo,
                    lines: itemsToSave.map((it) => ({
                        godownId: savedTransfer.destinationGodownId,
                        itemId: it.itemId,
                        variantId: it.variantId || undefined,
                        qtyIn: it.transferQty,
                        unitRate: it.unitRate,
                    })),
                });
            }
            await queryRunner.commitTransaction();
            return this.getTransferById(tenantId, savedTransfer.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelTransfer(tenantId, id) {
        const transfer = await this.transferRepo.findOne({ where: { id, tenantId } });
        if (!transfer)
            throw new common_1.NotFoundException('Stock transfer not found');
        if (transfer.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Transfer is already cancelled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (transfer.status === 'COMPLETED') {
                await this.inventoryService.reverseStockMovement(queryRunner.manager, 'STOCK_TRANSFER', transfer.id);
            }
            transfer.status = 'CANCELLED';
            await queryRunner.manager.save(stock_transfer_entity_1.StockTransfer, transfer);
            await queryRunner.commitTransaction();
            return { success: true, message: 'Stock transfer cancelled successfully' };
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
exports.StockTransferService = StockTransferService;
exports.StockTransferService = StockTransferService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_transfer_entity_1.StockTransfer)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_transfer_item_entity_1.StockTransferItem)),
    __param(2, (0, typeorm_1.InjectRepository)(godown_entity_1.Godown)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        typeorm_2.DataSource])
], StockTransferService);
//# sourceMappingURL=stock-transfer.service.js.map