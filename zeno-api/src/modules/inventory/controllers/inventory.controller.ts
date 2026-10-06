import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Inventory & Stock Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    @InjectRepository(StockLedger)
    private stockRepo: Repository<StockLedger>,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get stock summary report with available quantity and valuation' })
  async getStockSummary(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('godownId') godownId?: string,
  ) {
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

  @Get('item-balance')
  @ApiOperation({ summary: 'Check real-time stock balance for a specific item in godown' })
  async getItemBalance(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('godownId') godownId: string,
    @Query('itemId') itemId: string,
    @Query('variantId') variantId?: string,
  ) {
    const balance = await this.inventoryService.getCurrentStockBalance(
      this.stockRepo.manager,
      tenantId,
      companyId,
      godownId,
      itemId,
      variantId,
    );
    return {
      itemId,
      godownId,
      variantId: variantId || null,
      currentBalance: balance,
    };
  }
}
