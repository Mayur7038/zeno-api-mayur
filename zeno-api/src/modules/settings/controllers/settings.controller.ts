import { Controller, Get, Put, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { FeatureKey } from '../../../common/enums';

@ApiTags('Settings & Feature Toggles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get company settings, GST level, and default ledger mappings' })
  async getSettings(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.settingsService.getSettings(tenantId, companyId);
  }

  @Put()
  @ApiOperation({ summary: 'Update company settings, GST active level, or ledger mappings' })
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Body() body: any,
  ) {
    return this.settingsService.updateSettings(tenantId, companyId, body);
  }

  @Get('toggles')
  @ApiOperation({ summary: 'Get all feature toggles for company' })
  async getToggles(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.settingsService.getFeatureToggles(tenantId, companyId);
  }

  @Post('toggles')
  @ApiOperation({ summary: 'Enable or disable a feature module' })
  async setToggle(
    @CurrentTenant() tenantId: string,
    @Body() body: { companyId: string; featureKey: FeatureKey; isEnabled: boolean },
  ) {
    return this.settingsService.setFeatureToggle(
      tenantId,
      body.companyId,
      body.featureKey,
      body.isEnabled,
    );
  }

  @Get('tax-masters')
  @ApiOperation({ summary: 'Get all tax slabs' })
  async getTaxMasters(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.settingsService.getTaxMasters(tenantId, companyId);
  }

  @Post('tax-masters')
  @ApiOperation({ summary: 'Create tax slab master' })
  async createTaxMaster(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.settingsService.createTaxMaster(tenantId, body.companyId, body);
  }
}
