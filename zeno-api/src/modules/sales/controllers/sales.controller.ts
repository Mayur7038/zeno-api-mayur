import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import {
  SalesOrderStatus,
  DeliveryChallanStatus,
  SalesInvoiceStatus,
} from '../../../common/enums';

@ApiTags('Order-to-Cash (Sales & Billing)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  // 1. Sales Orders
  @Get('sales-orders')
  @ApiOperation({ summary: 'List sales orders with status/search filters' })
  async getSalesOrders(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: SalesOrderStatus,
    @Query('search') search?: string,
  ) {
    return this.salesService.getSalesOrders(tenantId, companyId, { status, search });
  }

  @Get('sales-orders/:id')
  @ApiOperation({ summary: 'Get sales order details with line items' })
  async getSalesOrderById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.getSalesOrderById(tenantId, id);
  }

  @Get('customer/:customerId/pending-orders')
  @ApiOperation({ summary: 'Get pending sales orders for customer' })
  async getCustomerPendingSalesOrders(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.salesService.getCustomerPendingSalesOrders(tenantId, companyId, customerId);
  }

  @Post('sales-orders')
  @ApiOperation({ summary: 'Create new sales order' })
  async createSalesOrder(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.salesService.createSalesOrder(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  @Put('sales-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel un-dispatched sales order' })
  async cancelSalesOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.cancelSalesOrder(tenantId, id);
  }

  // 2. Delivery Challans
  @Get('delivery-challans')
  @ApiOperation({ summary: 'List delivery challans' })
  async getDeliveryChallans(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: DeliveryChallanStatus,
    @Query('search') search?: string,
  ) {
    return this.salesService.getDeliveryChallans(tenantId, companyId, { status, search });
  }

  @Get('delivery-challans/:id')
  @ApiOperation({ summary: 'Get delivery challan details' })
  async getDeliveryChallanById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.getDeliveryChallanById(tenantId, id);
  }

  @Get('customer/:customerId/pending-challans')
  @ApiOperation({ summary: 'Get pending delivery challans for customer billing' })
  async getCustomerPendingChallans(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.salesService.getCustomerPendingChallans(tenantId, companyId, customerId);
  }

  @Post('delivery-challans')
  @ApiOperation({ summary: 'Create delivery challan with atomic Stock OUT' })
  async createDeliveryChallan(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.salesService.createDeliveryChallan(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 3. Sales Invoices
  @Get('sales-invoices')
  @ApiOperation({ summary: 'List sales tax invoices' })
  async getSalesInvoices(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: SalesInvoiceStatus,
    @Query('search') search?: string,
  ) {
    return this.salesService.getSalesInvoices(tenantId, companyId, { status, search });
  }

  @Get('sales-invoices/:id')
  @ApiOperation({ summary: 'Get sales invoice details' })
  async getSalesInvoiceById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.getSalesInvoiceById(tenantId, id);
  }

  @Get('customer/:customerId/pending-invoices')
  @ApiOperation({ summary: 'Get unpaid/pending sales invoices for customer receipt allocation' })
  async getCustomerPendingInvoices(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.salesService.getCustomerPendingInvoices(tenantId, companyId, customerId);
  }

  @Post('sales-invoices')
  @ApiOperation({ summary: 'Generate sales tax invoice with balanced double-entry revenue posting' })
  async createSalesInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.salesService.createSalesInvoice(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 4. Sales Returns
  @Get('sales-returns')
  @ApiOperation({ summary: 'List sales returns / credit notes' })
  async getSalesReturns(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.salesService.getSalesReturns(tenantId, companyId);
  }

  @Post('sales-returns')
  @ApiOperation({ summary: 'Create sales return with Stock IN and accounting credit reversal' })
  async createSalesReturn(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.salesService.createSalesReturn(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 5. Customer Receipts
  @Get('customer-receipts')
  @ApiOperation({ summary: 'List customer receipt vouchers' })
  async getCustomerReceipts(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.salesService.getCustomerReceipts(tenantId, companyId);
  }

  @Post('customer-receipts')
  @ApiOperation({ summary: 'Post customer payment receipt with invoice allocation and Dr Bank/Cash Cr Customer' })
  async createCustomerReceipt(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.salesService.createCustomerReceipt(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }
}
