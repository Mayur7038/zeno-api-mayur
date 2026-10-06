import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenancyService } from '../services/tenancy.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Tenancy & Hierarchy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenancy')
export class TenancyController {
  constructor(private tenancyService: TenancyService) {}

  @Get('companies')
  @ApiOperation({ summary: 'Get all companies in the current tenant' })
  async getCompanies(@CurrentTenant() tenantId: string) {
    return this.tenancyService.getCompanies(tenantId);
  }

  @Put('companies/:id')
  @ApiOperation({ summary: 'Update company details & branding' })
  async updateCompany(
    @CurrentTenant() tenantId: string,
    @Param('id') companyId: string,
    @Body() data: any,
  ) {
    return this.tenancyService.updateCompany(tenantId, companyId, data);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get branches for tenant/company' })
  async getBranches(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.tenancyService.getBranches(tenantId, companyId);
  }

  @Post('branches')
  @ApiOperation({ summary: 'Create new branch' })
  async createBranch(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tenancyService.createBranch(tenantId, data);
  }

  @Get('godowns')
  @ApiOperation({ summary: 'Get godowns/warehouses' })
  async getGodowns(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.tenancyService.getGodowns(tenantId, branchId);
  }

  @Post('godowns')
  @ApiOperation({ summary: 'Create new godown / warehouse' })
  async createGodown(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tenancyService.createGodown(tenantId, data);
  }

  @Put('godowns/:id')
  @ApiOperation({ summary: 'Update godown / warehouse' })
  async updateGodown(
    @CurrentTenant() tenantId: string,
    @Param('id') godownId: string,
    @Body() data: any,
  ) {
    return this.tenancyService.updateGodown(tenantId, godownId, data);
  }

  @Delete('godowns/:id')
  @ApiOperation({ summary: 'Delete godown / warehouse' })
  async deleteGodown(
    @CurrentTenant() tenantId: string,
    @Param('id') godownId: string,
  ) {
    return this.tenancyService.deleteGodown(tenantId, godownId);
  }

  @Get('racks-bins')
  @ApiOperation({ summary: 'Get racks & bins for a godown' })
  async getRacksBins(
    @CurrentTenant() tenantId: string,
    @Query('godownId') godownId: string,
  ) {
    return this.tenancyService.getRacksBins(tenantId, godownId);
  }

  @Post('racks-bins')
  @ApiOperation({ summary: 'Create rack/bin in godown' })
  async createRackBin(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tenancyService.createRackBin(tenantId, data);
  }
}
