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
exports.ProcureToPayService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const purchase_order_entity_1 = require("../entities/purchase-order.entity");
const purchase_order_item_entity_1 = require("../entities/purchase-order-item.entity");
const goods_receipt_note_entity_1 = require("../entities/goods-receipt-note.entity");
const grn_item_entity_1 = require("../entities/grn-item.entity");
const grn_po_mapping_entity_1 = require("../entities/grn-po-mapping.entity");
const purchase_invoice_entity_1 = require("../entities/purchase-invoice.entity");
const purchase_invoice_item_entity_1 = require("../entities/purchase-invoice-item.entity");
const purchase_invoice_grn_mapping_entity_1 = require("../entities/purchase-invoice-grn-mapping.entity");
const purchase_return_entity_1 = require("../entities/purchase-return.entity");
const purchase_return_item_entity_1 = require("../entities/purchase-return-item.entity");
const vendor_payment_entity_1 = require("../entities/vendor-payment.entity");
const vendor_payment_allocation_entity_1 = require("../entities/vendor-payment-allocation.entity");
const voucher_sequence_service_1 = require("./voucher-sequence.service");
const accounting_service_1 = require("../../accounting/services/accounting.service");
const inventory_service_1 = require("../../inventory/services/inventory.service");
const settings_service_1 = require("../../settings/services/settings.service");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const enums_1 = require("../../../common/enums");
let ProcureToPayService = class ProcureToPayService {
    dataSource;
    sequenceService;
    accountingService;
    inventoryService;
    settingsService;
    poRepo;
    grnRepo;
    piRepo;
    prRepo;
    paymentRepo;
    constructor(dataSource, sequenceService, accountingService, inventoryService, settingsService, poRepo, grnRepo, piRepo, prRepo, paymentRepo) {
        this.dataSource = dataSource;
        this.sequenceService = sequenceService;
        this.accountingService = accountingService;
        this.inventoryService = inventoryService;
        this.settingsService = settingsService;
        this.poRepo = poRepo;
        this.grnRepo = grnRepo;
        this.piRepo = piRepo;
        this.prRepo = prRepo;
        this.paymentRepo = paymentRepo;
    }
    async getPurchaseOrders(tenantId, companyId, filters) {
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
    async getPurchaseOrderById(tenantId, id) {
        const po = await this.poRepo.findOne({
            where: { id, tenantId },
            relations: ['vendorLedger', 'branch', 'items', 'items.item', 'items.unit', 'items.variant'],
        });
        if (!po)
            throw new common_1.BadRequestException('Purchase Order not found');
        return po;
    }
    async getVendorPendingPurchaseOrders(tenantId, companyId, vendorLedgerId) {
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
            statuses: [enums_1.PurchaseOrderStatus.PENDING, enums_1.PurchaseOrderStatus.PARTIALLY_CLEARED],
        })
            .orderBy('po.order_date', 'ASC')
            .getMany();
    }
    async createPurchaseOrder(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.PURCHASE_ORDER));
            let subtotal = 0;
            let taxTotal = 0;
            let grandTotal = 0;
            const items = [];
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
                    }
                    else {
                        cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                        sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
                    }
                }
                const cessAmount = Number(line.cessAmount || 0);
                const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;
                subtotal += taxableAmount;
                taxTotal += cgstAmount + sgstAmount + igstAmount + cessAmount;
                grandTotal += totalAmount;
                const poItem = manager.create(purchase_order_item_entity_1.PurchaseOrderItem, {
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
            const po = manager.create(purchase_order_entity_1.PurchaseOrder, {
                tenantId,
                companyId,
                branchId,
                voucherNo,
                orderDate: data.orderDate || new Date().toISOString().split('T')[0],
                vendorLedgerId: data.vendorLedgerId,
                status: enums_1.PurchaseOrderStatus.PENDING,
                subtotal: Number(subtotal.toFixed(2)),
                taxTotal: Number(taxTotal.toFixed(2)),
                grandTotal: Number(grandTotal.toFixed(2)),
                notes: data.notes || '',
                createdBy: userId,
                items,
            });
            return await manager.save(purchase_order_entity_1.PurchaseOrder, po);
        });
    }
    async cancelPurchaseOrder(tenantId, id) {
        return this.dataSource.transaction(async (manager) => {
            const po = await manager.findOne(purchase_order_entity_1.PurchaseOrder, { where: { id, tenantId } });
            if (!po)
                throw new common_1.BadRequestException('Purchase Order not found');
            const grnLinks = await manager.count(grn_po_mapping_entity_1.GrnPoMapping, { where: { purchaseOrderId: id } });
            if (grnLinks > 0) {
                throw new common_1.BadRequestException('Cannot cancel Purchase Order: It is already linked to a GRN');
            }
            po.status = enums_1.PurchaseOrderStatus.CANCELLED;
            return manager.save(purchase_order_entity_1.PurchaseOrder, po);
        });
    }
    async getGoodsReceiptNotes(tenantId, companyId, filters) {
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
    async getGoodsReceiptNoteById(tenantId, id) {
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
        if (!grn)
            throw new common_1.BadRequestException('GRN not found');
        return grn;
    }
    async getVendorPendingGrns(tenantId, companyId, vendorLedgerId) {
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
            statuses: [enums_1.GrnStatus.PENDING, enums_1.GrnStatus.PARTIALLY_CLEARED],
        })
            .orderBy('grn.grn_date', 'ASC')
            .getMany();
    }
    async createGoodsReceiptNote(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.GOODS_RECEIPT_NOTE));
            const grnDate = data.grnDate || new Date().toISOString().split('T')[0];
            const godownId = data.godownId;
            const grnItems = [];
            const stockMovementLines = [];
            for (const line of data.items || []) {
                const receivedQty = Number(line.receivedQty);
                const rate = Number(line.rate);
                const totalAmount = Number((receivedQty * rate).toFixed(2));
                const grnItem = manager.create(grn_item_entity_1.GrnItem, {
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
                if (line.poItemId) {
                    const poItem = await manager.findOne(purchase_order_item_entity_1.PurchaseOrderItem, {
                        where: { id: line.poItemId },
                    });
                    if (poItem) {
                        poItem.receivedQty = Number(poItem.receivedQty) + receivedQty;
                        await manager.save(purchase_order_item_entity_1.PurchaseOrderItem, poItem);
                    }
                }
                stockMovementLines.push({
                    godownId: line.godownId || godownId,
                    rackBinId: line.rackBinId,
                    itemId: line.itemId,
                    variantId: line.variantId,
                    qtyIn: receivedQty,
                    unitRate: rate,
                });
            }
            const poMappings = [];
            const poIds = Array.from(new Set(data.purchaseOrderIds || []));
            for (const poId of poIds) {
                poMappings.push(manager.create(grn_po_mapping_entity_1.GrnPoMapping, { purchaseOrderId: poId }));
            }
            const grn = manager.create(goods_receipt_note_entity_1.GoodsReceiptNote, {
                tenantId,
                companyId,
                branchId,
                godownId,
                voucherNo,
                grnDate,
                vendorLedgerId: data.vendorLedgerId,
                status: enums_1.GrnStatus.PENDING,
                notes: data.notes || '',
                createdBy: userId,
                items: grnItems,
                poMappings,
            });
            const savedGrn = await manager.save(goods_receipt_note_entity_1.GoodsReceiptNote, grn);
            await this.inventoryService.recordStockMovement(manager, {
                tenantId,
                companyId,
                branchId,
                entryDate: grnDate,
                voucherType: enums_1.VoucherType.GOODS_RECEIPT_NOTE,
                voucherId: savedGrn.id,
                voucherNo,
                lines: stockMovementLines,
            });
            for (const poId of poIds) {
                const po = await manager.findOne(purchase_order_entity_1.PurchaseOrder, {
                    where: { id: poId },
                    relations: ['items'],
                });
                if (po) {
                    const allCleared = po.items.every((i) => Number(i.receivedQty) >= Number(i.orderedQty));
                    const anyReceived = po.items.some((i) => Number(i.receivedQty) > 0);
                    po.status = allCleared
                        ? enums_1.PurchaseOrderStatus.CLEARED
                        : anyReceived
                            ? enums_1.PurchaseOrderStatus.PARTIALLY_CLEARED
                            : enums_1.PurchaseOrderStatus.PENDING;
                    await manager.save(purchase_order_entity_1.PurchaseOrder, po);
                }
            }
            return savedGrn;
        });
    }
    async getPurchaseInvoices(tenantId, companyId, filters) {
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
    async getPurchaseInvoiceById(tenantId, id) {
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
        if (!pi)
            throw new common_1.BadRequestException('Purchase Invoice not found');
        return pi;
    }
    async getVendorPendingInvoices(tenantId, companyId, vendorLedgerId) {
        return this.piRepo
            .createQueryBuilder('pi')
            .where('pi.tenant_id = :tenantId', { tenantId })
            .andWhere('pi.company_id = :companyId', { companyId })
            .andWhere('pi.vendor_ledger_id = :vendorLedgerId', { vendorLedgerId })
            .andWhere('pi.status IN (:...statuses)', {
            statuses: [enums_1.PurchaseInvoiceStatus.PENDING, enums_1.PurchaseInvoiceStatus.PARTIALLY_PAID],
        })
            .orderBy('pi.invoice_date', 'ASC')
            .getMany();
    }
    async createPurchaseInvoice(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.PURCHASE_INVOICE));
            const branch = await manager.findOne(branch_entity_1.Branch, { where: { id: branchId } });
            const vendorLedger = await manager.findOne(ledger_entity_1.Ledger, {
                where: { id: data.vendorLedgerId },
            });
            const branchState = branch?.stateCode || '27';
            const placeOfSupply = data.placeOfSupplyStateCode || vendorLedger?.stateCode || branchState;
            const isInterstate = branchState !== placeOfSupply;
            const isGrnEnabled = await this.settingsService.isFeatureEnabled(tenantId, companyId, enums_1.FeatureKey.GRN);
            let subtotal = 0;
            let discountTotal = Number(data.discountTotal || 0);
            let taxableTotal = 0;
            let cgstTotal = 0;
            let sgstTotal = 0;
            let igstTotal = 0;
            let cessTotal = 0;
            const invoiceItems = [];
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
                    }
                    else {
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
                const invItem = manager.create(purchase_invoice_item_entity_1.PurchaseInvoiceItem, {
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
                if (line.grnItemId) {
                    const grnItem = await manager.findOne(grn_item_entity_1.GrnItem, { where: { id: line.grnItemId } });
                    if (grnItem) {
                        grnItem.invoicedQty = Number(grnItem.invoicedQty) + receivedQty;
                        await manager.save(grn_item_entity_1.GrnItem, grnItem);
                    }
                }
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
            const rawGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal + cessTotal;
            const roundedTotal = Math.round(rawGrandTotal);
            const roundOff = Number((roundedTotal - rawGrandTotal).toFixed(2));
            const grandTotal = roundedTotal;
            const grnMappings = [];
            const grnIds = Array.from(new Set(data.grnIds || []));
            for (const gid of grnIds) {
                grnMappings.push(manager.create(purchase_invoice_grn_mapping_entity_1.PurchaseInvoiceGrnMapping, { grnId: gid }));
            }
            const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
            const invoice = manager.create(purchase_invoice_entity_1.PurchaseInvoice, {
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
                status: enums_1.PurchaseInvoiceStatus.PENDING,
                notes: data.notes || '',
                createdBy: userId,
                items: invoiceItems,
                grnMappings,
            });
            const savedInvoice = await manager.save(purchase_invoice_entity_1.PurchaseInvoice, invoice);
            if (stockMovementLines.length > 0 && data.godownId) {
                await this.inventoryService.recordStockMovement(manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: invoiceDate,
                    voucherType: enums_1.VoucherType.PURCHASE_INVOICE,
                    voucherId: savedInvoice.id,
                    voucherNo,
                    lines: stockMovementLines,
                });
            }
            const settings = await this.settingsService.getSettings(tenantId, companyId);
            const purchaseLedgerId = settings.defaultPurchaseLedgerId;
            const postingLines = [];
            postingLines.push({
                ledgerId: purchaseLedgerId,
                debitAmount: Number(taxableTotal.toFixed(2)),
                creditAmount: 0,
                narration: `Purchase Invoice: ${voucherNo}`,
            });
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
            if (Math.abs(roundOff) > 0 && settings.defaultRoundOffLedgerId) {
                if (roundOff > 0) {
                    postingLines.push({
                        ledgerId: settings.defaultRoundOffLedgerId,
                        debitAmount: roundOff,
                        creditAmount: 0,
                        narration: `Round-off PI #${voucherNo}`,
                    });
                }
                else {
                    postingLines.push({
                        ledgerId: settings.defaultRoundOffLedgerId,
                        debitAmount: 0,
                        creditAmount: Math.abs(roundOff),
                        narration: `Round-off PI #${voucherNo}`,
                    });
                }
            }
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
                voucherType: enums_1.VoucherType.PURCHASE_INVOICE,
                voucherId: savedInvoice.id,
                voucherNo,
                lines: postingLines,
            });
            for (const gid of grnIds) {
                const grn = await manager.findOne(goods_receipt_note_entity_1.GoodsReceiptNote, {
                    where: { id: gid },
                    relations: ['items'],
                });
                if (grn) {
                    const allInvoiced = grn.items.every((i) => Number(i.invoicedQty) >= Number(i.receivedQty));
                    const anyInvoiced = grn.items.some((i) => Number(i.invoicedQty) > 0);
                    grn.status = allInvoiced
                        ? enums_1.GrnStatus.CLEARED
                        : anyInvoiced
                            ? enums_1.GrnStatus.PARTIALLY_CLEARED
                            : enums_1.GrnStatus.PENDING;
                    await manager.save(goods_receipt_note_entity_1.GoodsReceiptNote, grn);
                }
            }
            return savedInvoice;
        });
    }
    async getPurchaseReturns(tenantId, companyId) {
        return this.prRepo.find({
            where: { tenantId, companyId },
            relations: ['vendorLedger', 'purchaseInvoice', 'branch', 'items', 'items.item'],
            order: { returnDate: 'DESC' },
        });
    }
    async createPurchaseReturn(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.PURCHASE_RETURN));
            const returnDate = data.returnDate || new Date().toISOString().split('T')[0];
            let subtotal = 0;
            let taxTotal = 0;
            let grandTotal = 0;
            const returnItems = [];
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
                const prItem = manager.create(purchase_return_item_entity_1.PurchaseReturnItem, {
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
                stockMovementLines.push({
                    godownId: data.godownId,
                    itemId: line.itemId,
                    variantId: line.variantId,
                    qtyOut: returnedQty,
                    unitRate: rate,
                });
            }
            const pr = manager.create(purchase_return_entity_1.PurchaseReturn, {
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
            const savedPr = await manager.save(purchase_return_entity_1.PurchaseReturn, pr);
            if (stockMovementLines.length > 0 && data.godownId) {
                await this.inventoryService.recordStockMovement(manager, {
                    tenantId,
                    companyId,
                    branchId,
                    entryDate: returnDate,
                    voucherType: enums_1.VoucherType.PURCHASE_RETURN,
                    voucherId: savedPr.id,
                    voucherNo,
                    lines: stockMovementLines,
                });
            }
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
                voucherType: enums_1.VoucherType.PURCHASE_RETURN,
                voucherId: savedPr.id,
                voucherNo,
                lines: postingLines,
            });
            return savedPr;
        });
    }
    async getVendorPayments(tenantId, companyId) {
        return this.paymentRepo.find({
            where: { tenantId, companyId },
            relations: ['vendorLedger', 'paymentModeLedger', 'branch', 'allocations'],
            order: { paymentDate: 'DESC' },
        });
    }
    async createVendorPayment(tenantId, companyId, branchId, userId, data) {
        return this.dataSource.transaction(async (manager) => {
            const voucherNo = data.voucherNo ||
                (await this.sequenceService.getNextVoucherNumber(manager, tenantId, companyId, branchId, enums_1.VoucherType.VENDOR_PAYMENT));
            const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
            const totalAmountPaid = Number(data.totalAmountPaid);
            const totalDiscountReceived = Number(data.totalDiscountReceived || 0);
            const allocations = [];
            let sumAllocated = 0;
            for (const alloc of data.allocations || []) {
                const allocatedAmount = Number(alloc.allocatedAmount);
                const discountAmount = Number(alloc.discountAmount || 0);
                sumAllocated += allocatedAmount;
                const vpa = manager.create(vendor_payment_allocation_entity_1.VendorPaymentAllocation, {
                    purchaseInvoiceId: alloc.purchaseInvoiceId,
                    allocatedAmount,
                    discountAmount,
                });
                allocations.push(vpa);
                const invoice = await manager.findOne(purchase_invoice_entity_1.PurchaseInvoice, {
                    where: { id: alloc.purchaseInvoiceId },
                });
                if (invoice) {
                    invoice.paidAmount = Number(invoice.paidAmount) + allocatedAmount + discountAmount;
                    if (invoice.paidAmount >= Number(invoice.grandTotal)) {
                        invoice.status = enums_1.PurchaseInvoiceStatus.PAID;
                    }
                    else {
                        invoice.status = enums_1.PurchaseInvoiceStatus.PARTIALLY_PAID;
                    }
                    await manager.save(purchase_invoice_entity_1.PurchaseInvoice, invoice);
                }
            }
            const payment = manager.create(vendor_payment_entity_1.VendorPayment, {
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
            const savedPayment = await manager.save(vendor_payment_entity_1.VendorPayment, payment);
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
                voucherType: enums_1.VoucherType.VENDOR_PAYMENT,
                voucherId: savedPayment.id,
                voucherNo,
                lines: postingLines,
            });
            return savedPayment;
        });
    }
};
exports.ProcureToPayService = ProcureToPayService;
exports.ProcureToPayService = ProcureToPayService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_2.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(6, (0, typeorm_2.InjectRepository)(goods_receipt_note_entity_1.GoodsReceiptNote)),
    __param(7, (0, typeorm_2.InjectRepository)(purchase_invoice_entity_1.PurchaseInvoice)),
    __param(8, (0, typeorm_2.InjectRepository)(purchase_return_entity_1.PurchaseReturn)),
    __param(9, (0, typeorm_2.InjectRepository)(vendor_payment_entity_1.VendorPayment)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        voucher_sequence_service_1.VoucherSequenceService,
        accounting_service_1.AccountingService,
        inventory_service_1.InventoryService,
        settings_service_1.SettingsService,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], ProcureToPayService);
//# sourceMappingURL=procure-to-pay.service.js.map