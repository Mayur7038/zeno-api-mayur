"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
let InventoryService = class InventoryService {
    async recordStockMovement(manager, params) {
        const { tenantId, companyId, branchId, entryDate, voucherType, voucherId, voucherNo, lines, } = params;
        const stockEntries = [];
        for (const line of lines) {
            const qtyIn = Number(line.qtyIn || 0);
            const qtyOut = Number(line.qtyOut || 0);
            if (qtyIn <= 0 && qtyOut <= 0) {
                continue;
            }
            if (qtyOut > 0) {
                const currentBalance = await this.getCurrentStockBalance(manager, tenantId, companyId, line.godownId, line.itemId, line.variantId);
                if (currentBalance < qtyOut) {
                    throw new common_1.BadRequestException(`Insufficient stock for item! Available: ${currentBalance}, Requested Out: ${qtyOut}`);
                }
            }
            const totalValue = qtyIn > 0
                ? Number((qtyIn * line.unitRate).toFixed(2))
                : Number((qtyOut * line.unitRate).toFixed(2));
            const entry = manager.create(stock_ledger_entity_1.StockLedger, {
                tenantId,
                companyId,
                branchId,
                godownId: line.godownId,
                rackBinId: line.rackBinId || null,
                itemId: line.itemId,
                variantId: line.variantId || null,
                entryDate,
                voucherType,
                voucherId,
                voucherNo,
                qtyIn,
                qtyOut,
                unitRate: line.unitRate,
                totalValue,
            });
            stockEntries.push(entry);
        }
        return await manager.save(stock_ledger_entity_1.StockLedger, stockEntries);
    }
    async reverseStockMovement(manager, voucherType, voucherId) {
        const originalEntries = await manager.find(stock_ledger_entity_1.StockLedger, {
            where: { voucherType, voucherId },
        });
        if (!originalEntries || originalEntries.length === 0) {
            return;
        }
        const reversalEntries = originalEntries.map((orig) => {
            return manager.create(stock_ledger_entity_1.StockLedger, {
                tenantId: orig.tenantId,
                companyId: orig.companyId,
                branchId: orig.branchId,
                godownId: orig.godownId,
                rackBinId: orig.rackBinId,
                itemId: orig.itemId,
                variantId: orig.variantId,
                entryDate: new Date().toISOString().split('T')[0],
                voucherType: `${orig.voucherType}_REVERSAL`,
                voucherId: orig.voucherId,
                voucherNo: orig.voucherNo,
                qtyIn: orig.qtyOut,
                qtyOut: orig.qtyIn,
                unitRate: orig.unitRate,
                totalValue: orig.totalValue,
            });
        });
        await manager.save(stock_ledger_entity_1.StockLedger, reversalEntries);
    }
    async getCurrentStockBalance(manager, tenantId, companyId, godownId, itemId, variantId) {
        const qb = manager
            .createQueryBuilder(stock_ledger_entity_1.StockLedger, 'sl')
            .select('COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0)', 'balance')
            .where('sl.tenant_id = :tenantId', { tenantId })
            .andWhere('sl.company_id = :companyId', { companyId })
            .andWhere('sl.godown_id = :godownId', { godownId })
            .andWhere('sl.item_id = :itemId', { itemId });
        if (variantId) {
            qb.andWhere('sl.variant_id = :variantId', { variantId });
        }
        const res = await qb.getRawOne();
        return Number(res?.balance || 0);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map