import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { DeliveryChallan } from '../entities/delivery-challan.entity';
import { DeliveryChallanItem } from '../entities/delivery-challan-item.entity';
import { DeliveryChallanSoMapping } from '../entities/delivery-challan-so-mapping.entity';
import { SalesInvoice } from '../entities/sales-invoice.entity';
import { SalesInvoiceItem } from '../entities/sales-invoice-item.entity';
import { SalesInvoiceDcMapping } from '../entities/sales-invoice-dc-mapping.entity';
import { SalesReturn } from '../entities/sales-return.entity';
import { SalesReturnItem } from '../entities/sales-return-item.entity';
import { CustomerReceipt } from '../entities/customer-receipt.entity';
import { CustomerReceiptAllocation } from '../entities/customer-receipt-allocation.entity';

import { VoucherSequenceService } from '../../procure-to-pay/services/voucher-sequence.service';
import { AccountingService } from '../../accounting/services/accounting.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { SettingsService } from '../../settings/services/settings.service';
import {
  VoucherType,
  SalesOrderStatus,
  DeliveryChallanStatus,
  SalesInvoiceStatus,
  PurchaseType,
} from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Item } from '../../masters/entities/item.entity';

@Injectable()
export class SalesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SalesOrder)
    private soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private soItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(DeliveryChallan)
    private dcRepo: Repository<DeliveryChallan>,
    @InjectRepository(DeliveryChallanItem)
    private dcItemRepo: Repository<DeliveryChallanItem>,
    @InjectRepository(SalesInvoice)
    private siRepo: Repository<SalesInvoice>,
    @InjectRepository(SalesInvoiceItem)
    private siItemRepo: Repository<SalesInvoiceItem>,
    @InjectRepository(SalesReturn)
    private srRepo: Repository<SalesReturn>,
    @InjectRepository(CustomerReceipt)
    private crRepo: Repository<CustomerReceipt>,
    private sequenceService: VoucherSequenceService,
    private accountingService: AccountingService,
    private inventoryService: InventoryService,
    private settingsService: SettingsService,
  ) {}

  // ==========================================
  // 1. SALES ORDER (SO)
  // ==========================================
  async getSalesOrders(
    tenantId: string,
    companyId: string,
    filters: { status?: SalesOrderStatus; search?: string },
  ) {
    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customerLedger', 'customer')
      .leftJoinAndSelect('so.branch', 'branch')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('so.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(so.voucher_no ILIKE :s OR customer.name ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('so.order_date', 'DESC').addOrderBy('so.voucher_no', 'DESC').getMany();
  }

  async getSalesOrderById(tenantId: string, id: string) {
    const so = await this.soRepo.findOne({
      where: { id, tenantId },
      relations: ['customerLedger', 'branch', 'items', 'items.item', 'items.unit', 'items.variant'],
    });
    if (!so) throw new BadRequestException('Sales Order not found');
    return so;
  }

  async getCustomerPendingSalesOrders(
    tenantId: string,
    companyId: string,
    customerLedgerId: string,
  ) {
    return this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.unit', 'unit')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.company_id = :companyId', { companyId })
      .andWhere('so.customer_ledger_id = :customerLedgerId', { customerLedgerId })
      .andWhere('so.status IN (:...statuses)', {
        statuses: [SalesOrderStatus.PENDING, SalesOrderStatus.PARTIALLY_DISPATCHED],
      })
      .orderBy('so.order_date', 'ASC')
      .getMany();
  }

  async createSalesOrder(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.SALES_ORDER,
        ));

      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;

      const orderItems: SalesOrderItem[] = [];

      for (const line of data.items || []) {
        const qty = Number(line.orderedQty || line.qty || 0);
        const rate = Number(line.rate ?? line.unitPrice ?? 0);
        const discountAmount = Number(line.discountAmount || 0);
        const taxableAmount = Number((qty * rate - discountAmount).toFixed(2));
        const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);

        let unitId = line.unitId;
        if (!unitId && line.itemId) {
          const itemRec = await manager.findOne(Item, { where: { id: line.itemId } });
          unitId = itemRec?.unitId;
        }

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (line.isInterstate) {
          igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
        } else {
          cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
        }

        const lineTotal = Number(
          (taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2),
        );

        subtotal += taxableAmount;
        taxTotal += cgstAmount + sgstAmount + igstAmount;
        grandTotal += lineTotal;

        const soItem = manager.create(SalesOrderItem, {
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: unitId!,
          orderedQty: qty,
          dispatchedQty: 0,
          rate,
          discountAmount,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount: lineTotal,
        });

        orderItems.push(soItem);
      }

      const so = manager.create(SalesOrder, {
        tenantId,
        companyId,
        branchId,
        voucherNo,
        orderDate: data.orderDate || new Date().toISOString().split('T')[0],
        deliveryDueDate: data.deliveryDueDate || null,
        customerLedgerId: data.customerLedgerId,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        status: SalesOrderStatus.PENDING,
        notes: data.notes || '',
        createdBy: userId,
        items: orderItems,
      });

      return manager.save(SalesOrder, so);
    });
  }

  async cancelSalesOrder(tenantId: string, id: string) {
    const so = await this.soRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!so) throw new BadRequestException('Sales Order not found');

    const hasDispatched = so.items.some((it) => Number(it.dispatchedQty) > 0);
    if (hasDispatched) {
      throw new BadRequestException('Cannot cancel Sales Order with dispatched quantities');
    }

    so.status = SalesOrderStatus.CANCELLED;
    return this.soRepo.save(so);
  }

  // ==========================================
  // 2. DELIVERY CHALLAN (DISPATCH & STOCK OUT)
  // ==========================================
  async getDeliveryChallans(
    tenantId: string,
    companyId: string,
    filters: { status?: DeliveryChallanStatus; search?: string },
  ) {
    const qb = this.dcRepo
      .createQueryBuilder('dc')
      .leftJoinAndSelect('dc.customerLedger', 'customer')
      .leftJoinAndSelect('dc.branch', 'branch')
      .leftJoinAndSelect('dc.godown', 'godown')
      .where('dc.tenant_id = :tenantId', { tenantId })
      .andWhere('dc.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('dc.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(dc.voucher_no ILIKE :s OR customer.name ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('dc.challan_date', 'DESC').addOrderBy('dc.voucher_no', 'DESC').getMany();
  }

  async getDeliveryChallanById(tenantId: string, id: string) {
    const dc = await this.dcRepo.findOne({
      where: { id, tenantId },
      relations: [
        'customerLedger',
        'branch',
        'godown',
        'items',
        'items.item',
        'items.unit',
        'items.variant',
        'salesOrders',
        'salesOrders.salesOrder',
      ],
    });
    if (!dc) throw new BadRequestException('Delivery Challan not found');
    return dc;
  }

  async getCustomerPendingChallans(
    tenantId: string,
    companyId: string,
    customerLedgerId: string,
  ) {
    return this.dcRepo
      .createQueryBuilder('dc')
      .leftJoinAndSelect('dc.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.unit', 'unit')
      .where('dc.tenant_id = :tenantId', { tenantId })
      .andWhere('dc.company_id = :companyId', { companyId })
      .andWhere('dc.customer_ledger_id = :customerLedgerId', { customerLedgerId })
      .andWhere('dc.status IN (:...statuses)', {
        statuses: [DeliveryChallanStatus.PENDING, DeliveryChallanStatus.PARTIALLY_INVOICED],
      })
      .orderBy('dc.challan_date', 'ASC')
      .getMany();
  }

  async createDeliveryChallan(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.DELIVERY_CHALLAN,
        ));

      const challanDate = data.challanDate || new Date().toISOString().split('T')[0];
      const godownId = data.godownId;

      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;

      const challanItems: DeliveryChallanItem[] = [];
      const stockMovementLines: any[] = [];
      const affectedSoItemIds: string[] = [];

      for (const line of data.items || []) {
        const qty = Number(line.dispatchedQty || line.qty || 0);
        const rate = Number(line.rate ?? line.unitPrice ?? 0);
        const discountAmount = Number(line.discountAmount || 0);
        const taxableAmount = Number((qty * rate - discountAmount).toFixed(2));
        const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);

        let unitId = line.unitId;
        if (!unitId && line.itemId) {
          const itemRec = await manager.findOne(Item, { where: { id: line.itemId } });
          unitId = itemRec?.unitId;
        }

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (line.isInterstate) {
          igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
        } else {
          cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
        }

        const lineTotal = Number(
          (taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2),
        );

        subtotal += taxableAmount;
        taxTotal += cgstAmount + sgstAmount + igstAmount;
        grandTotal += lineTotal;

        const dcItem = manager.create(DeliveryChallanItem, {
          salesOrderItemId: line.salesOrderItemId || line.soItemId || null,
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: unitId!,
          dispatchedQty: qty,
          invoicedQty: 0,
          rate,
          discountAmount,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount: lineTotal,
        });

        challanItems.push(dcItem);

        // Prepare Stock OUT movement line
        stockMovementLines.push({
          godownId,
          itemId: line.itemId,
          variantId: line.variantId || null,
          qtyOut: qty,
          unitRate: rate,
        });

        if (line.salesOrderItemId) {
          affectedSoItemIds.push(line.salesOrderItemId);
        }
      }

      // 1. Create and Save Delivery Challan Document
      const dc = manager.create(DeliveryChallan, {
        tenantId,
        companyId,
        branchId,
        godownId,
        voucherNo,
        challanDate,
        customerLedgerId: data.customerLedgerId,
        transportMode: data.transportMode || null,
        vehicleNo: data.vehicleNo || null,
        eWayBillNo: data.eWayBillNo || null,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        status: DeliveryChallanStatus.PENDING,
        notes: data.notes || '',
        createdBy: userId,
        items: challanItems,
      });

      const savedDc = await manager.save(DeliveryChallan, dc);

      // 2. Map Linked Sales Orders
      if (data.salesOrderIds && data.salesOrderIds.length > 0) {
        const mappings = data.salesOrderIds.map((soId: string) =>
          manager.create(DeliveryChallanSoMapping, {
            deliveryChallanId: savedDc.id,
            salesOrderId: soId,
          }),
        );
        await manager.save(DeliveryChallanSoMapping, mappings);
      }

      // 3. Post Atomic Stock OUT to Stock Ledger
      await this.inventoryService.recordStockMovement(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: challanDate,
        voucherType: VoucherType.DELIVERY_CHALLAN,
        voucherId: savedDc.id,
        voucherNo,
        lines: stockMovementLines,
      });

      // 4. Update Dispatched Quantities on Linked SO Items
      for (const line of data.items || []) {
        if (line.salesOrderItemId) {
          await manager.increment(
            SalesOrderItem,
            { id: line.salesOrderItemId },
            'dispatchedQty',
            Number(line.dispatchedQty),
          );
        }
      }

      // 5. Update Status of Linked Sales Orders
      if (data.salesOrderIds && data.salesOrderIds.length > 0) {
        for (const soId of data.salesOrderIds) {
          const so = await manager.findOne(SalesOrder, {
            where: { id: soId },
            relations: ['items'],
          });
          if (so) {
            const allCleared = so.items.every(
              (it) => Number(it.dispatchedQty) >= Number(it.orderedQty),
            );
            const someDispatched = so.items.some((it) => Number(it.dispatchedQty) > 0);

            so.status = allCleared
              ? SalesOrderStatus.CLEARED
              : someDispatched
              ? SalesOrderStatus.PARTIALLY_DISPATCHED
              : SalesOrderStatus.PENDING;
            await manager.save(SalesOrder, so);
          }
        }
      }

      return savedDc;
    });
  }

  // ==========================================
  // 3. SALES INVOICE (TAX INVOICE & REVENUE POSTING)
  // ==========================================
  async getSalesInvoices(
    tenantId: string,
    companyId: string,
    filters: { status?: SalesInvoiceStatus; search?: string },
  ) {
    const qb = this.siRepo
      .createQueryBuilder('si')
      .leftJoinAndSelect('si.customerLedger', 'customer')
      .leftJoinAndSelect('si.branch', 'branch')
      .where('si.tenant_id = :tenantId', { tenantId })
      .andWhere('si.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('si.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(si.voucher_no ILIKE :s OR customer.name ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('si.invoice_date', 'DESC').addOrderBy('si.voucher_no', 'DESC').getMany();
  }

  async getSalesInvoiceById(tenantId: string, id: string) {
    const si = await this.siRepo.findOne({
      where: { id, tenantId },
      relations: [
        'customerLedger',
        'branch',
        'items',
        'items.item',
        'items.unit',
        'items.variant',
        'deliveryChallans',
        'deliveryChallans.deliveryChallan',
      ],
    });
    if (!si) throw new BadRequestException('Sales Invoice not found');
    return si;
  }

  async getCustomerPendingInvoices(
    tenantId: string,
    companyId: string,
    customerLedgerId: string,
  ) {
    return this.siRepo
      .createQueryBuilder('si')
      .where('si.tenant_id = :tenantId', { tenantId })
      .andWhere('si.company_id = :companyId', { companyId })
      .andWhere('si.customer_ledger_id = :customerLedgerId', { customerLedgerId })
      .andWhere('si.status IN (:...statuses)', {
        statuses: [SalesInvoiceStatus.PENDING, SalesInvoiceStatus.PARTIALLY_PAID],
      })
      .orderBy('si.invoice_date', 'ASC')
      .getMany();
  }

  async createSalesInvoice(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.SALES_INVOICE,
        ));

      const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];

      let taxableTotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let discountTotal = Number(data.discountTotal || 0);
      let grandTotal = 0;

      const invoiceItems: SalesInvoiceItem[] = [];
      const directStockLines: any[] = [];

      for (const line of data.items || []) {
        const qty = Number(line.billedQty || line.qty || 0);
        const rate = Number(line.rate ?? line.unitPrice ?? 0);
        const lineDiscount = Number(line.discountAmount || 0);
        const taxableAmount = Number((qty * rate - lineDiscount).toFixed(2));
        const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);

        let unitId = line.unitId;
        if (!unitId && line.itemId) {
          const itemRec = await manager.findOne(Item, { where: { id: line.itemId } });
          unitId = itemRec?.unitId;
        }

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (line.isInterstate) {
          igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
        } else {
          cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
        }

        const lineTotal = Number(
          (taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2),
        );

        taxableTotal += taxableAmount;
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
        igstTotal += igstAmount;
        grandTotal += lineTotal;

        const siItem = manager.create(SalesInvoiceItem, {
          deliveryChallanItemId: line.deliveryChallanItemId || line.dcItemId || null,
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: unitId!,
          billedQty: qty,
          rate,
          discountAmount: lineDiscount,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          cessAmount: 0,
          totalAmount: lineTotal,
        });

        invoiceItems.push(siItem);

        // If direct sale without Delivery Challan, track for immediate Stock OUT
        if (data.isDirectSale && data.godownId) {
          directStockLines.push({
            godownId: data.godownId,
            itemId: line.itemId,
            variantId: line.variantId || null,
            qtyOut: qty,
            unitRate: rate,
          });
        }
      }

      // Round off calculation
      const unrounded = grandTotal - discountTotal;
      const roundedGrandTotal = Math.round(unrounded);
      const roundOffTotal = Number((roundedGrandTotal - unrounded).toFixed(2));
      grandTotal = roundedGrandTotal;

      // 1. Create and Save Sales Invoice Document
      const si = manager.create(SalesInvoice, {
        tenantId,
        companyId,
        branchId,
        voucherNo,
        invoiceDate,
        salesType: data.salesType || PurchaseType.GOODS,
        customerLedgerId: data.customerLedgerId,
        dueDate: data.dueDate || null,
        paymentTerms: data.paymentTerms || 'Due on receipt',
        taxableTotal: Number(taxableTotal.toFixed(2)),
        cgstTotal: Number(cgstTotal.toFixed(2)),
        sgstTotal: Number(sgstTotal.toFixed(2)),
        igstTotal: Number(igstTotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        roundOffTotal,
        grandTotal,
        paidAmount: 0,
        status: SalesInvoiceStatus.PENDING,
        notes: data.notes || '',
        createdBy: userId,
        items: invoiceItems,
      });

      const savedSi = await manager.save(SalesInvoice, si);

      // 2. Map Linked Delivery Challans
      if (data.deliveryChallanIds && data.deliveryChallanIds.length > 0) {
        const mappings = data.deliveryChallanIds.map((dcId: string) =>
          manager.create(SalesInvoiceDcMapping, {
            salesInvoiceId: savedSi.id,
            deliveryChallanId: dcId,
          }),
        );
        await manager.save(SalesInvoiceDcMapping, mappings);

        // Update invoiced quantities on Delivery Challan Items
        for (const line of data.items || []) {
          if (line.deliveryChallanItemId) {
            await manager.increment(
              DeliveryChallanItem,
              { id: line.deliveryChallanItemId },
              'invoicedQty',
              Number(line.billedQty),
            );
          }
        }

        // Check if Delivery Challans are cleared
        for (const dcId of data.deliveryChallanIds) {
          const dc = await manager.findOne(DeliveryChallan, {
            where: { id: dcId },
            relations: ['items'],
          });
          if (dc) {
            const allInvoiced = dc.items.every(
              (it) => Number(it.invoicedQty) >= Number(it.dispatchedQty),
            );
            dc.status = allInvoiced
              ? DeliveryChallanStatus.CLEARED
              : DeliveryChallanStatus.PARTIALLY_INVOICED;
            await manager.save(DeliveryChallan, dc);
          }
        }
      }

      // 3. If direct sale, record Stock OUT movement
      if (directStockLines.length > 0 && data.godownId) {
        await this.inventoryService.recordStockMovement(manager, {
          tenantId,
          companyId,
          branchId,
          entryDate: invoiceDate,
          voucherType: VoucherType.SALES_INVOICE,
          voucherId: savedSi.id,
          voucherNo,
          lines: directStockLines,
        });
      }

      // 4. BALANCED DOUBLE-ENTRY REVENUE POSTING
      // Dr Customer Ledger [Grand Total]
      // Cr Sales Account [Taxable Total]
      // Cr Output CGST [CGST Total]
      // Cr Output SGST [SGST Total]
      // Cr Output IGST [IGST Total]
      // Cr/Dr Round Off
      const settings = await this.settingsService.getSettings(tenantId, companyId);
      const salesLedgerId = settings?.defaultSalesLedgerId;
      const cgstOutputId = settings?.defaultCgstOutputLedgerId;
      const sgstOutputId = settings?.defaultSgstOutputLedgerId;
      const igstOutputId = settings?.defaultIgstOutputLedgerId;
      const roundOffId = settings?.defaultRoundOffLedgerId;

      const fallbackSales = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Sales Account' },
      });
      const fallbackCgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output CGST' },
      });
      const fallbackSgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output SGST' },
      });
      const fallbackIgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output IGST' },
      });
      const fallbackRoundOff = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Round Off' },
      });

      const effectiveSalesId = salesLedgerId || fallbackSales?.id;
      const effectiveCgstId = cgstOutputId || fallbackCgstOut?.id;
      const effectiveSgstId = sgstOutputId || fallbackSgstOut?.id;
      const effectiveIgstId = igstOutputId || fallbackIgstOut?.id;
      const effectiveRoundOffId = roundOffId || fallbackRoundOff?.id;

      if (!effectiveSalesId) {
        throw new BadRequestException('Sales Ledger is not mapped in settings or masters');
      }

      const journalLines: any[] = [];

      // Debit Customer (Receivable Asset)
      journalLines.push({
        ledgerId: data.customerLedgerId,
        debitAmount: grandTotal,
        creditAmount: 0,
        narration: `Tax Invoice ${voucherNo}`,
      });

      // Credit Sales Account (Income)
      journalLines.push({
        ledgerId: effectiveSalesId,
        debitAmount: 0,
        creditAmount: Number(taxableTotal.toFixed(2)),
        narration: `Sales revenue for ${voucherNo}`,
      });

      // Credit Output CGST
      if (cgstTotal > 0 && effectiveCgstId) {
        journalLines.push({
          ledgerId: effectiveCgstId,
          debitAmount: 0,
          creditAmount: Number(cgstTotal.toFixed(2)),
          narration: `Output CGST for ${voucherNo}`,
        });
      }

      // Credit Output SGST
      if (sgstTotal > 0 && effectiveSgstId) {
        journalLines.push({
          ledgerId: effectiveSgstId,
          debitAmount: 0,
          creditAmount: Number(sgstTotal.toFixed(2)),
          narration: `Output SGST for ${voucherNo}`,
        });
      }

      // Credit Output IGST
      if (igstTotal > 0 && effectiveIgstId) {
        journalLines.push({
          ledgerId: effectiveIgstId,
          debitAmount: 0,
          creditAmount: Number(igstTotal.toFixed(2)),
          narration: `Output IGST for ${voucherNo}`,
        });
      }

      // Round-off Line
      if (roundOffTotal !== 0 && effectiveRoundOffId) {
        if (roundOffTotal > 0) {
          journalLines.push({
            ledgerId: effectiveRoundOffId,
            debitAmount: 0,
            creditAmount: Math.abs(roundOffTotal),
            narration: 'Round off fractional paise',
          });
        } else {
          journalLines.push({
            ledgerId: effectiveRoundOffId,
            debitAmount: Math.abs(roundOffTotal),
            creditAmount: 0,
            narration: 'Round off fractional paise',
          });
        }
      }

      // Post Balanced Ledger Entry
      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: invoiceDate,
        voucherType: VoucherType.SALES_INVOICE,
        voucherId: savedSi.id,
        voucherNo,
        lines: journalLines,
      });

      return savedSi;
    });
  }

  // ==========================================
  // 4. SALES RETURN (CREDIT NOTE & REVERSAL)
  // ==========================================
  async getSalesReturns(tenantId: string, companyId: string) {
    return this.srRepo.find({
      where: { tenantId, companyId },
      relations: ['customerLedger', 'salesInvoice', 'branch', 'items', 'items.item'],
      order: { returnDate: 'DESC' },
    });
  }

  async createSalesReturn(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.SALES_RETURN,
        ));

      const returnDate = data.returnDate || new Date().toISOString().split('T')[0];

      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;

      const returnItems: SalesReturnItem[] = [];
      const stockMovementLines = [];

      for (const line of data.items || []) {
        const returnedQty = Number(line.returnedQty || line.qty || 0);
        const rate = Number(line.rate ?? line.unitPrice ?? 0);
        const taxableAmount = Number((returnedQty * rate).toFixed(2));
        const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);
        let cgstAmount = Number(line.cgstAmount || 0);
        let sgstAmount = Number(line.sgstAmount || 0);
        let igstAmount = Number(line.igstAmount || 0);

        if (gstRate > 0 && !cgstAmount && !sgstAmount && !igstAmount) {
          if (line.isInterstate) {
            igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
          } else {
            cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
            sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          }
        }

        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

        subtotal += taxableAmount;
        taxTotal += cgstAmount + sgstAmount + igstAmount;
        grandTotal += totalAmount;

        const effectiveGodownId = line.godownId || data.godownId;

        const srItem = manager.create(SalesReturnItem, {
          salesInvoiceItemId: line.salesInvoiceItemId || null,
          itemId: line.itemId,
          variantId: line.variantId || null,
          returnedQty,
          rate,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount,
        });
        returnItems.push(srItem);

        // Stock IN movement (Goods returned to warehouse)
        if (effectiveGodownId) {
          stockMovementLines.push({
            godownId: effectiveGodownId,
            itemId: line.itemId,
            variantId: line.variantId || null,
            qtyIn: returnedQty,
            unitRate: rate,
          });
        }
      }

      const sr = manager.create(SalesReturn, {
        tenantId,
        companyId,
        branchId,
        godownId: data.godownId || null,
        salesInvoiceId: data.salesInvoiceId || null,
        voucherNo,
        returnDate,
        customerLedgerId: data.customerLedgerId,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        reason: data.reason || 'Customer Return',
        createdBy: userId,
        items: returnItems,
      });

      const savedSr = await manager.save(SalesReturn, sr);

      // 1. Post Stock IN Movement
      if (stockMovementLines.length > 0 && data.godownId) {
        await this.inventoryService.recordStockMovement(manager, {
          tenantId,
          companyId,
          branchId,
          entryDate: returnDate,
          voucherType: VoucherType.SALES_RETURN,
          voucherId: savedSr.id,
          voucherNo,
          lines: stockMovementLines,
        });
      }

      // 2. Reversal Double Entry:
      // Dr Sales Account (or Sales Return) [Taxable Subtotal]
      // Dr Output CGST / SGST / IGST [Tax Total]
      // Cr Customer Ledger [Grand Total]
      const settings = await this.settingsService.getSettings(tenantId, companyId);
      const fallbackSales = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Sales Account' },
      });
      const fallbackCgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output CGST' },
      });
      const fallbackSgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output SGST' },
      });
      const fallbackIgstOut = await manager.findOne(Ledger, {
        where: { tenantId, companyId, name: 'Output IGST' },
      });

      const effectiveSalesId = settings?.defaultSalesLedgerId || fallbackSales?.id;
      const effectiveCgstId = settings?.defaultCgstOutputLedgerId || fallbackCgstOut?.id;
      const effectiveSgstId = settings?.defaultSgstOutputLedgerId || fallbackSgstOut?.id;
      const effectiveIgstId = settings?.defaultIgstOutputLedgerId || fallbackIgstOut?.id;

      const reversalLines: any[] = [];

      // Debit Sales Account
      reversalLines.push({
        ledgerId: effectiveSalesId,
        debitAmount: Number(subtotal.toFixed(2)),
        creditAmount: 0,
        narration: `Sales Return Credit Note ${voucherNo}`,
      });

      // Debit Output CGST
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      for (const line of returnItems) {
        totalCgst += Number(line.cgstAmount || 0);
        totalSgst += Number(line.sgstAmount || 0);
        totalIgst += Number(line.igstAmount || 0);
      }

      if (totalCgst > 0 && effectiveCgstId) {
        reversalLines.push({
          ledgerId: effectiveCgstId,
          debitAmount: Number(totalCgst.toFixed(2)),
          creditAmount: 0,
          narration: `Output CGST Reversal for ${voucherNo}`,
        });
      }
      if (totalSgst > 0 && effectiveSgstId) {
        reversalLines.push({
          ledgerId: effectiveSgstId,
          debitAmount: Number(totalSgst.toFixed(2)),
          creditAmount: 0,
          narration: `Output SGST Reversal for ${voucherNo}`,
        });
      }
      if (totalIgst > 0 && effectiveIgstId) {
        reversalLines.push({
          ledgerId: effectiveIgstId,
          debitAmount: Number(totalIgst.toFixed(2)),
          creditAmount: 0,
          narration: `Output IGST Reversal for ${voucherNo}`,
        });
      }

      // Credit Customer Ledger (Reducing receivable)
      reversalLines.push({
        ledgerId: data.customerLedgerId,
        debitAmount: 0,
        creditAmount: Number(grandTotal.toFixed(2)),
        narration: `Credit Note issued ${voucherNo}`,
      });

      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: returnDate,
        voucherType: VoucherType.SALES_RETURN,
        voucherId: savedSr.id,
        voucherNo,
        lines: reversalLines,
      });

      return savedSr;
    });
  }

  // ==========================================
  // 5. CUSTOMER RECEIPT (PAYMENT IN & BILL ALLOCATION)
  // ==========================================
  async getCustomerReceipts(tenantId: string, companyId: string) {
    return this.crRepo.find({
      where: { tenantId, companyId },
      relations: [
        'customerLedger',
        'paymentLedger',
        'branch',
        'allocations',
        'allocations.salesInvoice',
      ],
      order: { receiptDate: 'DESC' },
    });
  }

  async createCustomerReceipt(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.CUSTOMER_RECEIPT,
        ));

      const receiptDate = data.receiptDate || new Date().toISOString().split('T')[0];
      const totalAmount = Number(data.amount || data.totalAmount || 0);

      const allocations: CustomerReceiptAllocation[] = [];
      let sumAllocated = 0;

      for (const alloc of data.allocations || []) {
        const allocAmount = Number(alloc.allocatedAmount);
        sumAllocated += allocAmount;

        const crAlloc = manager.create(CustomerReceiptAllocation, {
          salesInvoiceId: alloc.salesInvoiceId,
          allocatedAmount: allocAmount,
        });
        allocations.push(crAlloc);

        // Update Sales Invoice paid amount and status
        await manager.increment(
          SalesInvoice,
          { id: alloc.salesInvoiceId },
          'paidAmount',
          allocAmount,
        );

        const inv = await manager.findOne(SalesInvoice, {
          where: { id: alloc.salesInvoiceId },
        });

        if (inv) {
          const isFullyPaid = Number(inv.paidAmount) >= Number(inv.grandTotal);
          inv.status = isFullyPaid
            ? SalesInvoiceStatus.PAID
            : SalesInvoiceStatus.PARTIALLY_PAID;
          await manager.save(SalesInvoice, inv);
        }
      }

      // 1. Create and Save Customer Receipt Document
      const receipt = manager.create(CustomerReceipt, {
        tenantId,
        companyId,
        branchId,
        voucherNo,
        receiptDate,
        customerLedgerId: data.customerLedgerId,
        paymentLedgerId: data.paymentLedgerId,
        amount: totalAmount,
        paymentMode: data.paymentMode || 'BANK',
        referenceNo: data.referenceNo || data.referenceNumber || null,
        notes: data.notes || data.remarks || '',
        createdBy: userId,
        allocations,
      });

      const savedReceipt = await manager.save(CustomerReceipt, receipt);

      // 2. DOUBLE-ENTRY ACCOUNTING POSTING
      // Dr Bank / Cash Ledger [totalAmount]
      // Cr Customer Ledger [totalAmount]
      const journalLines = [
        {
          ledgerId: data.paymentLedgerId,
          debitAmount: totalAmount,
          creditAmount: 0,
          narration: `Payment received from customer (${data.paymentMode})`,
        },
        {
          ledgerId: data.customerLedgerId,
          debitAmount: 0,
          creditAmount: totalAmount,
          narration: `Receipt voucher ${voucherNo}`,
        },
      ];

      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: receiptDate,
        voucherType: VoucherType.CUSTOMER_RECEIPT,
        voucherId: savedReceipt.id,
        voucherNo,
        lines: journalLines,
      });

      return savedReceipt;
    });
  }
}
