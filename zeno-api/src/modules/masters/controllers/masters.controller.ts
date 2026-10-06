import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MastersService } from '../services/masters.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Masters (Ledgers, Items, Units)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('masters')
export class MastersController {
  constructor(private mastersService: MastersService) {}

  // Ledger Groups
  @Get('ledger-groups')
  @ApiOperation({ summary: 'Get all ledger groups (Tally hierarchy)' })
  async getLedgerGroups(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.mastersService.getLedgerGroups(tenantId, companyId);
  }

  @Post('ledger-groups')
  @ApiOperation({ summary: 'Create custom ledger group' })
  async createLedgerGroup(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createLedgerGroup(tenantId, body.companyId, body);
  }

  @Put('ledger-groups/:id')
  @ApiOperation({ summary: 'Rename ledger group' })
  async updateLedgerGroup(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateLedgerGroup(tenantId, id, body);
  }

  @Delete('ledger-groups/:id')
  @ApiOperation({ summary: 'Delete custom ledger group' })
  async deleteLedgerGroup(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteLedgerGroup(tenantId, id);
  }

  // Ledgers
  @Get('ledgers')
  @ApiOperation({ summary: 'Get ledgers (optionally filter vendors or customers)' })
  async getLedgers(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('isVendorOnly') isVendorOnly?: string,
    @Query('isCustomerOnly') isCustomerOnly?: string,
  ) {
    return this.mastersService.getLedgers(
      tenantId,
      companyId,
      isVendorOnly === 'true',
      isCustomerOnly === 'true',
    );
  }

  @Post('ledgers')
  @ApiOperation({ summary: 'Create new ledger with GSTIN and address' })
  async createLedger(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createLedger(tenantId, body.companyId, body);
  }

  @Put('ledgers/:id')
  @ApiOperation({ summary: 'Update ledger details' })
  async updateLedger(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateLedger(tenantId, id, body);
  }

  @Delete('ledgers/:id')
  @ApiOperation({ summary: 'Delete custom ledger' })
  async deleteLedger(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteLedger(tenantId, id);
  }

  // Units
  @Get('units')
  @ApiOperation({ summary: 'Get measurement units' })
  async getUnits(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.mastersService.getUnits(tenantId, companyId);
  }

  @Post('units')
  @ApiOperation({ summary: 'Create unit with decimal precision' })
  async createUnit(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createUnit(tenantId, body.companyId, body);
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update measurement unit' })
  async updateUnit(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateUnit(tenantId, id, body);
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Delete measurement unit' })
  async deleteUnit(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteUnit(tenantId, id);
  }

  // Item Groups (Stock Groups) & Categories
  @Get('item-groups')
  @ApiOperation({ summary: 'Get item groups' })
  async getItemGroups(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.mastersService.getItemGroups(tenantId, companyId);
  }

  @Post('item-groups')
  @ApiOperation({ summary: 'Create item group with group-level GST' })
  async createItemGroup(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createItemGroup(tenantId, body.companyId, body);
  }

  @Put('item-groups/:id')
  @ApiOperation({ summary: 'Update item group' })
  async updateItemGroup(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateItemGroup(tenantId, id, body);
  }

  @Delete('item-groups/:id')
  @ApiOperation({ summary: 'Delete item group' })
  async deleteItemGroup(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteItemGroup(tenantId, id);
  }

  @Get('item-categories')
  @ApiOperation({ summary: 'Get item categories' })
  async getItemCategories(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('itemGroupId') itemGroupId?: string,
  ) {
    return this.mastersService.getItemCategories(tenantId, companyId, itemGroupId);
  }

  @Post('item-categories')
  @ApiOperation({ summary: 'Create item category' })
  async createItemCategory(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createItemCategory(tenantId, body.companyId, body);
  }

  @Put('item-categories/:id')
  @ApiOperation({ summary: 'Update item category' })
  async updateItemCategory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateItemCategory(tenantId, id, body);
  }

  @Delete('item-categories/:id')
  @ApiOperation({ summary: 'Delete item category' })
  async deleteItemCategory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteItemCategory(tenantId, id);
  }

  // Item Variants (Variant Master)
  @Get('variants')
  @ApiOperation({ summary: 'Get all item variants' })
  async getVariants(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId?: string,
    @Query('itemId') itemId?: string,
  ) {
    return this.mastersService.getVariants(tenantId, companyId, itemId);
  }

  @Post('variants')
  @ApiOperation({ summary: 'Create item variant' })
  async createVariant(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createVariant(tenantId, body);
  }

  @Put('variants/:id')
  @ApiOperation({ summary: 'Update item variant' })
  async updateVariant(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateVariant(tenantId, id, body);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Delete item variant' })
  async deleteVariant(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.deleteVariant(tenantId, id);
  }

  // Items
  @Get('items')
  @ApiOperation({ summary: 'Get items with unit, category, and variants' })
  async getItems(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('search') search?: string,
  ) {
    return this.mastersService.getItems(tenantId, companyId, search);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get item by ID with tab details' })
  async getItemById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mastersService.getItemById(tenantId, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create item across Basic, Sales/Purchase, Image, Description tabs' })
  async createItem(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.mastersService.createItem(tenantId, body.companyId, body);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update item' })
  async updateItem(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.mastersService.updateItem(tenantId, id, body);
  }
}
