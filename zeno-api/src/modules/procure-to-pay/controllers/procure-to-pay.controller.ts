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
import { ProcureToPayService } from '../services/procure-to-pay.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { GrnStatus, PurchaseInvoiceStatus, PurchaseOrderStatus } from '../../../common/enums';

@ApiTags('Procure-to-Pay (PO, GRN, Purchase Invoice, Return, Payment)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('procure-to-pay')
export class ProcureToPayController {
  constructor(private p2pService: ProcureToPayService) {}

  // 1. Purchase Orders
  @Get('purchase-orders')
  @ApiOperation({ summary: 'List purchase orders with status filtering & search' })
  async getPurchaseOrders(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('search') search?: string,
  ) {
    return this.p2pService.getPurchaseOrders(tenantId, companyId, { status, search });
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Get purchase order details' })
  async getPurchaseOrderById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.p2pService.getPurchaseOrderById(tenantId, id);
  }

  @Get('vendor/:vendorId/pending-orders')
  @ApiOperation({ summary: 'Get pending POs for a vendor (auto-pulled into GRN modal)' })
  async getVendorPendingOrders(
    @CurrentTenant() tenantId: string,
    @Param('vendorId') vendorId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.p2pService.getVendorPendingPurchaseOrders(tenantId, companyId, vendorId);
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create purchase order' })
  async createPurchaseOrder(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.p2pService.createPurchaseOrder(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  @Put('purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel purchase order (enforces no linked GRN)' })
  async cancelPurchaseOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.p2pService.cancelPurchaseOrder(tenantId, id);
  }

  // 2. Goods Receipt Notes (GRN)
  @Get('goods-receipt-notes')
  @ApiOperation({ summary: 'List GRNs with status filtering' })
  async getGoodsReceiptNotes(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: GrnStatus,
    @Query('search') search?: string,
  ) {
    return this.p2pService.getGoodsReceiptNotes(tenantId, companyId, { status, search });
  }

  @Get('goods-receipt-notes/:id')
  @ApiOperation({ summary: 'Get GRN details with line items and stock location' })
  async getGoodsReceiptNoteById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.p2pService.getGoodsReceiptNoteById(tenantId, id);
  }

  @Get('vendor/:vendorId/pending-grns')
  @ApiOperation({ summary: 'Get pending GRNs for a vendor (auto-pulled into Purchase Invoice modal)' })
  async getVendorPendingGrns(
    @CurrentTenant() tenantId: string,
    @Param('vendorId') vendorId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.p2pService.getVendorPendingGrns(tenantId, companyId, vendorId);
  }

  @Post('goods-receipt-notes')
  @ApiOperation({ summary: 'Create GRN and post stock IN to godown/rack' })
  async createGoodsReceiptNote(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.p2pService.createGoodsReceiptNote(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 3. Purchase Invoices
  @Get('purchase-invoices')
  @ApiOperation({ summary: 'List purchase invoices with payment status' })
  async getPurchaseInvoices(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
    @Query('status') status?: PurchaseInvoiceStatus,
    @Query('search') search?: string,
  ) {
    return this.p2pService.getPurchaseInvoices(tenantId, companyId, { status, search });
  }

  @Get('purchase-invoices/:id')
  @ApiOperation({ summary: 'Get purchase invoice details' })
  async getPurchaseInvoiceById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.p2pService.getPurchaseInvoiceById(tenantId, id);
  }

  @Get('vendor/:vendorId/pending-invoices')
  @ApiOperation({ summary: 'Get unpaid/partially paid bills for vendor payment allocation' })
  async getVendorPendingInvoices(
    @CurrentTenant() tenantId: string,
    @Param('vendorId') vendorId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.p2pService.getVendorPendingInvoices(tenantId, companyId, vendorId);
  }

  @Post('purchase-invoices')
  @ApiOperation({ summary: 'Create purchase invoice with double-entry and stock posting' })
  async createPurchaseInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.p2pService.createPurchaseInvoice(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 4. Purchase Returns
  @Get('purchase-returns')
  @ApiOperation({ summary: 'List purchase returns' })
  async getPurchaseReturns(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.p2pService.getPurchaseReturns(tenantId, companyId);
  }

  @Post('purchase-returns')
  @ApiOperation({ summary: 'Create purchase return with stock out and accounting reversal' })
  async createPurchaseReturn(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.p2pService.createPurchaseReturn(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }

  // 5. Vendor Payments
  @Get('vendor-payments')
  @ApiOperation({ summary: 'List vendor payments' })
  async getVendorPayments(
    @CurrentTenant() tenantId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.p2pService.getVendorPayments(tenantId, companyId);
  }

  @Post('vendor-payments')
  @ApiOperation({ summary: 'Create vendor payment and allocate to pending bills' })
  async createVendorPayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.p2pService.createVendorPayment(
      tenantId,
      body.companyId,
      body.branchId,
      user.id,
      body,
    );
  }
}
