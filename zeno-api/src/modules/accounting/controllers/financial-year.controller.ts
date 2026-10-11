import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinancialYearService } from '../services/financial-year.service';

@ApiTags('Financial Years')
@Controller('accounting/financial-years')
export class FinancialYearController {
  constructor(private fyService: FinancialYearService) {}

  @Get()
  @ApiOperation({ summary: 'Get all financial years for company' })
  async getFinancialYears(
    @Query('tenantId') tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    const tid = tenantId || '11111111-1111-1111-1111-111111111111';
    if (!companyId) throw new BadRequestException('companyId query parameter is required');
    return this.fyService.getFinancialYears(tid, companyId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active financial year' })
  async getCurrentFinancialYear(
    @Query('tenantId') tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    const tid = tenantId || '11111111-1111-1111-1111-111111111111';
    if (!companyId) throw new BadRequestException('companyId query parameter is required');
    return this.fyService.getCurrentFinancialYear(tid, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new financial year (requires current active F.Y. to be closed)' })
  async createFinancialYear(
    @Query('tenantId') tenantId: string,
    @Body() body: { companyId: string; name: string; startDate: string; endDate: string },
  ) {
    const tid = tenantId || '11111111-1111-1111-1111-111111111111';
    if (!body.companyId) throw new BadRequestException('companyId is required in body');
    if (!body.name || !body.startDate || !body.endDate) {
      throw new BadRequestException('name, startDate, and endDate are required');
    }
    return this.fyService.createFinancialYear(tid, body.companyId, body);
  }

  @Post('close')
  @ApiOperation({ summary: 'Close open financial year and transfer balance sheet closing balances as opening balances for new year' })
  async closeFinancialYear(
    @Query('tenantId') tenantId: string,
    @Body() body: { companyId: string; fyId?: string; closingNotes?: string },
  ) {
    const tid = tenantId || '11111111-1111-1111-1111-111111111111';
    if (!body.companyId) throw new BadRequestException('companyId is required in body');
    return this.fyService.closeFinancialYearAndTransferBalances(tid, body.companyId, body);
  }

  @Post('switch')
  @ApiOperation({ summary: 'Switch current active financial year' })
  async switchFinancialYear(
    @Query('tenantId') tenantId: string,
    @Body() body: { companyId: string; fyId: string },
  ) {
    const tid = tenantId || '11111111-1111-1111-1111-111111111111';
    if (!body.companyId || !body.fyId) throw new BadRequestException('companyId and fyId are required');
    return this.fyService.setCurrentFinancialYear(tid, body.companyId, body.fyId);
  }
}
