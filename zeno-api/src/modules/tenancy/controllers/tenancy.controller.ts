import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Create new godown' })
  async createGodown(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tenancyService.createGodown(tenantId, data);
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
