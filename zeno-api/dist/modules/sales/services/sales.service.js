"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../entities/sales-order.entity");
const sales_order_item_entity_1 = require("../entities/sales-order-item.entity");
const delivery_challan_entity_1 = require("../entities/delivery-challan.entity");
const delivery_challan_item_entity_1 = require("../entities/delivery-challan-item.entity");
const delivery_challan_so_mapping_entity_1 = require("../entities/delivery-challan-so-mapping.entity");
const sales_invoice_entity_1 = require("../entities/sales-invoice.entity");
const sales_invoice_item_entity_1 = require("../entities/sales-invoice-item.entity");
const sales_invoice_dc_mapping_entity_1 = require("../entities/sales-invoice-dc-mapping.entity");
const sales_return_entity_1 = require("../entities/sales-return.entity");
const sales_return_item_entity_1 = require("../entities/sales-return-item.entity");
const customer_receipt_entity_1 = require("../entities/customer-receipt.entity");
const customer_receipt_allocation_entity_1 = require("../entities/customer-receipt-allocation.entity");
const voucher_sequence_service_1 = require("../../procure-to-pay/services/voucher-sequence.service");
const accounting_service_1 = require("../../accounting/services/accounting.service");
const inventory_service_1 = require("../../inventory/services/inventory.service");
const settings_service_1 = require("../../settings/services/settings.service");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
let SalesService = class SalesService {
    dataSource;
    soRepo;
    soItemRepo;
    dcRepo;
    dcItemRepo;
    siRepo;
    siItemRepo;
    srRepo;
    crRepo;
    sequenceService;
    accountingService;
    inventoryService;
    settingsService;
    constructor(dataSource, soRepo, soItemRepo, dcRepo, dcItemRepo, siRepo, siItemRepo, srRepo, crRepo, sequenceService, accountingService, inventoryService, settingsService) {
        this.dataSource = dataSource;
        this.soRepo = soRepo;
        this.soItemRepo = soItemRepo;
        this.dcRepo = dcRepo;
        this.dcItemRepo = dcItemRepo;
        this.siRepo = siRepo;
        this.siItemRepo = siItemRepo;
        this.srRepo = srRepo;
        this.crRepo = crRepo;
        this.sequenceService = sequenceService;
        this.accountingService = accountingService;
        this.inventoryService = inventoryService;
        this.settingsService = settingsService;
    }
    async getSalesOrders(tenantId, companyId, filters) {
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
    async getSalesOrderById(tenantId, id) {
        const so = await this.soRepo.findOne({
            where: { id, tenantId },
            relations: ['customerLedger', 'branch', 'items', 'items.item', 'items.unit', 'items.variant'],
        });
        if (!so)
            throw new common_1.BadRequestException('Sales Order not found');
        return so;
    }
    async getCustomerPendingSalesOrders(tenantId, companyId, customerLedgerId) {
        return this.soRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.items', 'items')
            .leftJoinAndSelect('items.item', 'item')
            .leftJoinAndSelect('items.unit', 'unit')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.company_id = :companyId', { companyId })
            .andWhere('so.customer_ledger_id = :customerLedgerId', { customerLedgerId })
            .andWhere('so.status IN (:...statuses)', {
            statuses: [enums_1.SalesOrderStatus.PENDING, enums_1.SalesOrderStatus.PARTIALLY_DISPATCHED],
        })
            .orderBy('so.order_date', 'ASC')
            .getMany();
    }
    async createSalesOrder(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.SALES_ORDER));
            let subtotal = 0;
            let taxTotal = 0;
            let grandTotal = 0;
            const orderItems = [];
            for (const line of data.items || []) {
                const qty = Number(line.orderedQty || line.qty || 0);
                const rate = Number(line.rate ?? line.unitPrice ?? 0);
                const discountAmount = Number(line.discountAmount || 0);
                const taxableAmount = Number((qty * rate - discountAmount).toFixed(2));
                const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);
                let unitId = line.unitId;
                if (!unitId && line.itemId) {
                    const itemRec = await manager.findOne(item_entity_1.Item, { where: { id: line.itemId } });
                    unitId = itemRec?.unitId;
                }
                let cgstAmount = 0;
                let sgstAmount = 0;
                let igstAmount = 0;
                if (line.isInterstate) {
                    igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
                }
                else {
                    cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                    sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                }
                const lineTotal = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));
                subtotal += taxableAmount;
                taxTotal += cgstAmount + sgstAmount + igstAmount;
                grandTotal += lineTotal;
                const soItem = manager.create(sales_order_item_entity_1.SalesOrderItem, {
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    unitId: unitId,
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
            const so = manager.create(sales_order_entity_1.SalesOrder, {
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
                status: enums_1.SalesOrderStatus.PENDING,
                notes: data.notes || '',
                createdBy: userId,
                items: orderItems,
            });
            return manager.save(sales_order_entity_1.SalesOrder, so);
        });
    }
    async cancelSalesOrder(tenantId, id) {
        const so = await this.soRepo.findOne({
            where: { id, tenantId },
            relations: ['items'],
        });
        if (!so)
            throw new common_1.BadRequestException('Sales Order not found');
        const hasDispatched = so.items.some((it) => Number(it.dispatchedQty) > 0);
        if (hasDispatched) {
            throw new common_1.BadRequestException('Cannot cancel Sales Order with dispatched quantities');
        }
        so.status = enums_1.SalesOrderStatus.CANCELLED;
        return this.soRepo.save(so);
    }
    async getDeliveryChallans(tenantId, companyId, filters) {
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
    async getDeliveryChallanById(tenantId, id) {
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
        if (!dc)
            throw new common_1.BadRequestException('Delivery Challan not found');
        return dc;
    }
    async getCustomerPendingChallans(tenantId, companyId, customerLedgerId) {
        return this.dcRepo
            .createQueryBuilder('dc')
            .leftJoinAndSelect('dc.items', 'items')
            .leftJoinAndSelect('items.item', 'item')
            .leftJoinAndSelect('items.unit', 'unit')
            .where('dc.tenant_id = :tenantId', { tenantId })
            .andWhere('dc.company_id = :companyId', { companyId })
            .andWhere('dc.customer_ledger_id = :customerLedgerId', { customerLedgerId })
            .andWhere('dc.status IN (:...statuses)', {
            statuses: [enums_1.DeliveryChallanStatus.PENDING, enums_1.DeliveryChallanStatus.PARTIALLY_INVOICED],
        })
            .orderBy('dc.challan_date', 'ASC')
            .getMany();
    }
    async createDeliveryChallan(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.DELIVERY_CHALLAN));
            const challanDate = data.challanDate || new Date().toISOString().split('T')[0];
            const godownId = data.godownId;
            let subtotal = 0;
            let taxTotal = 0;
            let grandTotal = 0;
            const challanItems = [];
            const stockMovementLines = [];
            const affectedSoItemIds = [];
            for (const line of data.items || []) {
                const qty = Number(line.dispatchedQty || line.qty || 0);
                const rate = Number(line.rate ?? line.unitPrice ?? 0);
                const discountAmount = Number(line.discountAmount || 0);
                const taxableAmount = Number((qty * rate - discountAmount).toFixed(2));
                const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);
                let unitId = line.unitId;
                if (!unitId && line.itemId) {
                    const itemRec = await manager.findOne(item_entity_1.Item, { where: { id: line.itemId } });
                    unitId = itemRec?.unitId;
                }
                let cgstAmount = 0;
                let sgstAmount = 0;
                let igstAmount = 0;
                if (line.isInterstate) {
                    igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
                }
                else {
                    cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                    sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                }
                const lineTotal = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));
                subtotal += taxableAmount;
                taxTotal += cgstAmount + sgstAmount + igstAmount;
                grandTotal += lineTotal;
                const dcItem = manager.create(delivery_challan_item_entity_1.DeliveryChallanItem, {
                    salesOrderItemId: line.salesOrderItemId || line.soItemId || null,
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    unitId: unitId,
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
            const dc = manager.create(delivery_challan_entity_1.DeliveryChallan, {
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
                status: enums_1.DeliveryChallanStatus.PENDING,
                notes: data.notes || '',
                createdBy: userId,
                items: challanItems,
            });
            const savedDc = await manager.save(delivery_challan_entity_1.DeliveryChallan, dc);
            if (data.salesOrderIds && data.salesOrderIds.length > 0) {
                const mappings = data.salesOrderIds.map((soId) => manager.create(delivery_challan_so_mapping_entity_1.DeliveryChallanSoMapping, {
                    deliveryChallanId: savedDc.id,
                    salesOrderId: soId,
                }));
                await manager.save(delivery_challan_so_mapping_entity_1.DeliveryChallanSoMapping, mappings);
            }
            await this.inventoryService.recordStockMovement(manager, {
                tenantId,
                companyId,
                branchId,
                entryDate: challanDate,
                voucherType: enums_1.VoucherType.DELIVERY_CHALLAN,
                voucherId: savedDc.id,
                voucherNo,
                lines: stockMovementLines,
            });
            for (const line of data.items || []) {
                if (line.salesOrderItemId) {
                    await manager.increment(sales_order_item_entity_1.SalesOrderItem, { id: line.salesOrderItemId }, 'dispatchedQty', Number(line.dispatchedQty));
                }
            }
            if (data.salesOrderIds && data.salesOrderIds.length > 0) {
                for (const soId of data.salesOrderIds) {
                    const so = await manager.findOne(sales_order_entity_1.SalesOrder, {
                        where: { id: soId },
                        relations: ['items'],
                    });
                    if (so) {
                        const allCleared = so.items.every((it) => Number(it.dispatchedQty) >= Number(it.orderedQty));
                        const someDispatched = so.items.some((it) => Number(it.dispatchedQty) > 0);
                        so.status = allCleared
                            ? enums_1.SalesOrderStatus.CLEARED
                            : someDispatched
                                ? enums_1.SalesOrderStatus.PARTIALLY_DISPATCHED
                                : enums_1.SalesOrderStatus.PENDING;
                        await manager.save(sales_order_entity_1.SalesOrder, so);
                    }
                }
            }
            return savedDc;
        });
    }
    async getSalesInvoices(tenantId, companyId, filters) {
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
    async getSalesInvoiceById(tenantId, id) {
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
        if (!si)
            throw new common_1.BadRequestException('Sales Invoice not found');
        return si;
    }
    async getCustomerPendingInvoices(tenantId, companyId, customerLedgerId) {
        return this.siRepo
            .createQueryBuilder('si')
            .where('si.tenant_id = :tenantId', { tenantId })
            .andWhere('si.company_id = :companyId', { companyId })
            .andWhere('si.customer_ledger_id = :customerLedgerId', { customerLedgerId })
            .andWhere('si.status IN (:...statuses)', {
            statuses: [enums_1.SalesInvoiceStatus.PENDING, enums_1.SalesInvoiceStatus.PARTIALLY_PAID],
        })
            .orderBy('si.invoice_date', 'ASC')
            .getMany();
    }
    async createSalesInvoice(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.SALES_INVOICE));
            const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
            let taxableTotal = 0;
            let cgstTotal = 0;
            let sgstTotal = 0;
            let igstTotal = 0;
            let discountTotal = Number(data.discountTotal || 0);
            let grandTotal = 0;
            const invoiceItems = [];
            const directStockLines = [];
            for (const line of data.items || []) {
                const qty = Number(line.billedQty || line.qty || 0);
                const rate = Number(line.rate ?? line.unitPrice ?? 0);
                const lineDiscount = Number(line.discountAmount || 0);
                const taxableAmount = Number((qty * rate - lineDiscount).toFixed(2));
                const gstRate = Number(line.gstRate ?? line.taxRate ?? 0);
                let unitId = line.unitId;
                if (!unitId && line.itemId) {
                    const itemRec = await manager.findOne(item_entity_1.Item, { where: { id: line.itemId } });
                    unitId = itemRec?.unitId;
                }
                let cgstAmount = 0;
                let sgstAmount = 0;
                let igstAmount = 0;
                if (line.isInterstate) {
                    igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
                }
                else {
                    cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                    sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                }
                const lineTotal = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));
                taxableTotal += taxableAmount;
                cgstTotal += cgstAmount;
                sgstTotal += sgstAmount;
                igstTotal += igstAmount;
                grandTotal += lineTotal;
                const siItem = manager.create(sales_invoice_item_entity_1.SalesInvoiceItem, {
                    deliveryChallanItemId: line.deliveryChallanItemId || line.dcItemId || null,
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    unitId: unitId,
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
            const unrounded = grandTotal - discountTotal;
            const roundedGrandTotal = Math.round(unrounded);
            const roundOffTotal = Number((roundedGrandTotal - unrounded).toFixed(2));
            grandTotal = roundedGrandTotal;
            const si = manager.create(sales_invoice_entity_1.SalesInvoice, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                invoiceDate,
                salesType: data.salesType || enums_1.PurchaseType.GOODS,
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
                status: enums_1.SalesInvoiceStatus.PENDING,
                notes: data.notes || '',
                createdBy: userId,
                items: invoiceItems,
            });
            const savedSi = await manager.save(sales_invoice_entity_1.SalesInvoice, si);
            if (data.deliveryChallanIds && data.deliveryChallanIds.length > 0) {
                const mappings = data.deliveryChallanIds.map((dcId) => manager.create(sales_invoice_dc_mapping_entity_1.SalesInvoiceDcMapping, {
                    salesInvoiceId: savedSi.id,
                    deliveryChallanId: dcId,
                }));
                await manager.save(sales_invoice_dc_mapping_entity_1.SalesInvoiceDcMapping, mappings);
                for (const line of data.items || []) {
                    if (line.deliveryChallanItemId) {
                        await manager.increment(delivery_challan_item_entity_1.DeliveryChallanItem, { id: line.deliveryChallanItemId }, 'invoicedQty', Number(line.billedQty));
                    }
                }
                for (const dcId of data.deliveryChallanIds) {
                    const dc = await manager.findOne(delivery_challan_entity_1.DeliveryChallan, {
                        where: { id: dcId },
                        relations: ['items'],
                    });
                    if (dc) {
                        const allInvoiced = dc.items.every((it) => Number(it.invoicedQty) >= Number(it.dispatchedQty));
                        dc.status = allInvoiced
                            ? enums_1.DeliveryChallanStatus.CLEARED
                            : enums_1.DeliveryChallanStatus.PARTIALLY_INVOICED;
                        await manager.save(delivery_challan_entity_1.DeliveryChallan, dc);
                    }
                }
            }
            if (directStockLines.length > 0 && data.godownId) {
                await this.inventoryService.recordStockMovement(manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: invoiceDate,
                    voucherType: enums_1.VoucherType.SALES_INVOICE,
                    voucherId: savedSi.id,
                    voucherNo,
                    lines: directStockLines,
                });
            }
            const settings = await this.settingsService.getSettings(tenantId, companyId);
            const salesLedgerId = settings?.defaultSalesLedgerId;
            const cgstOutputId = settings?.defaultCgstOutputLedgerId;
            const sgstOutputId = settings?.defaultSgstOutputLedgerId;
            const igstOutputId = settings?.defaultIgstOutputLedgerId;
            const roundOffId = settings?.defaultRoundOffLedgerId;
            const fallbackSales = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Sales Account' },
            });
            const fallbackCgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output CGST' },
            });
            const fallbackSgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output SGST' },
            });
            const fallbackIgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output IGST' },
            });
            const fallbackRoundOff = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Round Off' },
            });
            const effectiveSalesId = salesLedgerId || fallbackSales?.id;
            const effectiveCgstId = cgstOutputId || fallbackCgstOut?.id;
            const effectiveSgstId = sgstOutputId || fallbackSgstOut?.id;
            const effectiveIgstId = igstOutputId || fallbackIgstOut?.id;
            const effectiveRoundOffId = roundOffId || fallbackRoundOff?.id;
            if (!effectiveSalesId) {
                throw new common_1.BadRequestException('Sales Ledger is not mapped in settings or masters');
            }
            const journalLines = [];
            journalLines.push({
                ledgerId: data.customerLedgerId,
                debitAmount: grandTotal,
                creditAmount: 0,
                narration: `Tax Invoice ${voucherNo}`,
            });
            journalLines.push({
                ledgerId: effectiveSalesId,
                debitAmount: 0,
                creditAmount: Number(taxableTotal.toFixed(2)),
                narration: `Sales revenue for ${voucherNo}`,
            });
            if (cgstTotal > 0 && effectiveCgstId) {
                journalLines.push({
                    ledgerId: effectiveCgstId,
                    debitAmount: 0,
                    creditAmount: Number(cgstTotal.toFixed(2)),
                    narration: `Output CGST for ${voucherNo}`,
                });
            }
            if (sgstTotal > 0 && effectiveSgstId) {
                journalLines.push({
                    ledgerId: effectiveSgstId,
                    debitAmount: 0,
                    creditAmount: Number(sgstTotal.toFixed(2)),
                    narration: `Output SGST for ${voucherNo}`,
                });
            }
            if (igstTotal > 0 && effectiveIgstId) {
                journalLines.push({
                    ledgerId: effectiveIgstId,
                    debitAmount: 0,
                    creditAmount: Number(igstTotal.toFixed(2)),
                    narration: `Output IGST for ${voucherNo}`,
                });
            }
            if (roundOffTotal !== 0 && effectiveRoundOffId) {
                if (roundOffTotal > 0) {
                    journalLines.push({
                        ledgerId: effectiveRoundOffId,
                        debitAmount: 0,
                        creditAmount: Math.abs(roundOffTotal),
                        narration: 'Round off fractional paise',
                    });
                }
                else {
                    journalLines.push({
                        ledgerId: effectiveRoundOffId,
                        debitAmount: Math.abs(roundOffTotal),
                        creditAmount: 0,
                        narration: 'Round off fractional paise',
                    });
                }
            }
            await this.accountingService.postTransaction(manager, {
                tenantId,
                companyId,
                branchId,
                entryDate: invoiceDate,
                voucherType: enums_1.VoucherType.SALES_INVOICE,
                voucherId: savedSi.id,
                voucherNo,
                lines: journalLines,
            });
            return savedSi;
        });
    }
    async getSalesReturns(tenantId, companyId) {
        return this.srRepo.find({
            where: { tenantId, companyId },
            relations: ['customerLedger', 'salesInvoice', 'branch', 'items', 'items.item'],
            order: { returnDate: 'DESC' },
        });
    }
    async createSalesReturn(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.SALES_RETURN));
            const returnDate = data.returnDate || new Date().toISOString().split('T')[0];
            let subtotal = 0;
            let taxTotal = 0;
            let grandTotal = 0;
            const returnItems = [];
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
                    }
                    else {
                        cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                        sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                    }
                }
                const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
                subtotal += taxableAmount;
                taxTotal += cgstAmount + sgstAmount + igstAmount;
                grandTotal += totalAmount;
                const effectiveGodownId = line.godownId || data.godownId;
                const srItem = manager.create(sales_return_item_entity_1.SalesReturnItem, {
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
            const sr = manager.create(sales_return_entity_1.SalesReturn, {
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
            const savedSr = await manager.save(sales_return_entity_1.SalesReturn, sr);
            if (stockMovementLines.length > 0 && data.godownId) {
                await this.inventoryService.recordStockMovement(manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: returnDate,
                    voucherType: enums_1.VoucherType.SALES_RETURN,
                    voucherId: savedSr.id,
                    voucherNo,
                    lines: stockMovementLines,
                });
            }
            const settings = await this.settingsService.getSettings(tenantId, companyId);
            const fallbackSales = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Sales Account' },
            });
            const fallbackCgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output CGST' },
            });
            const fallbackSgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output SGST' },
            });
            const fallbackIgstOut = await manager.findOne(ledger_entity_1.Ledger, {
                where: { tenantId, companyId, name: 'Output IGST' },
            });
            const effectiveSalesId = settings?.defaultSalesLedgerId || fallbackSales?.id;
            const effectiveCgstId = settings?.defaultCgstOutputLedgerId || fallbackCgstOut?.id;
            const effectiveSgstId = settings?.defaultSgstOutputLedgerId || fallbackSgstOut?.id;
            const effectiveIgstId = settings?.defaultIgstOutputLedgerId || fallbackIgstOut?.id;
            const reversalLines = [];
            reversalLines.push({
                ledgerId: effectiveSalesId,
                debitAmount: Number(subtotal.toFixed(2)),
                creditAmount: 0,
                narration: `Sales Return Credit Note ${voucherNo}`,
            });
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
                voucherType: enums_1.VoucherType.SALES_RETURN,
                voucherId: savedSr.id,
                voucherNo,
                lines: reversalLines,
            });
            return savedSr;
        });
    }
    async getCustomerReceipts(tenantId, companyId) {
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
    async createCustomerReceipt(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.CUSTOMER_RECEIPT));
            const receiptDate = data.receiptDate || new Date().toISOString().split('T')[0];
            const totalAmount = Number(data.amount || data.totalAmount || 0);
            const allocations = [];
            let sumAllocated = 0;
            for (const alloc of data.allocations || []) {
                const allocAmount = Number(alloc.allocatedAmount);
                sumAllocated += allocAmount;
                const crAlloc = manager.create(customer_receipt_allocation_entity_1.CustomerReceiptAllocation, {
                    salesInvoiceId: alloc.salesInvoiceId,
                    allocatedAmount: allocAmount,
                });
                allocations.push(crAlloc);
                await manager.increment(sales_invoice_entity_1.SalesInvoice, { id: alloc.salesInvoiceId }, 'paidAmount', allocAmount);
                const inv = await manager.findOne(sales_invoice_entity_1.SalesInvoice, {
                    where: { id: alloc.salesInvoiceId },
                });
                if (inv) {
                    const isFullyPaid = Number(inv.paidAmount) >= Number(inv.grandTotal);
                    inv.status = isFullyPaid
                        ? enums_1.SalesInvoiceStatus.PAID
                        : enums_1.SalesInvoiceStatus.PARTIALLY_PAID;
                    await manager.save(sales_invoice_entity_1.SalesInvoice, inv);
                }
            }
            const receipt = manager.create(customer_receipt_entity_1.CustomerReceipt, {
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
            const savedReceipt = await manager.save(customer_receipt_entity_1.CustomerReceipt, receipt);
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
                voucherType: enums_1.VoucherType.CUSTOMER_RECEIPT,
                voucherId: savedReceipt.id,
                voucherNo,
                lines: journalLines,
            });
            return savedReceipt;
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_item_entity_1.SalesOrderItem)),
    __param(3, (0, typeorm_1.InjectRepository)(delivery_challan_entity_1.DeliveryChallan)),
    __param(4, (0, typeorm_1.InjectRepository)(delivery_challan_item_entity_1.DeliveryChallanItem)),
    __param(5, (0, typeorm_1.InjectRepository)(sales_invoice_entity_1.SalesInvoice)),
    __param(6, (0, typeorm_1.InjectRepository)(sales_invoice_item_entity_1.SalesInvoiceItem)),
    __param(7, (0, typeorm_1.InjectRepository)(sales_return_entity_1.SalesReturn)),
    __param(8, (0, typeorm_1.InjectRepository)(customer_receipt_entity_1.CustomerReceipt)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        voucher_sequence_service_1.VoucherSequenceService,
        accounting_service_1.AccountingService,
        inventory_service_1.InventoryService,
        settings_service_1.SettingsService])
], SalesService);
//# sourceMappingURL=sales.service.js.map