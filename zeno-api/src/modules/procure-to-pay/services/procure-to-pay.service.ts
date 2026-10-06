import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';
import { GoodsReceiptNote } from '../entities/goods-receipt-note.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { GrnPoMapping } from '../entities/grn-po-mapping.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from '../entities/purchase-invoice-item.entity';
import { PurchaseInvoiceGrnMapping } from '../entities/purchase-invoice-grn-mapping.entity';
import { PurchaseReturn } from '../entities/purchase-return.entity';
import { PurchaseReturnItem } from '../entities/purchase-return-item.entity';
import { VendorPayment } from '../entities/vendor-payment.entity';
import { VendorPaymentAllocation } from '../entities/vendor-payment-allocation.entity';

import { VoucherSequenceService } from './voucher-sequence.service';
import { AccountingService } from '../../accounting/services/accounting.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { SettingsService } from '../../settings/services/settings.service';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import {
  FeatureKey,
  GrnStatus,
  PurchaseInvoiceStatus,
  PurchaseOrderStatus,
  VoucherType,
} from '../../../common/enums';

@Injectable()
export class ProcureToPayService {
  constructor(
    private dataSource: DataSource,
    private sequenceService: VoucherSequenceService,
    private accountingService: AccountingService,
    private inventoryService: InventoryService,
    private settingsService: SettingsService,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(GoodsReceiptNote)
    private grnRepo: Repository<GoodsReceiptNote>,
    @InjectRepository(PurchaseInvoice)
    private piRepo: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseReturn)
    private prRepo: Repository<PurchaseReturn>,
    @InjectRepository(VendorPayment)
    private paymentRepo: Repository<VendorPayment>,
  ) {}

  // ==========================================
  // 1. PURCHASE ORDER (PO)
  // ==========================================
  async getPurchaseOrders(
    tenantId: string,
    companyId: string,
    filters: { status?: PurchaseOrderStatus; search?: string },
  ) {
    const qb = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.vendorLedger', 'vendor')
      .leftJoinAndSelect('po.branch', 'branch')
      .where('po.tenant_id = :tenantId', { tenantId })
      .andWhere('po.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('po.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(po.voucher_no ILIKE :s OR vendor.name ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('po.order_date', 'DESC').addOrderBy('po.voucher_no', 'DESC').getMany();
  }

  async getPurchaseOrderById(tenantId: string, id: string) {
    const po = await this.poRepo.findOne({
      where: { id, tenantId },
      relations: ['vendorLedger', 'branch', 'items', 'items.item', 'items.unit', 'items.variant'],
    });
    if (!po) throw new BadRequestException('Purchase Order not found');
    return po;
  }

  async getVendorPendingPurchaseOrders(
    tenantId: string,
    companyId: string,
    vendorLedgerId: string,
  ) {
    return this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.unit', 'unit')
      .leftJoinAndSelect('items.variant', 'variant')
      .where('po.tenant_id = :tenantId', { tenantId })
      .andWhere('po.company_id = :companyId', { companyId })
      .andWhere('po.vendor_ledger_id = :vendorLedgerId', { vendorLedgerId })
      .andWhere('po.status IN (:...statuses)', {
        statuses: [PurchaseOrderStatus.PENDING, PurchaseOrderStatus.PARTIALLY_CLEARED],
      })
      .orderBy('po.order_date', 'ASC')
      .getMany();
  }

  async createPurchaseOrder(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Voucher Number Generation
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.PURCHASE_ORDER,
        ));

      // Calculate totals
      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;

      const items: PurchaseOrderItem[] = [];
      for (const line of data.items || []) {
        const orderedQty = Number(line.orderedQty);
        const rate = Number(line.rate);
        const discountAmount = Number(line.discountAmount || 0);
        const taxableAmount = orderedQty * rate - discountAmount;
        const gstRate = Number(line.gstRate || 0);
        const isInterstate = Boolean(line.isInterstate);

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (gstRate > 0) {
          if (isInterstate) {
            igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
          } else {
            cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
            sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          }
        }

        const cessAmount = Number(line.cessAmount || 0);
        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

        subtotal += taxableAmount;
        taxTotal += cgstAmount + sgstAmount + igstAmount + cessAmount;
        grandTotal += totalAmount;

        const poItem = manager.create(PurchaseOrderItem, {
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: line.unitId,
          orderedQty,
          receivedQty: 0,
          rate,
          discountAmount,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          cessAmount,
          totalAmount,
        });
        items.push(poItem);
      }

      const po = manager.create(PurchaseOrder, {
        tenantId,
        companyId,
        branchId,
        voucherNo,
        orderDate: data.orderDate || new Date().toISOString().split('T')[0],
        vendorLedgerId: data.vendorLedgerId,
        status: PurchaseOrderStatus.PENDING,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        notes: data.notes || '',
        createdBy: userId,
        items,
      });

      return await manager.save(PurchaseOrder, po);
    });
  }

  async cancelPurchaseOrder(tenantId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(PurchaseOrder, { where: { id, tenantId } });
      if (!po) throw new BadRequestException('Purchase Order not found');

      // Check rule: cannot cancel if linked to any GRN
      const grnLinks = await manager.count(GrnPoMapping, { where: { purchaseOrderId: id } });
      if (grnLinks > 0) {
        throw new BadRequestException('Cannot cancel Purchase Order: It is already linked to a GRN');
      }

      po.status = PurchaseOrderStatus.CANCELLED;
      return manager.save(PurchaseOrder, po);
    });
  }

  // ==========================================
  // 2. GOODS RECEIPT NOTE (GRN)
  // ==========================================
  async getGoodsReceiptNotes(
    tenantId: string,
    companyId: string,
    filters: { status?: GrnStatus; search?: string },
  ) {
    const qb = this.grnRepo
      .createQueryBuilder('grn')
      .leftJoinAndSelect('grn.vendorLedger', 'vendor')
      .leftJoinAndSelect('grn.godown', 'godown')
      .leftJoinAndSelect('grn.branch', 'branch')
      .where('grn.tenant_id = :tenantId', { tenantId })
      .andWhere('grn.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('grn.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(grn.voucher_no ILIKE :s OR vendor.name ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('grn.grn_date', 'DESC').addOrderBy('grn.voucher_no', 'DESC').getMany();
  }

  async getGoodsReceiptNoteById(tenantId: string, id: string) {
    const grn = await this.grnRepo.findOne({
      where: { id, tenantId },
      relations: [
        'vendorLedger',
        'branch',
        'godown',
        'items',
        'items.item',
        'items.unit',
        'items.variant',
        'items.rackBin',
        'poMappings',
        'poMappings.purchaseOrder',
      ],
    });
    if (!grn) throw new BadRequestException('GRN not found');
    return grn;
  }

  async getVendorPendingGrns(tenantId: string, companyId: string, vendorLedgerId: string) {
    return this.grnRepo
      .createQueryBuilder('grn')
      .leftJoinAndSelect('grn.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.unit', 'unit')
      .leftJoinAndSelect('items.variant', 'variant')
      .where('grn.tenant_id = :tenantId', { tenantId })
      .andWhere('grn.company_id = :companyId', { companyId })
      .andWhere('grn.vendor_ledger_id = :vendorLedgerId', { vendorLedgerId })
      .andWhere('grn.status IN (:...statuses)', {
        statuses: [GrnStatus.PENDING, GrnStatus.PARTIALLY_CLEARED],
      })
      .orderBy('grn.grn_date', 'ASC')
      .getMany();
  }

  async createGoodsReceiptNote(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Voucher Number Generation
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.GOODS_RECEIPT_NOTE,
        ));

      const grnDate = data.grnDate || new Date().toISOString().split('T')[0];
      const godownId = data.godownId;

      // 2. Prepare items & stock lines
      const grnItems: GrnItem[] = [];
      const stockMovementLines = [];

      for (const line of data.items || []) {
        const receivedQty = Number(line.receivedQty);
        const rate = Number(line.rate);
        const totalAmount = Number((receivedQty * rate).toFixed(2));

        const grnItem = manager.create(GrnItem, {
          poItemId: line.poItemId || null,
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: line.unitId,
          godownId: line.godownId || godownId,
          rackBinId: line.rackBinId || null,
          receivedQty,
          invoicedQty: 0,
          rate,
          totalAmount,
        });
        grnItems.push(grnItem);

        // Update PO item receivedQty if linked
        if (line.poItemId) {
          const poItem = await manager.findOne(PurchaseOrderItem, {
            where: { id: line.poItemId },
          });
          if (poItem) {
            poItem.receivedQty = Number(poItem.receivedQty) + receivedQty;
            await manager.save(PurchaseOrderItem, poItem);
          }
        }

        // Add to stock in
        stockMovementLines.push({
          godownId: line.godownId || godownId,
          rackBinId: line.rackBinId,
          itemId: line.itemId,
          variantId: line.variantId,
          qtyIn: receivedQty,
          unitRate: rate,
        });
      }

      // Link PO Mappings
      const poMappings: GrnPoMapping[] = [];
      const poIds: string[] = Array.from(new Set(data.purchaseOrderIds || []));
      for (const poId of poIds) {
        poMappings.push(manager.create(GrnPoMapping, { purchaseOrderId: poId }));
      }

      const grn = manager.create(GoodsReceiptNote, {
        tenantId,
        companyId,
        branchId,
        godownId,
        voucherNo,
        grnDate,
        vendorLedgerId: data.vendorLedgerId,
        status: GrnStatus.PENDING,
        notes: data.notes || '',
        createdBy: userId,
        items: grnItems,
        poMappings,
      });

      const savedGrn = await manager.save(GoodsReceiptNote, grn);

      // Post Stock IN
      await this.inventoryService.recordStockMovement(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: grnDate,
        voucherType: VoucherType.GOODS_RECEIPT_NOTE,
        voucherId: savedGrn.id,
        voucherNo,
        lines: stockMovementLines,
      });

      // Update PO Status (Pending, Partially Cleared, Cleared)
      for (const poId of poIds) {
        const po = await manager.findOne(PurchaseOrder, {
          where: { id: poId },
          relations: ['items'],
        });
        if (po) {
          const allCleared = po.items.every(
            (i) => Number(i.receivedQty) >= Number(i.orderedQty),
          );
          const anyReceived = po.items.some((i) => Number(i.receivedQty) > 0);
          po.status = allCleared
            ? PurchaseOrderStatus.CLEARED
            : anyReceived
              ? PurchaseOrderStatus.PARTIALLY_CLEARED
              : PurchaseOrderStatus.PENDING;
          await manager.save(PurchaseOrder, po);
        }
      }

      return savedGrn;
    });
  }

  // ==========================================
  // 3. PURCHASE INVOICE (PI)
  // ==========================================
  async getPurchaseInvoices(
    tenantId: string,
    companyId: string,
    filters: { status?: PurchaseInvoiceStatus; search?: string },
  ) {
    const qb = this.piRepo
      .createQueryBuilder('pi')
      .leftJoinAndSelect('pi.vendorLedger', 'vendor')
      .leftJoinAndSelect('pi.branch', 'branch')
      .where('pi.tenant_id = :tenantId', { tenantId })
      .andWhere('pi.company_id = :companyId', { companyId });

    if (filters.status) {
      qb.andWhere('pi.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere('(pi.voucher_no ILIKE :s OR vendor.name ILIKE :s OR pi.vendor_bill_no ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('pi.invoice_date', 'DESC').addOrderBy('pi.voucher_no', 'DESC').getMany();
  }

  async getPurchaseInvoiceById(tenantId: string, id: string) {
    const pi = await this.piRepo.findOne({
      where: { id, tenantId },
      relations: [
        'vendorLedger',
        'branch',
        'godown',
        'items',
        'items.item',
        'items.unit',
        'items.variant',
        'grnMappings',
        'grnMappings.grn',
      ],
    });
    if (!pi) throw new BadRequestException('Purchase Invoice not found');
    return pi;
  }

  async getVendorPendingInvoices(tenantId: string, companyId: string, vendorLedgerId: string) {
    return this.piRepo
      .createQueryBuilder('pi')
      .where('pi.tenant_id = :tenantId', { tenantId })
      .andWhere('pi.company_id = :companyId', { companyId })
      .andWhere('pi.vendor_ledger_id = :vendorLedgerId', { vendorLedgerId })
      .andWhere('pi.status IN (:...statuses)', {
        statuses: [PurchaseInvoiceStatus.PENDING, PurchaseInvoiceStatus.PARTIALLY_PAID],
      })
      .orderBy('pi.invoice_date', 'ASC')
      .getMany();
  }

  async createPurchaseInvoice(
    tenantId: string,
    companyId: string,
    branchId: string,
    userId: string,
    data: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Voucher Number Generation
      const voucherNo =
        data.voucherNo ||
        (await this.sequenceService.getNextVoucherNumber(
          manager,
          tenantId,
          companyId,
          branchId,
          VoucherType.PURCHASE_INVOICE,
        ));

      // Resolve branch state code for GST determination
      const branch = await manager.findOne(Branch, { where: { id: branchId } });
      const vendorLedger = await manager.findOne(Ledger, {
        where: { id: data.vendorLedgerId },
      });

      const branchState = branch?.stateCode || '27';
      const placeOfSupply = data.placeOfSupplyStateCode || vendorLedger?.stateCode || branchState;
      const isInterstate = branchState !== placeOfSupply;

      // Check if GRN feature is enabled
      const isGrnEnabled = await this.settingsService.isFeatureEnabled(
        tenantId,
        companyId,
        FeatureKey.GRN,
      );

      let subtotal = 0;
      let discountTotal = Number(data.discountTotal || 0);
      let taxableTotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let cessTotal = 0;

      const invoiceItems: PurchaseInvoiceItem[] = [];
      const stockMovementLines = [];

      for (const line of data.items || []) {
        const receivedQty = Number(line.receivedQty);
        const rate = Number(line.rate);
        const lineDiscount = Number(line.discountAmount || 0);
        const taxableAmount = receivedQty * rate - lineDiscount;
        const gstRate = Number(line.gstRate || 0);

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (gstRate > 0) {
          if (isInterstate) {
            igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
          } else {
            cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
            sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
          }
        }

        const cessAmount = Number(line.cessAmount || 0);
        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

        subtotal += receivedQty * rate;
        taxableTotal += taxableAmount;
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
        igstTotal += igstAmount;
        cessTotal += cessAmount;

        const invItem = manager.create(PurchaseInvoiceItem, {
          grnItemId: line.grnItemId || null,
          itemId: line.itemId,
          variantId: line.variantId || null,
          unitId: line.unitId,
          orderedQty: Number(line.orderedQty || 0),
          receivedQty,
          rate,
          discountAmount: lineDiscount,
          taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          cessAmount,
          totalAmount,
        });
        invoiceItems.push(invItem);

        // Update GRN item invoicedQty if linked
        if (line.grnItemId) {
          const grnItem = await manager.findOne(GrnItem, { where: { id: line.grnItemId } });
          if (grnItem) {
            grnItem.invoicedQty = Number(grnItem.invoicedQty) + receivedQty;
            await manager.save(GrnItem, grnItem);
          }
        }

        // Direct purchase invoice: If GRN is disabled, post Stock IN directly!
        if (!isGrnEnabled || (!data.grnIds && !line.grnItemId)) {
          stockMovementLines.push({
            godownId: data.godownId,
            itemId: line.itemId,
            variantId: line.variantId,
            qtyIn: receivedQty,
            unitRate: rate,
          });
        }
      }

      // Calculate round-off & Grand Total
      const rawGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal + cessTotal;
      const roundedTotal = Math.round(rawGrandTotal);
      const roundOff = Number((roundedTotal - rawGrandTotal).toFixed(2));
      const grandTotal = roundedTotal;

      // Link GRNs
      const grnMappings: PurchaseInvoiceGrnMapping[] = [];
      const grnIds: string[] = Array.from(new Set(data.grnIds || []));
      for (const gid of grnIds) {
        grnMappings.push(manager.create(PurchaseInvoiceGrnMapping, { grnId: gid }));
      }

      const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];

      const invoice = manager.create(PurchaseInvoice, {
        tenantId,
        companyId,
        branchId,
        godownId: data.godownId || null,
        voucherNo,
        invoiceDate,
        purchaseType: data.purchaseType,
        vendorLedgerId: data.vendorLedgerId,
        vendorBillNo: data.vendorBillNo || '',
        vendorBillDate: data.vendorBillDate || null,
        placeOfSupplyStateCode: placeOfSupply,
        isInterstate,
        subtotal: Number(subtotal.toFixed(2)),
        discountTotal,
        taxableTotal: Number(taxableTotal.toFixed(2)),
        cgstTotal: Number(cgstTotal.toFixed(2)),
        sgstTotal: Number(sgstTotal.toFixed(2)),
        igstTotal: Number(igstTotal.toFixed(2)),
        cessTotal: Number(cessTotal.toFixed(2)),
        roundOff,
        grandTotal,
        paidAmount: 0,
        status: PurchaseInvoiceStatus.PENDING,
        notes: data.notes || '',
        createdBy: userId,
        items: invoiceItems,
        grnMappings,
      });

      const savedInvoice = await manager.save(PurchaseInvoice, invoice);

      // Post Stock IN if Direct Invoice
      if (stockMovementLines.length > 0 && data.godownId) {
        await this.inventoryService.recordStockMovement(manager, {
          tenantId,
          companyId,
          branchId,
          entryDate: invoiceDate,
          voucherType: VoucherType.PURCHASE_INVOICE,
          voucherId: savedInvoice.id,
          voucherNo,
          lines: stockMovementLines,
        });
      }

      // 4. Double-Entry Accounting Posting
      // Dr Purchase Account
      // Dr Input CGST / SGST / IGST
      // Dr/Cr Round Off
      // Cr Vendor Ledger
      const settings = await this.settingsService.getSettings(tenantId, companyId);
      const purchaseLedgerId = settings.defaultPurchaseLedgerId;

      const postingLines = [];
      // Dr Purchase
      postingLines.push({
        ledgerId: purchaseLedgerId,
        debitAmount: Number(taxableTotal.toFixed(2)),
        creditAmount: 0,
        narration: `Purchase Invoice: ${voucherNo}`,
      });

      // Dr Input Taxes
      if (cgstTotal > 0 && settings.defaultCgstInputLedgerId) {
        postingLines.push({
          ledgerId: settings.defaultCgstInputLedgerId,
          debitAmount: Number(cgstTotal.toFixed(2)),
          creditAmount: 0,
          narration: `CGST on PI #${voucherNo}`,
        });
      }
      if (sgstTotal > 0 && settings.defaultSgstInputLedgerId) {
        postingLines.push({
          ledgerId: settings.defaultSgstInputLedgerId,
          debitAmount: Number(sgstTotal.toFixed(2)),
          creditAmount: 0,
          narration: `SGST on PI #${voucherNo}`,
        });
      }
      if (igstTotal > 0 && settings.defaultIgstInputLedgerId) {
        postingLines.push({
          ledgerId: settings.defaultIgstInputLedgerId,
          debitAmount: Number(igstTotal.toFixed(2)),
          creditAmount: 0,
          narration: `IGST on PI #${voucherNo}`,
        });
      }

      // Round-off
      if (Math.abs(roundOff) > 0 && settings.defaultRoundOffLedgerId) {
        if (roundOff > 0) {
          postingLines.push({
            ledgerId: settings.defaultRoundOffLedgerId,
            debitAmount: roundOff,
            creditAmount: 0,
            narration: `Round-off PI #${voucherNo}`,
          });
        } else {
          postingLines.push({
            ledgerId: settings.defaultRoundOffLedgerId,
            debitAmount: 0,
            creditAmount: Math.abs(roundOff),
            narration: `Round-off PI #${voucherNo}`,
          });
        }
      }

      // Cr Vendor
      postingLines.push({
        ledgerId: data.vendorLedgerId,
        debitAmount: 0,
        creditAmount: grandTotal,
        narration: `Purchase Bill #${data.vendorBillNo || voucherNo}`,
      });

      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: invoiceDate,
        voucherType: VoucherType.PURCHASE_INVOICE,
        voucherId: savedInvoice.id,
        voucherNo,
        lines: postingLines,
      });

      // Update GRN Statuses
      for (const gid of grnIds) {
        const grn = await manager.findOne(GoodsReceiptNote, {
          where: { id: gid },
          relations: ['items'],
        });
        if (grn) {
          const allInvoiced = grn.items.every(
            (i) => Number(i.invoicedQty) >= Number(i.receivedQty),
          );
          const anyInvoiced = grn.items.some((i) => Number(i.invoicedQty) > 0);
          grn.status = allInvoiced
            ? GrnStatus.CLEARED
            : anyInvoiced
              ? GrnStatus.PARTIALLY_CLEARED
              : GrnStatus.PENDING;
          await manager.save(GoodsReceiptNote, grn);
        }
      }

      return savedInvoice;
    });
  }

  // ==========================================
  // 4. PURCHASE RETURN
  // ==========================================
  async getPurchaseReturns(tenantId: string, companyId: string) {
    return this.prRepo.find({
      where: { tenantId, companyId },
      relations: ['vendorLedger', 'purchaseInvoice', 'branch', 'items', 'items.item'],
      order: { returnDate: 'DESC' },
    });
  }

  async createPurchaseReturn(
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
          VoucherType.PURCHASE_RETURN,
        ));

      const returnDate = data.returnDate || new Date().toISOString().split('T')[0];

      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;

      const returnItems: PurchaseReturnItem[] = [];
      const stockMovementLines = [];

      for (const line of data.items || []) {
        const returnedQty = Number(line.returnedQty);
        const rate = Number(line.rate);
        const taxableAmount = Number((returnedQty * rate).toFixed(2));
        const cgstAmount = Number(line.cgstAmount || 0);
        const sgstAmount = Number(line.sgstAmount || 0);
        const igstAmount = Number(line.igstAmount || 0);
        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

        subtotal += taxableAmount;
        taxTotal += cgstAmount + sgstAmount + igstAmount;
        grandTotal += totalAmount;

        const prItem = manager.create(PurchaseReturnItem, {
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
        returnItems.push(prItem);

        // Stock OUT
        stockMovementLines.push({
          godownId: data.godownId,
          itemId: line.itemId,
          variantId: line.variantId,
          qtyOut: returnedQty,
          unitRate: rate,
        });
      }

      const pr = manager.create(PurchaseReturn, {
        tenantId,
        companyId,
        branchId,
        purchaseInvoiceId: data.purchaseInvoiceId,
        voucherNo,
        returnDate,
        vendorLedgerId: data.vendorLedgerId,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        reason: data.reason || 'Goods Return',
        createdBy: userId,
        items: returnItems,
      });

      const savedPr = await manager.save(PurchaseReturn, pr);

      // Post Stock OUT
      if (stockMovementLines.length > 0 && data.godownId) {
        await this.inventoryService.recordStockMovement(manager, {
          tenantId,
          companyId,
          branchId,
          entryDate: returnDate,
          voucherType: VoucherType.PURCHASE_RETURN,
          voucherId: savedPr.id,
          voucherNo,
          lines: stockMovementLines,
        });
      }

      // Reversal Accounting Entry:
      // Dr Vendor Ledger
      // Cr Purchase Account
      // Cr Input GST
      const settings = await this.settingsService.getSettings(tenantId, companyId);
      const postingLines = [
        {
          ledgerId: data.vendorLedgerId,
          debitAmount: grandTotal,
          creditAmount: 0,
          narration: `Purchase Return #${voucherNo}`,
        },
        {
          ledgerId: settings.defaultPurchaseLedgerId,
          debitAmount: 0,
          creditAmount: subtotal,
          narration: `Return credit on PR #${voucherNo}`,
        },
      ];

      if (taxTotal > 0 && settings.defaultCgstInputLedgerId) {
        postingLines.push({
          ledgerId: settings.defaultCgstInputLedgerId,
          debitAmount: 0,
          creditAmount: taxTotal,
          narration: `Tax reversal on PR #${voucherNo}`,
        });
      }

      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: returnDate,
        voucherType: VoucherType.PURCHASE_RETURN,
        voucherId: savedPr.id,
        voucherNo,
        lines: postingLines,
      });

      return savedPr;
    });
  }

  // ==========================================
  // 5. VENDOR PAYMENT
  // ==========================================
  async getVendorPayments(tenantId: string, companyId: string) {
    return this.paymentRepo.find({
      where: { tenantId, companyId },
      relations: ['vendorLedger', 'paymentModeLedger', 'branch', 'allocations'],
      order: { paymentDate: 'DESC' },
    });
  }

  async createVendorPayment(
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
          VoucherType.VENDOR_PAYMENT,
        ));

      const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
      const totalAmountPaid = Number(data.totalAmountPaid);
      const totalDiscountReceived = Number(data.totalDiscountReceived || 0);

      const allocations: VendorPaymentAllocation[] = [];
      let sumAllocated = 0;

      for (const alloc of data.allocations || []) {
        const allocatedAmount = Number(alloc.allocatedAmount);
        const discountAmount = Number(alloc.discountAmount || 0);
        sumAllocated += allocatedAmount;

        const vpa = manager.create(VendorPaymentAllocation, {
          purchaseInvoiceId: alloc.purchaseInvoiceId,
          allocatedAmount,
          discountAmount,
        });
        allocations.push(vpa);

        // Update Purchase Invoice balance and status
        const invoice = await manager.findOne(PurchaseInvoice, {
          where: { id: alloc.purchaseInvoiceId },
        });

        if (invoice) {
          invoice.paidAmount = Number(invoice.paidAmount) + allocatedAmount + discountAmount;
          if (invoice.paidAmount >= Number(invoice.grandTotal)) {
            invoice.status = PurchaseInvoiceStatus.PAID;
          } else {
            invoice.status = PurchaseInvoiceStatus.PARTIALLY_PAID;
          }
          await manager.save(PurchaseInvoice, invoice);
        }
      }

      const payment = manager.create(VendorPayment, {
        tenantId,
        companyId,
        branchId,
        voucherNo,
        paymentDate,
        vendorLedgerId: data.vendorLedgerId,
        paymentModeLedgerId: data.paymentModeLedgerId,
        totalAmountPaid,
        totalDiscountReceived,
        referenceChequeNo: data.referenceChequeNo || '',
        notes: data.notes || '',
        createdBy: userId,
        allocations,
      });

      const savedPayment = await manager.save(VendorPayment, payment);

      // Accounting Posting:
      // Dr Vendor Ledger (Total Paid + Discount)
      // Cr Cash/Bank Ledger (Total Paid)
      // Cr Discount Received Ledger (if any)
      const settings = await this.settingsService.getSettings(tenantId, companyId);
      const totalSettled = totalAmountPaid + totalDiscountReceived;

      const postingLines = [
        {
          ledgerId: data.vendorLedgerId,
          debitAmount: totalSettled,
          creditAmount: 0,
          narration: `Payment to vendor #${voucherNo}`,
        },
        {
          ledgerId: data.paymentModeLedgerId,
          debitAmount: 0,
          creditAmount: totalAmountPaid,
          narration: `Paid via ${data.referenceChequeNo || voucherNo}`,
        },
      ];

      if (totalDiscountReceived > 0 && settings.defaultDiscountLedgerId) {
        postingLines.push({
          ledgerId: settings.defaultDiscountLedgerId,
          debitAmount: 0,
          creditAmount: totalDiscountReceived,
          narration: `Cash discount on payment #${voucherNo}`,
        });
      }

      await this.accountingService.postTransaction(manager, {
        tenantId,
        companyId,
        branchId,
        entryDate: paymentDate,
        voucherType: VoucherType.VENDOR_PAYMENT,
        voucherId: savedPayment.id,
        voucherNo,
        lines: postingLines,
      });

      return savedPayment;
    });
  }
}
