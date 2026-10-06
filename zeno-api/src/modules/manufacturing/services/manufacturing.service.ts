import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BillOfMaterials } from '../entities/bom.entity';
import { BomItem } from '../entities/bom-item.entity';
import { ProductionEntry } from '../entities/production-entry.entity';
import { ProductionItem } from '../entities/production-item.entity';
import { StockLedger } from '../../inventory/entities/stock-ledger.entity';
import { Item } from '../../masters/entities/item.entity';

@Injectable()
export class ManufacturingService {
  constructor(
    @InjectRepository(BillOfMaterials)
    private bomRepo: Repository<BillOfMaterials>,
    @InjectRepository(BomItem)
    private bomItemRepo: Repository<BomItem>,
    @InjectRepository(ProductionEntry)
    private productionRepo: Repository<ProductionEntry>,
    @InjectRepository(ProductionItem)
    private productionItemRepo: Repository<ProductionItem>,
    @InjectRepository(StockLedger)
    private stockLedgerRepo: Repository<StockLedger>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    private dataSource: DataSource,
  ) {}

  // ==========================================
  // 1. BILL OF MATERIALS (BOM)
  // ==========================================

  async getBoms(tenantId: string, companyId: string) {
    return this.bomRepo.find({
      where: { tenantId, companyId },
      relations: ['finishedItem', 'finishedVariant', 'items', 'items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBomById(tenantId: string, id: string) {
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
    if (!bom) throw new NotFoundException('Bill of Materials not found');
    return bom;
  }

  async createBom(tenantId: string, companyId: string, data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const year = new Date().getFullYear();
      const count = await this.bomRepo.count({ where: { tenantId, companyId } });
      const bomNo = data.bomNo || `BOM-${year}-${String(count + 1).padStart(4, '0')}`;

      // Calculate totals
      let rawMaterialCost = 0;
      const itemsData: any[] = data.items || [];
      for (const it of itemsData) {
        const qty = Number(it.consumedQty) || 0;
        const rate = Number(it.unitRate) || 0;
        const lineTotal = Number(it.totalAmount) || qty * rate;
        rawMaterialCost += lineTotal;
      }

      const laborCost = Number(data.estimatedLaborCost) || 0;
      const overheadCost = Number(data.estimatedOverheadCost) || 0;
      const totalCost = rawMaterialCost + laborCost + overheadCost;

      const bom = queryRunner.manager.create(BillOfMaterials, {
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

      const savedBom = await queryRunner.manager.save(BillOfMaterials, bom);

      // Save Bom Items
      for (const it of itemsData) {
        const qty = Number(it.consumedQty) || 0;
        const rate = Number(it.unitRate) || 0;
        const lineTotal = Number(it.totalAmount) || qty * rate;

        const bomItem = queryRunner.manager.create(BomItem, {
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
        await queryRunner.manager.save(BomItem, bomItem);
      }

      await queryRunner.commitTransaction();
      return this.getBomById(tenantId, savedBom.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateBom(tenantId: string, id: string, data: any) {
    const existing = await this.bomRepo.findOne({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('BOM not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let rawMaterialCost = 0;
      const itemsData: any[] = data.items || [];
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

      await queryRunner.manager.save(BillOfMaterials, existing);

      // Replace items
      await queryRunner.manager.delete(BomItem, { bomId: existing.id, tenantId });
      for (const it of itemsData) {
        const qty = Number(it.consumedQty) || 0;
        const rate = Number(it.unitRate) || 0;
        const lineTotal = Number(it.totalAmount) || qty * rate;

        const bomItem = queryRunner.manager.create(BomItem, {
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
        await queryRunner.manager.save(BomItem, bomItem);
      }

      await queryRunner.commitTransaction();
      return this.getBomById(tenantId, existing.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteBom(tenantId: string, id: string) {
    const bom = await this.bomRepo.findOne({ where: { id, tenantId } });
    if (!bom) throw new NotFoundException('BOM not found');

    const linkedCount = await this.productionRepo.count({ where: { bomId: id, tenantId } });
    if (linkedCount > 0) {
      throw new BadRequestException('Cannot delete BOM linked to existing production entries. Deactivate it instead.');
    }

    await this.bomRepo.delete({ id, tenantId });
    return { success: true, message: 'BOM deleted successfully' };
  }

  // ==========================================
  // 2. ASSEMBLY / PRODUCTION ENTRIES
  // ==========================================

  async getProductionEntries(tenantId: string, companyId: string) {
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

  async getProductionEntryById(tenantId: string, id: string) {
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
    if (!entry) throw new NotFoundException('Production entry not found');
    return entry;
  }

  async createProductionEntry(tenantId: string, companyId: string, data: any) {
    if (!data.finishedItemId) throw new BadRequestException('Finished product is required');
    if (!data.sourceGodownId) throw new BadRequestException('Source raw material warehouse is required');
    if (!data.targetGodownId) throw new BadRequestException('Target finished goods warehouse is required');
    if (!data.assembledQty || Number(data.assembledQty) <= 0) {
      throw new BadRequestException('Assembled quantity must be greater than zero');
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
      const itemsData: any[] = data.items || [];
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

      // 1. Create Production Header
      const entry = queryRunner.manager.create(ProductionEntry, {
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

      const savedEntry = await queryRunner.manager.save(ProductionEntry, entry);

      // 2. Create Items & Deduct Raw Materials from Source Godown
      for (const it of itemsData) {
        const qty = Number(it.consumedQty) || 0;
        const rate = Number(it.unitRate) || 0;
        const lineTotal = Number(it.amount) || qty * rate;

        const prodItem = queryRunner.manager.create(ProductionItem, {
          tenantId,
          productionEntryId: savedEntry.id,
          itemId: it.itemId,
          variantId: it.variantId || null,
          consumedQty: qty,
          unitRate: rate,
          amount: lineTotal,
          notes: it.notes || null,
        });
        await queryRunner.manager.save(ProductionItem, prodItem);

        // Stock OUT Ledger Entry for component
        const stockOut = queryRunner.manager.create(StockLedger, {
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
        await queryRunner.manager.save(StockLedger, stockOut);

        // Atomically decrement item current stock
        await queryRunner.manager.decrement(Item, { id: it.itemId, tenantId }, 'currentStock', qty);
      }

      // 3. Stock IN Ledger Entry for Finished Good to Target Godown
      const stockIn = queryRunner.manager.create(StockLedger, {
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
      await queryRunner.manager.save(StockLedger, stockIn);

      // Atomically increment finished item current stock
      await queryRunner.manager.increment(Item, { id: data.finishedItemId, tenantId }, 'currentStock', assembledQty);

      await queryRunner.commitTransaction();
      return this.getProductionEntryById(tenantId, savedEntry.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelProductionEntry(tenantId: string, id: string) {
    const entry = await this.productionRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!entry) throw new NotFoundException('Production entry not found');
    if (entry.status === 'CANCELLED') {
      throw new BadRequestException('Production entry is already cancelled');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date().toISOString().split('T')[0];

      // Reversal: Stock IN consumed components back to source godown
      for (const it of entry.items) {
        const stockReversalIn = queryRunner.manager.create(StockLedger, {
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
        await queryRunner.manager.save(StockLedger, stockReversalIn);

        // Restore item current stock
        await queryRunner.manager.increment(Item, { id: it.itemId, tenantId }, 'currentStock', Number(it.consumedQty));
      }

      // Reversal: Stock OUT finished good from target godown
      const stockReversalOut = queryRunner.manager.create(StockLedger, {
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
      await queryRunner.manager.save(StockLedger, stockReversalOut);

      // Decrement finished item current stock
      await queryRunner.manager.decrement(Item, { id: entry.finishedItemId, tenantId }, 'currentStock', Number(entry.assembledQty));

      entry.status = 'CANCELLED';
      await queryRunner.manager.save(ProductionEntry, entry);

      await queryRunner.commitTransaction();
      return this.getProductionEntryById(tenantId, entry.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async getDefaultBranchId(queryRunner: any, companyId: string): Promise<string> {
    const branch = await queryRunner.manager.query(
      `SELECT id FROM branches WHERE company_id = $1 LIMIT 1`,
      [companyId],
    );
    return branch && branch.length > 0 ? branch[0].id : null;
  }
}
