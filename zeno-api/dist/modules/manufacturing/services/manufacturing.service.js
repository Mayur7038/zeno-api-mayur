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
exports.ManufacturingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bom_entity_1 = require("../entities/bom.entity");
const bom_item_entity_1 = require("../entities/bom-item.entity");
const production_entry_entity_1 = require("../entities/production-entry.entity");
const production_item_entity_1 = require("../entities/production-item.entity");
const stock_ledger_entity_1 = require("../../inventory/entities/stock-ledger.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
let ManufacturingService = class ManufacturingService {
    bomRepo;
    bomItemRepo;
    productionRepo;
    productionItemRepo;
    stockLedgerRepo;
    itemRepo;
    dataSource;
    constructor(bomRepo, bomItemRepo, productionRepo, productionItemRepo, stockLedgerRepo, itemRepo, dataSource) {
        this.bomRepo = bomRepo;
        this.bomItemRepo = bomItemRepo;
        this.productionRepo = productionRepo;
        this.productionItemRepo = productionItemRepo;
        this.stockLedgerRepo = stockLedgerRepo;
        this.itemRepo = itemRepo;
        this.dataSource = dataSource;
    }
    async getBoms(tenantId, companyId) {
        return this.bomRepo.find({
            where: { tenantId, companyId },
            relations: ['finishedItem', 'finishedVariant', 'items', 'items.item'],
            order: { createdAt: 'DESC' },
        });
    }
    async getBomById(tenantId, id) {
        const bom = await this.bomRepo.findOne({
            where: { id, tenantId },
            relations: [
                'finishedItem',
                'finishedItem.unit',
                'finishedVariant',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!bom)
            throw new common_1.NotFoundException('Bill of Materials not found');
        return bom;
    }
    async createBom(tenantId, companyId, data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const year = new Date().getFullYear();
            const count = await this.bomRepo.count({ where: { tenantId, companyId } });
            const bomNo = data.bomNo || `BOM-${year}-${String(count + 1).padStart(4, '0')}`;
            let rawMaterialCost = 0;
            const itemsData = data.items || [];
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.totalAmount) || qty * rate;
                rawMaterialCost += lineTotal;
            }
            const laborCost = Number(data.estimatedLaborCost) || 0;
            const overheadCost = Number(data.estimatedOverheadCost) || 0;
            const totalCost = rawMaterialCost + laborCost + overheadCost;
            const bom = queryRunner.manager.create(bom_entity_1.BillOfMaterials, {
                tenantId,
                companyId,
                bomNo,
                name: data.name,
                finishedItemId: data.finishedItemId,
                finishedVariantId: data.finishedVariantId || null,
                producedQty: Number(data.producedQty) || 1,
                estimatedLaborCost: laborCost,
                estimatedOverheadCost: overheadCost,
                totalCost,
                isActive: data.isActive !== undefined ? data.isActive : true,
                description: data.description || null,
            });
            const savedBom = await queryRunner.manager.save(bom_entity_1.BillOfMaterials, bom);
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.totalAmount) || qty * rate;
                const bomItem = queryRunner.manager.create(bom_item_entity_1.BomItem, {
                    tenantId,
                    bomId: savedBom.id,
                    itemId: it.itemId,
                    variantId: it.variantId || null,
                    consumedQty: qty,
                    unitRate: rate,
                    scrapPercentage: Number(it.scrapPercentage) || 0,
                    totalAmount: lineTotal,
                    notes: it.notes || null,
                });
                await queryRunner.manager.save(bom_item_entity_1.BomItem, bomItem);
            }
            await queryRunner.commitTransaction();
            return this.getBomById(tenantId, savedBom.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateBom(tenantId, id, data) {
        const existing = await this.bomRepo.findOne({ where: { id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('BOM not found');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let rawMaterialCost = 0;
            const itemsData = data.items || [];
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.totalAmount) || qty * rate;
                rawMaterialCost += lineTotal;
            }
            const laborCost = Number(data.estimatedLaborCost) || 0;
            const overheadCost = Number(data.estimatedOverheadCost) || 0;
            const totalCost = rawMaterialCost + laborCost + overheadCost;
            existing.name = data.name || existing.name;
            existing.finishedItemId = data.finishedItemId || existing.finishedItemId;
            existing.finishedVariantId = data.finishedVariantId !== undefined ? data.finishedVariantId : existing.finishedVariantId;
            existing.producedQty = Number(data.producedQty) || existing.producedQty;
            existing.estimatedLaborCost = laborCost;
            existing.estimatedOverheadCost = overheadCost;
            existing.totalCost = totalCost;
            existing.isActive = data.isActive !== undefined ? data.isActive : existing.isActive;
            existing.description = data.description !== undefined ? data.description : existing.description;
            await queryRunner.manager.save(bom_entity_1.BillOfMaterials, existing);
            await queryRunner.manager.delete(bom_item_entity_1.BomItem, { bomId: existing.id, tenantId });
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.totalAmount) || qty * rate;
                const bomItem = queryRunner.manager.create(bom_item_entity_1.BomItem, {
                    tenantId,
                    bomId: existing.id,
                    itemId: it.itemId,
                    variantId: it.variantId || null,
                    consumedQty: qty,
                    unitRate: rate,
                    scrapPercentage: Number(it.scrapPercentage) || 0,
                    totalAmount: lineTotal,
                    notes: it.notes || null,
                });
                await queryRunner.manager.save(bom_item_entity_1.BomItem, bomItem);
            }
            await queryRunner.commitTransaction();
            return this.getBomById(tenantId, existing.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deleteBom(tenantId, id) {
        const bom = await this.bomRepo.findOne({ where: { id, tenantId } });
        if (!bom)
            throw new common_1.NotFoundException('BOM not found');
        const linkedCount = await this.productionRepo.count({ where: { bomId: id, tenantId } });
        if (linkedCount > 0) {
            throw new common_1.BadRequestException('Cannot delete BOM linked to existing production entries. Deactivate it instead.');
        }
        await this.bomRepo.delete({ id, tenantId });
        return { success: true, message: 'BOM deleted successfully' };
    }
    async getProductionEntries(tenantId, companyId) {
        return this.productionRepo.find({
            where: { tenantId, companyId },
            relations: [
                'finishedItem',
                'finishedVariant',
                'bom',
                'sourceGodown',
                'targetGodown',
                'items',
                'items.item',
            ],
            order: { createdAt: 'DESC' },
        });
    }
    async getProductionEntryById(tenantId, id) {
        const entry = await this.productionRepo.findOne({
            where: { id, tenantId },
            relations: [
                'finishedItem',
                'finishedItem.unit',
                'finishedVariant',
                'bom',
                'sourceGodown',
                'targetGodown',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!entry)
            throw new common_1.NotFoundException('Production entry not found');
        return entry;
    }
    async createProductionEntry(tenantId, companyId, data) {
        if (!data.finishedItemId)
            throw new common_1.BadRequestException('Finished product is required');
        if (!data.sourceGodownId)
            throw new common_1.BadRequestException('Source raw material warehouse is required');
        if (!data.targetGodownId)
            throw new common_1.BadRequestException('Target finished goods warehouse is required');
        if (!data.assembledQty || Number(data.assembledQty) <= 0) {
            throw new common_1.BadRequestException('Assembled quantity must be greater than zero');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const year = new Date().getFullYear();
            const count = await this.productionRepo.count({ where: { tenantId, companyId } });
            const voucherNo = data.voucherNo || `ASM-${year}-${String(count + 1).padStart(4, '0')}`;
            const entryDate = data.entryDate || new Date().toISOString().split('T')[0];
            const branchId = data.branchId || (await this.getDefaultBranchId(queryRunner, companyId));
            let rawMaterialCost = 0;
            const itemsData = data.items || [];
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.amount) || qty * rate;
                rawMaterialCost += lineTotal;
            }
            const laborCost = Number(data.additionalLaborCost) || 0;
            const overheadCost = Number(data.additionalOverheadCost) || 0;
            const totalCost = rawMaterialCost + laborCost + overheadCost;
            const assembledQty = Number(data.assembledQty);
            const unitCost = assembledQty > 0 ? totalCost / assembledQty : 0;
            const entry = queryRunner.manager.create(production_entry_entity_1.ProductionEntry, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                entryDate,
                bomId: data.bomId || null,
                finishedItemId: data.finishedItemId,
                finishedVariantId: data.finishedVariantId || null,
                assembledQty,
                sourceGodownId: data.sourceGodownId,
                targetGodownId: data.targetGodownId,
                rawMaterialCost,
                additionalLaborCost: laborCost,
                additionalOverheadCost: overheadCost,
                totalCost,
                unitCost,
                status: 'COMPLETED',
                notes: data.notes || null,
            });
            const savedEntry = await queryRunner.manager.save(production_entry_entity_1.ProductionEntry, entry);
            for (const it of itemsData) {
                const qty = Number(it.consumedQty) || 0;
                const rate = Number(it.unitRate) || 0;
                const lineTotal = Number(it.amount) || qty * rate;
                const prodItem = queryRunner.manager.create(production_item_entity_1.ProductionItem, {
                    tenantId,
                    productionEntryId: savedEntry.id,
                    itemId: it.itemId,
                    variantId: it.variantId || null,
                    consumedQty: qty,
                    unitRate: rate,
                    amount: lineTotal,
                    notes: it.notes || null,
                });
                await queryRunner.manager.save(production_item_entity_1.ProductionItem, prodItem);
                const stockOut = queryRunner.manager.create(stock_ledger_entity_1.StockLedger, {
                    tenantId,
                    companyId,
                    branchId,
                    godownId: data.sourceGodownId,
                    itemId: it.itemId,
                    variantId: it.variantId || null,
                    entryDate,
                    voucherType: 'ASSEMBLY_CONSUMPTION',
                    voucherId: savedEntry.id,
                    voucherNo,
                    qtyIn: 0,
                    qtyOut: qty,
                    unitRate: rate,
                    totalValue: lineTotal,
                });
                await queryRunner.manager.save(stock_ledger_entity_1.StockLedger, stockOut);
                await queryRunner.manager.decrement(item_entity_1.Item, { id: it.itemId, tenantId }, 'currentStock', qty);
            }
            const stockIn = queryRunner.manager.create(stock_ledger_entity_1.StockLedger, {
                tenantId,
                companyId,
                branchId,
                godownId: data.targetGodownId,
                itemId: data.finishedItemId,
                variantId: data.finishedVariantId || null,
                entryDate,
                voucherType: 'ASSEMBLY_OUTPUT',
                voucherId: savedEntry.id,
                voucherNo,
                qtyIn: assembledQty,
                qtyOut: 0,
                unitRate: unitCost,
                totalValue: totalCost,
            });
            await queryRunner.manager.save(stock_ledger_entity_1.StockLedger, stockIn);
            await queryRunner.manager.increment(item_entity_1.Item, { id: data.finishedItemId, tenantId }, 'currentStock', assembledQty);
            await queryRunner.commitTransaction();
            return this.getProductionEntryById(tenantId, savedEntry.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelProductionEntry(tenantId, id) {
        const entry = await this.productionRepo.findOne({
            where: { id, tenantId },
            relations: ['items'],
        });
        if (!entry)
            throw new common_1.NotFoundException('Production entry not found');
        if (entry.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Production entry is already cancelled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const today = new Date().toISOString().split('T')[0];
            for (const it of entry.items) {
                const stockReversalIn = queryRunner.manager.create(stock_ledger_entity_1.StockLedger, {
                    tenantId,
                    companyId: entry.companyId,
                    branchId: entry.branchId,
                    godownId: entry.sourceGodownId,
                    itemId: it.itemId,
                    variantId: it.variantId || null,
                    entryDate: today,
                    voucherType: 'ASSEMBLY_REVERSAL_IN',
                    voucherId: entry.id,
                    voucherNo: `REV-${entry.voucherNo}`,
                    qtyIn: Number(it.consumedQty),
                    qtyOut: 0,
                    unitRate: Number(it.unitRate),
                    totalValue: Number(it.amount),
                });
                await queryRunner.manager.save(stock_ledger_entity_1.StockLedger, stockReversalIn);
                await queryRunner.manager.increment(item_entity_1.Item, { id: it.itemId, tenantId }, 'currentStock', Number(it.consumedQty));
            }
            const stockReversalOut = queryRunner.manager.create(stock_ledger_entity_1.StockLedger, {
                tenantId,
                companyId: entry.companyId,
                branchId: entry.branchId,
                godownId: entry.targetGodownId,
                itemId: entry.finishedItemId,
                variantId: entry.finishedVariantId || null,
                entryDate: today,
                voucherType: 'ASSEMBLY_REVERSAL_OUT',
                voucherId: entry.id,
                voucherNo: `REV-${entry.voucherNo}`,
                qtyIn: 0,
                qtyOut: Number(entry.assembledQty),
                unitRate: Number(entry.unitCost),
                totalValue: Number(entry.totalCost),
            });
            await queryRunner.manager.save(stock_ledger_entity_1.StockLedger, stockReversalOut);
            await queryRunner.manager.decrement(item_entity_1.Item, { id: entry.finishedItemId, tenantId }, 'currentStock', Number(entry.assembledQty));
            entry.status = 'CANCELLED';
            await queryRunner.manager.save(production_entry_entity_1.ProductionEntry, entry);
            await queryRunner.commitTransaction();
            return this.getProductionEntryById(tenantId, entry.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getDefaultBranchId(queryRunner, companyId) {
        const branch = await queryRunner.manager.query(`SELECT id FROM branches WHERE company_id = $1 LIMIT 1`, [companyId]);
        return branch && branch.length > 0 ? branch[0].id : null;
    }
};
exports.ManufacturingService = ManufacturingService;
exports.ManufacturingService = ManufacturingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bom_entity_1.BillOfMaterials)),
    __param(1, (0, typeorm_1.InjectRepository)(bom_item_entity_1.BomItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_entry_entity_1.ProductionEntry)),
    __param(3, (0, typeorm_1.InjectRepository)(production_item_entity_1.ProductionItem)),
    __param(4, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __param(5, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ManufacturingService);
//# sourceMappingURL=manufacturing.service.js.map