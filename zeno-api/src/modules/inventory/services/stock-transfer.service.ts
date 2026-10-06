import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockTransfer } from '../entities/stock-transfer.entity';
import { StockTransferItem } from '../entities/stock-transfer-item.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { InventoryService } from './inventory.service';

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransfer)
    private transferRepo: Repository<StockTransfer>,
    @InjectRepository(StockTransferItem)
    private transferItemRepo: Repository<StockTransferItem>,
    @InjectRepository(Godown)
    private godownRepo: Repository<Godown>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  async getTransfers(tenantId: string, companyId: string) {
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

  async getTransferById(tenantId: string, id: string) {
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
    if (!transfer) throw new NotFoundException('Stock transfer not found');
    return transfer;
  }

  async createTransfer(tenantId: string, companyId: string, data: any) {
    if (!data.sourceGodownId) throw new BadRequestException('Source warehouse is required');
    if (!data.destinationGodownId) throw new BadRequestException('Destination warehouse is required');
    if (data.sourceGodownId === data.destinationGodownId) {
      throw new BadRequestException('Source and destination warehouses cannot be the same');
    }
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('At least one item line is required for stock transfer');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceGodown = await queryRunner.manager.findOne(Godown, {
        where: { id: data.sourceGodownId },
      });
      const destGodown = await queryRunner.manager.findOne(Godown, {
        where: { id: data.destinationGodownId },
      });
      if (!sourceGodown || !destGodown) {
        throw new BadRequestException('Invalid source or destination warehouse');
      }

      const branchId = data.branchId || sourceGodown.branchId;
      const transferDate = data.transferDate || new Date().toISOString().split('T')[0];
      const year = new Date().getFullYear();
      const count = await this.transferRepo.count({ where: { tenantId, companyId } });
      const voucherNo = data.voucherNo || `ST-${year}-${String(count + 1).padStart(4, '0')}`;

      let totalQty = 0;
      let totalAmount = 0;

      // Validate stock availability in source warehouse
      for (const line of data.items) {
        const qty = Number(line.transferQty || line.qty || 0);
        if (qty <= 0) {
          throw new BadRequestException('Transfer quantity must be greater than zero');
        }

        const currentStock = await this.inventoryService.getCurrentStockBalance(
          queryRunner.manager,
          tenantId,
          companyId,
          data.sourceGodownId,
          line.itemId,
          line.variantId,
        );

        if (currentStock < qty) {
          throw new BadRequestException(
            `Insufficient stock in source warehouse for item! Available: ${currentStock}, Requested: ${qty}`,
          );
        }

        const rate = Number(line.unitRate || 0);
        const amount = Number(line.totalAmount || qty * rate);
        totalQty += qty;
        totalAmount += amount;
      }

      // 1. Create StockTransfer header
      const transfer = queryRunner.manager.create(StockTransfer, {
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

      const savedTransfer = await queryRunner.manager.save(StockTransfer, transfer);

      // 2. Create StockTransferItem lines
      const itemsToSave: StockTransferItem[] = [];
      for (const line of data.items) {
        const qty = Number(line.transferQty || line.qty || 0);
        const rate = Number(line.unitRate || 0);
        const amount = Number(line.totalAmount || qty * rate);

        const item = queryRunner.manager.create(StockTransferItem, {
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
      await queryRunner.manager.save(StockTransferItem, itemsToSave);

      // 3. Post stock movement if COMPLETED
      if (savedTransfer.status === 'COMPLETED') {
        // Source godown: OUT
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

        // Destination godown: IN
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelTransfer(tenantId: string, id: string) {
    const transfer = await this.transferRepo.findOne({ where: { id, tenantId } });
    if (!transfer) throw new NotFoundException('Stock transfer not found');
    if (transfer.status === 'CANCELLED') {
      throw new BadRequestException('Transfer is already cancelled');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (transfer.status === 'COMPLETED') {
        // Reverse both movements
        await this.inventoryService.reverseStockMovement(
          queryRunner.manager,
          'STOCK_TRANSFER',
          transfer.id,
        );
      }

      transfer.status = 'CANCELLED';
      await queryRunner.manager.save(StockTransfer, transfer);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Stock transfer cancelled successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
