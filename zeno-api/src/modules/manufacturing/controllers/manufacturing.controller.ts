import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManufacturingService } from '../services/manufacturing.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Manufacturing (BOM & Assembly)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private manufacturingService: ManufacturingService) {}

  // ==========================================
  // BILL OF MATERIALS (BOM)
  // ==========================================

  @Get('boms')
  @ApiOperation({ summary: 'Get all Bills of Materials for company' })
  async getBoms(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.manufacturingService.getBoms(tenantId, companyId);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get BOM by ID with component lines' })
  async getBomById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.manufacturingService.getBomById(tenantId, id);
  }

  @Post('boms')
  @ApiOperation({ summary: 'Create new Bill of Materials recipe' })
  async createBom(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.manufacturingService.createBom(tenantId, body.companyId, body);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update Bill of Materials recipe' })
  async updateBom(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.manufacturingService.updateBom(tenantId, id, body);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete Bill of Materials' })
  async deleteBom(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.manufacturingService.deleteBom(tenantId, id);
  }

  // ==========================================
  // ASSEMBLY & PRODUCTION ENTRIES
  // ==========================================

  @Get('production-entries')
  @ApiOperation({ summary: 'Get all Assembly/Production entries' })
  async getProductionEntries(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.manufacturingService.getProductionEntries(tenantId, companyId);
  }

  @Get('production-entries/:id')
  @ApiOperation({ summary: 'Get Production entry by ID with lines and stock details' })
  async getProductionEntryById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.manufacturingService.getProductionEntryById(tenantId, id);
  }

  @Post('production-entries')
  @ApiOperation({ summary: 'Execute Assembly/Production run (deducts raw materials, creates finished goods)' })
  async createProductionEntry(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.manufacturingService.createProductionEntry(tenantId, body.companyId, body);
  }

  @Put('production-entries/:id/cancel')
  @ApiOperation({ summary: 'Cancel/Reverse assembly run and restore stock atomically' })
  async cancelProductionEntry(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.manufacturingService.cancelProductionEntry(tenantId, id);
  }
}
