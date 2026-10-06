import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { StockAdjustmentItem } from '../entities/stock-adjustment-item.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { InventoryService } from './inventory.service';

@Injectable()
export class StockAdjustmentService {
  constructor(
    @InjectRepository(StockAdjustment)
    private adjustmentRepo: Repository<StockAdjustment>,
    @InjectRepository(StockAdjustmentItem)
    private adjustmentItemRepo: Repository<StockAdjustmentItem>,
    @InjectRepository(Godown)
    private godownRepo: Repository<Godown>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  async getAdjustments(tenantId: string, companyId: string) {
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

  async getAdjustmentById(tenantId: string, id: string) {
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
    if (!adjustment) throw new NotFoundException('Stock adjustment not found');
    return adjustment;
  }

  async createAdjustment(tenantId: string, companyId: string, data: any) {
    if (!data.godownId) throw new BadRequestException('Warehouse is required');
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('At least one item line is required for adjustment');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const godown = await queryRunner.manager.findOne(Godown, {
        where: { id: data.godownId },
      });
      if (!godown) throw new BadRequestException('Warehouse not found');

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
          throw new BadRequestException('Adjustment quantity must be greater than zero');
        }

        const type = (line.adjustmentType || 'INCREASE').toUpperCase();
        if (type === 'DECREASE') {
          const currentStock = await this.inventoryService.getCurrentStockBalance(
            queryRunner.manager,
            tenantId,
            companyId,
            data.godownId,
            line.itemId,
            line.variantId,
          );
          if (currentStock < qty) {
            throw new BadRequestException(
              `Insufficient stock to decrease item! Available: ${currentStock}, Requested: ${qty}`,
            );
          }
        }

        const rate = Number(line.unitRate || 0);
        const amount = Number(line.totalAmount || qty * rate);
        totalQty += qty;
        totalAmount += amount;
      }

      // 1. Create StockAdjustment header
      const adjustment = queryRunner.manager.create(StockAdjustment, {
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

      const savedAdjustment = await queryRunner.manager.save(StockAdjustment, adjustment);

      // 2. Create items
      const itemsToSave: StockAdjustmentItem[] = [];
      for (const line of data.items) {
        const qty = Number(line.qty || 0);
        const rate = Number(line.unitRate || 0);
        const amount = Number(line.totalAmount || qty * rate);

        const item = queryRunner.manager.create(StockAdjustmentItem, {
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
      await queryRunner.manager.save(StockAdjustmentItem, itemsToSave);

      // 3. Post to stock ledger if COMPLETED
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelAdjustment(tenantId: string, id: string) {
    const adjustment = await this.adjustmentRepo.findOne({ where: { id, tenantId } });
    if (!adjustment) throw new NotFoundException('Stock adjustment not found');
    if (adjustment.status === 'CANCELLED') {
      throw new BadRequestException('Adjustment is already cancelled');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (adjustment.status === 'COMPLETED') {
        await this.inventoryService.reverseStockMovement(
          queryRunner.manager,
          'STOCK_ADJUSTMENT',
          adjustment.id,
        );
      }

      adjustment.status = 'CANCELLED';
      await queryRunner.manager.save(StockAdjustment, adjustment);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Stock adjustment cancelled successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
