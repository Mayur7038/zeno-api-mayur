import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';

export interface StockMovementLine {
  godownId: string;
  rackBinId?: string;
  itemId: string;
  variantId?: string;
  qtyIn?: number;
  qtyOut?: number;
  unitRate: number;
}

export interface PostStockParams {
  tenantId: string;
  companyId: string;
  branchId: string;
  entryDate: string;
  voucherType: string;
  voucherId: string;
  voucherNo: string;
  lines: StockMovementLine[];
}

@Injectable()
export class InventoryService {
  /**
   * Posts inventory movement into the append-only stock ledger.
   * If stock goes negative on qtyOut, validation ensures safety.
   */
  async recordStockMovement(
    manager: EntityManager,
    params: PostStockParams,
  ): Promise<StockLedger[]> {
    const {
      tenantId,
      companyId,
      branchId,
      entryDate,
      voucherType,
      voucherId,
      voucherNo,
      lines,
    } = params;

    const stockEntries: StockLedger[] = [];

    for (const line of lines) {
      const qtyIn = Number(line.qtyIn || 0);
      const qtyOut = Number(line.qtyOut || 0);

      if (qtyIn <= 0 && qtyOut <= 0) {
        continue;
      }

      // Check current stock if qtyOut > 0 to prevent negative stock
      if (qtyOut > 0) {
        const currentBalance = await this.getCurrentStockBalance(
          manager,
          tenantId,
          companyId,
          line.godownId,
          line.itemId,
          line.variantId,
        );

        if (currentBalance < qtyOut) {
          throw new BadRequestException(
            `Insufficient stock for item! Available: ${currentBalance}, Requested Out: ${qtyOut}`,
          );
        }
      }

      const totalValue =
        qtyIn > 0
          ? Number((qtyIn * line.unitRate).toFixed(2))
          : Number((qtyOut * line.unitRate).toFixed(2));

      const entry = manager.create(StockLedger, {
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

    return await manager.save(StockLedger, stockEntries);
  }

  /**
   * Reverses an existing stock entry
   */
  async reverseStockMovement(
    manager: EntityManager,
    voucherType: string,
    voucherId: string,
  ): Promise<void> {
    const originalEntries = await manager.find(StockLedger, {
      where: { voucherType, voucherId },
    });

    if (!originalEntries || originalEntries.length === 0) {
      return;
    }

    const reversalEntries = originalEntries.map((orig) => {
      return manager.create(StockLedger, {
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
        qtyIn: orig.qtyOut, // Inverted
        qtyOut: orig.qtyIn, // Inverted
        unitRate: orig.unitRate,
        totalValue: orig.totalValue,
      });
    });

    await manager.save(StockLedger, reversalEntries);
  }

  /**
   * Calculates live current stock balance
   */
  async getCurrentStockBalance(
    manager: EntityManager,
    tenantId: string,
    companyId: string,
    godownId: string,
    itemId: string,
    variantId?: string,
  ): Promise<number> {
    const qb = manager
      .createQueryBuilder(StockLedger, 'sl')
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

  /**
   * Retrieves opening stock balances for all active items in a godown
   */
  async getOpeningBalances(
    manager: EntityManager,
    tenantId: string,
    companyId: string,
    godownId: string,
  ) {
    const items = await manager
      .createQueryBuilder('Item', 'item')
      .leftJoinAndSelect('item.itemGroup', 'ig')
      .leftJoinAndSelect('item.unit', 'unit')
      .where('item.tenant_id = :tenantId', { tenantId })
      .andWhere('item.company_id = :companyId', { companyId })
      .andWhere('item.is_active = true')
      .orderBy('item.name', 'ASC')
      .getMany() as any[];

    const openingEntries = await manager.find(StockLedger, {
      where: {
        tenantId,
        companyId,
        godownId,
        voucherType: 'OPENING_STOCK',
      },
    });

    const entryMap = new Map<string, StockLedger>();
    for (const e of openingEntries) {
      entryMap.set(e.itemId, e);
    }

    return items.map((it) => {
      const entry = entryMap.get(it.id);
      const openingQty = entry ? Number(entry.qtyIn) : 0;
      const unitRate = entry
        ? Number(entry.unitRate)
        : Number(it.purchaseRate || 0);
      const totalValue = entry
        ? Number(entry.totalValue)
        : Number((openingQty * unitRate).toFixed(2));

      return {
        itemId: it.id,
        itemName: it.name,
        sku: it.sku || '',
        itemGroupId: it.itemGroupId || null,
        itemGroupName: it.itemGroup?.name || 'General',
        unitCode: it.unit?.code || 'NOS',
        standardPurchaseRate: Number(it.purchaseRate || 0),
        standardSaleRate: Number(it.saleRate || 0),
        openingQty,
        unitRate,
        totalValue,
        effectiveDate: entry?.entryDate || new Date().toISOString().split('T')[0],
        ledgerId: entry?.id || null,
      };
    });
  }

  /**
   * Updates or inserts opening balances for items in a warehouse
   */
  async updateOpeningBalances(
    manager: EntityManager,
    tenantId: string,
    companyId: string,
    data: {
      godownId: string;
      branchId?: string;
      effectiveDate: string;
      items: Array<{
        itemId: string;
        variantId?: string;
        openingQty: number;
        unitRate: number;
      }>;
    },
  ) {
    const { godownId, effectiveDate, items } = data;
    if (!godownId) throw new BadRequestException('Warehouse is required');
    if (!effectiveDate) throw new BadRequestException('Effective date is required');

    let branchId = data.branchId;
    if (!branchId) {
      const godownRes: any = await manager
        .createQueryBuilder('Godown', 'g')
        .where('g.id = :godownId', { godownId })
        .getOne();
      branchId = godownRes?.branchId;
    }

    if (!branchId) throw new BadRequestException('Branch could not be determined for godown');

    const entriesToSave: StockLedger[] = [];
    const entriesToDelete: StockLedger[] = [];

    for (const it of items) {
      const qty = Number(it.openingQty || 0);
      const rate = Number(it.unitRate || 0);

      const existing = await manager.findOne(StockLedger, {
        where: {
          tenantId,
          companyId,
          godownId,
          itemId: it.itemId,
          voucherType: 'OPENING_STOCK',
        },
      });

      if (qty <= 0) {
        if (existing) {
          entriesToDelete.push(existing);
        }
        continue;
      }

      const totalValue = Number((qty * rate).toFixed(2));

      if (existing) {
        existing.entryDate = effectiveDate;
        existing.qtyIn = qty;
        existing.qtyOut = 0;
        existing.unitRate = rate;
        existing.totalValue = totalValue;
        entriesToSave.push(existing);
      } else {
        const newEntry = manager.create(StockLedger, {
          tenantId,
          companyId,
          branchId,
          godownId,
          itemId: it.itemId,
          variantId: it.variantId || null,
          entryDate: effectiveDate,
          voucherType: 'OPENING_STOCK',
          voucherId: it.itemId,
          voucherNo: 'OPN-INIT',
          qtyIn: qty,
          qtyOut: 0,
          unitRate: rate,
          totalValue,
        });
        entriesToSave.push(newEntry);
      }
    }

    if (entriesToDelete.length > 0) {
      await manager.remove(StockLedger, entriesToDelete);
    }

    if (entriesToSave.length > 0) {
      await manager.save(StockLedger, entriesToSave);
    }

    return this.getOpeningBalances(manager, tenantId, companyId, godownId);
  }
}

