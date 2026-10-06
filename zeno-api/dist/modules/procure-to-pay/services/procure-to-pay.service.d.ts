import { DataSource, Repository } from 'typeorm';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { GoodsReceiptNote } from '../entities/goods-receipt-note.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { PurchaseReturn } from '../entities/purchase-return.entity';
import { VendorPayment } from '../entities/vendor-payment.entity';
import { VoucherSequenceService } from './voucher-sequence.service';
import { AccountingService } from '../../accounting/services/accounting.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { SettingsService } from '../../settings/services/settings.service';
import { GrnStatus, PurchaseInvoiceStatus, PurchaseOrderStatus } from '../../../common/enums';
export declare class ProcureToPayService {
    private dataSource;
    private sequenceService;
    private accountingService;
    private inventoryService;
    private settingsService;
    private poRepo;
    private grnRepo;
    private piRepo;
    private prRepo;
    private paymentRepo;
    constructor(dataSource: DataSource, sequenceService: VoucherSequenceService, accountingService: AccountingService, inventoryService: InventoryService, settingsService: SettingsService, poRepo: Repository<PurchaseOrder>, grnRepo: Repository<GoodsReceiptNote>, piRepo: Repository<PurchaseInvoice>, prRepo: Repository<PurchaseReturn>, paymentRepo: Repository<VendorPayment>);
    getPurchaseOrders(tenantId: string, companyId: string, filters: {
        status?: PurchaseOrderStatus;
        search?: string;
    }): Promise<PurchaseOrder[]>;
    getPurchaseOrderById(tenantId: string, id: string): Promise<PurchaseOrder>;
    getVendorPendingPurchaseOrders(tenantId: string, companyId: string, vendorLedgerId: string): Promise<PurchaseOrder[]>;
    createPurchaseOrder(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<PurchaseOrder>;
    cancelPurchaseOrder(tenantId: string, id: string): Promise<PurchaseOrder>;
    getGoodsReceiptNotes(tenantId: string, companyId: string, filters: {
        status?: GrnStatus;
        search?: string;
    }): Promise<GoodsReceiptNote[]>;
    getGoodsReceiptNoteById(tenantId: string, id: string): Promise<GoodsReceiptNote>;
    getVendorPendingGrns(tenantId: string, companyId: string, vendorLedgerId: string): Promise<GoodsReceiptNote[]>;
    createGoodsReceiptNote(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<GoodsReceiptNote>;
    getPurchaseInvoices(tenantId: string, companyId: string, filters: {
        status?: PurchaseInvoiceStatus;
        search?: string;
    }): Promise<PurchaseInvoice[]>;
    getPurchaseInvoiceById(tenantId: string, id: string): Promise<PurchaseInvoice>;
    getVendorPendingInvoices(tenantId: string, companyId: string, vendorLedgerId: string): Promise<PurchaseInvoice[]>;
    createPurchaseInvoice(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<PurchaseInvoice>;
    getPurchaseReturns(tenantId: string, companyId: string): Promise<PurchaseReturn[]>;
    createPurchaseReturn(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<PurchaseReturn>;
    getVendorPayments(tenantId: string, companyId: string): Promise<VendorPayment[]>;
    createVendorPayment(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<VendorPayment>;
}
