import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
import { InventoryService } from '../services/inventory.service';
import { StockTransferService } from '../services/stock-transfer.service';
import { StockAdjustmentService } from '../services/stock-adjustment.service';
import { PriceListService } from '../services/price-list.service';
import { PricingDimension } from '../entities/price-list.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Inventory Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private transferService: StockTransferService,
    private adjustmentService: StockAdjustmentService,
    private priceListService: PriceListService,
    @InjectRepository(StockLedger)
    private stockRepo: Repository<StockLedger>,
  ) {}

  // =========================================================================
  // 1. STOCK SUMMARY & BALANCE
  // =========================================================================

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

  @Get('item-statement')
  @ApiOperation({ summary: 'Get chronological stock ledger entries for a specific item' })
  async getItemStatement(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('itemId') itemId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const qb = this.stockRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.godown', 'godown')
      .leftJoinAndSelect('s.variant', 'variant')
      .where('s.tenant_id = :tenantId', { tenantId })
      .andWhere('s.company_id = :companyId', { companyId })
      .andWhere('s.item_id = :itemId', { itemId })
      .orderBy('s.entry_date', 'ASC')
      .addOrderBy('s.created_at', 'ASC');

    if (startDate) qb.andWhere('s.entry_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('s.entry_date <= :endDate', { endDate });

    const entries = await qb.getMany();

    let runningQty = 0;
    let runningVal = 0;
    let totalInQty = 0;
    let totalOutQty = 0;
    
    const processedEntries = entries.map(e => {
      const qIn = Number(e.qtyIn || 0);
      const qOut = Number(e.qtyOut || 0);
      const v = Number(e.totalValue || 0);
      
      runningQty += (qIn - qOut);
      if (qIn > 0) {
        runningVal += v;
        totalInQty += qIn;
      } else if (qOut > 0) {
        runningVal -= v;
        totalOutQty += qOut;
      }

      return {
        id: e.id,
        entryDate: e.entryDate,
        voucherType: e.voucherType,
        voucherNo: e.voucherNo,
        qtyIn: qIn,
        qtyOut: qOut,
        unitRate: Number(e.unitRate || 0),
        totalValue: v,
        runningQty: Number(runningQty.toFixed(3)),
        godownName: e.godown ? e.godown.name : '',
      };
    });

    return {
      itemId,
      entries: processedEntries,
      totalInQty: Number(totalInQty.toFixed(3)),
      totalOutQty: Number(totalOutQty.toFixed(3)),
      closingQty: Number(runningQty.toFixed(3)),
      closingValue: Number(runningVal.toFixed(2)),
    };
  }

  // =========================================================================
  // 2. OPENING BALANCE MANAGEMENT
  // =========================================================================

  @Get('opening-balance')
  @ApiOperation({ summary: 'Get opening stock balances for items in a warehouse' })
  async getOpeningBalances(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('godownId') godownId: string,
  ) {
    if (!godownId) throw new BadRequestException('Warehouse ID is required');
    return this.inventoryService.getOpeningBalances(
      this.stockRepo.manager,
      tenantId,
      companyId,
      godownId,
    );
  }

  @Post('opening-balance')
  @ApiOperation({ summary: 'Set or update opening stock balances for items in a warehouse' })
  async updateOpeningBalances(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.inventoryService.updateOpeningBalances(
      this.stockRepo.manager,
      tenantId,
      body.companyId,
      body,
    );
  }

  // =========================================================================
  // 3. STOCK TRANSFER
  // =========================================================================

  @Get('transfers')
  @ApiOperation({ summary: 'List all stock transfer vouchers' })
  async getTransfers(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.transferService.getTransfers(tenantId, companyId);
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Get stock transfer details by ID' })
  async getTransferById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.transferService.getTransferById(tenantId, id);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create and complete warehouse-to-warehouse stock transfer' })
  async createTransfer(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.transferService.createTransfer(tenantId, body.companyId, body);
  }

  @Put('transfers/:id/cancel')
  @ApiOperation({ summary: 'Cancel stock transfer and reverse ledger movement' })
  async cancelTransfer(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.transferService.cancelTransfer(tenantId, id);
  }

  // =========================================================================
  // 4. STOCK ADJUSTMENT
  // =========================================================================

  @Get('adjustments')
  @ApiOperation({ summary: 'List all stock adjustment vouchers' })
  async getAdjustments(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.adjustmentService.getAdjustments(tenantId, companyId);
  }

  @Get('adjustments/:id')
  @ApiOperation({ summary: 'Get stock adjustment details by ID' })
  async getAdjustmentById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.adjustmentService.getAdjustmentById(tenantId, id);
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Create and post manual stock adjustment (increase / decrease)' })
  async createAdjustment(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.adjustmentService.createAdjustment(tenantId, body.companyId, body);
  }

  @Put('adjustments/:id/cancel')
  @ApiOperation({ summary: 'Cancel stock adjustment and reverse ledger movement' })
  async cancelAdjustment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.adjustmentService.cancelAdjustment(tenantId, id);
  }

  // =========================================================================
  // 5. PRICE LISTS (STOCK GROUP WISE, CUSTOMER WISE, PRODUCT WISE)
  // =========================================================================

  @Get('price-lists')
  @ApiOperation({ summary: 'Get price lists filtered by type, customer, or group' })
  async getPriceLists(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('pricingType') pricingType?: PricingDimension,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.priceListService.getPriceLists(tenantId, companyId, {
      pricingType,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get('price-lists/effective-price')
  @ApiOperation({ summary: 'Resolve effective selling price for an item based on customer & group rules' })
  async getEffectivePrice(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('itemId') itemId: string,
    @Query('customerId') customerId?: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    if (!itemId) throw new BadRequestException('Item ID is required');
    return this.priceListService.getEffectivePrice(
      tenantId,
      companyId,
      itemId,
      customerId,
      asOfDate,
    );
  }

  @Get('price-lists/:id')
  @ApiOperation({ summary: 'Get price list by ID' })
  async getPriceListById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.priceListService.getPriceListById(tenantId, id);
  }

  @Post('price-lists')
  @ApiOperation({ summary: 'Create new price list rule with effective dates' })
  async createPriceList(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.priceListService.createPriceList(tenantId, body.companyId, body);
  }

  @Put('price-lists/:id')
  @ApiOperation({ summary: 'Update price list rule' })
  async updatePriceList(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.priceListService.updatePriceList(tenantId, id, body);
  }

  @Delete('price-lists/:id')
  @ApiOperation({ summary: 'Delete price list rule' })
  async deletePriceList(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.priceListService.deletePriceList(tenantId, id);
  }
}
