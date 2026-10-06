import { ProcureToPayService } from '../services/procure-to-pay.service';
import { User } from '../../auth/entities/user.entity';
import { GrnStatus, PurchaseInvoiceStatus, PurchaseOrderStatus } from '../../../common/enums';
export declare class ProcureToPayController {
    private p2pService;
    constructor(p2pService: ProcureToPayService);
    getPurchaseOrders(tenantId: string, companyId: string, status?: PurchaseOrderStatus, search?: string): Promise<import("../entities/purchase-order.entity").PurchaseOrder[]>;
    getPurchaseOrderById(tenantId: string, id: string): Promise<import("../entities/purchase-order.entity").PurchaseOrder>;
    getVendorPendingOrders(tenantId: string, vendorId: string, companyId: string): Promise<import("../entities/purchase-order.entity").PurchaseOrder[]>;
    createPurchaseOrder(tenantId: string, user: User, body: any): Promise<import("../entities/purchase-order.entity").PurchaseOrder>;
    cancelPurchaseOrder(tenantId: string, id: string): Promise<import("../entities/purchase-order.entity").PurchaseOrder>;
    getGoodsReceiptNotes(tenantId: string, companyId: string, status?: GrnStatus, search?: string): Promise<import("../entities/goods-receipt-note.entity").GoodsReceiptNote[]>;
    getGoodsReceiptNoteById(tenantId: string, id: string): Promise<import("../entities/goods-receipt-note.entity").GoodsReceiptNote>;
    getVendorPendingGrns(tenantId: string, vendorId: string, companyId: string): Promise<import("../entities/goods-receipt-note.entity").GoodsReceiptNote[]>;
    createGoodsReceiptNote(tenantId: string, user: User, body: any): Promise<import("../entities/goods-receipt-note.entity").GoodsReceiptNote>;
    getPurchaseInvoices(tenantId: string, companyId: string, status?: PurchaseInvoiceStatus, search?: string): Promise<import("../entities/purchase-invoice.entity").PurchaseInvoice[]>;
    getPurchaseInvoiceById(tenantId: string, id: string): Promise<import("../entities/purchase-invoice.entity").PurchaseInvoice>;
    getVendorPendingInvoices(tenantId: string, vendorId: string, companyId: string): Promise<import("../entities/purchase-invoice.entity").PurchaseInvoice[]>;
    createPurchaseInvoice(tenantId: string, user: User, body: any): Promise<import("../entities/purchase-invoice.entity").PurchaseInvoice>;
    getPurchaseReturns(tenantId: string, companyId: string): Promise<import("../entities/purchase-return.entity").PurchaseReturn[]>;
    createPurchaseReturn(tenantId: string, user: User, body: any): Promise<import("../entities/purchase-return.entity").PurchaseReturn>;
    getVendorPayments(tenantId: string, companyId: string): Promise<import("../entities/vendor-payment.entity").VendorPayment[]>;
    createVendorPayment(tenantId: string, user: User, body: any): Promise<import("../entities/vendor-payment.entity").VendorPayment>;
}
