import { SalesService } from '../services/sales.service';
import { User } from '../../auth/entities/user.entity';
import { SalesOrderStatus, DeliveryChallanStatus, SalesInvoiceStatus } from '../../../common/enums';
export declare class SalesController {
    private salesService;
    constructor(salesService: SalesService);
    getSalesOrders(tenantId: string, companyId: string, status?: SalesOrderStatus, search?: string): Promise<import("../entities/sales-order.entity").SalesOrder[]>;
    getSalesOrderById(tenantId: string, id: string): Promise<import("../entities/sales-order.entity").SalesOrder>;
    getCustomerPendingSalesOrders(tenantId: string, customerId: string, companyId: string): Promise<import("../entities/sales-order.entity").SalesOrder[]>;
    createSalesOrder(tenantId: string, user: User, body: any): Promise<import("../entities/sales-order.entity").SalesOrder>;
    cancelSalesOrder(tenantId: string, id: string): Promise<import("../entities/sales-order.entity").SalesOrder>;
    getDeliveryChallans(tenantId: string, companyId: string, status?: DeliveryChallanStatus, search?: string): Promise<import("../entities/delivery-challan.entity").DeliveryChallan[]>;
    getDeliveryChallanById(tenantId: string, id: string): Promise<import("../entities/delivery-challan.entity").DeliveryChallan>;
    getCustomerPendingChallans(tenantId: string, customerId: string, companyId: string): Promise<import("../entities/delivery-challan.entity").DeliveryChallan[]>;
    createDeliveryChallan(tenantId: string, user: User, body: any): Promise<import("../entities/delivery-challan.entity").DeliveryChallan>;
    getSalesInvoices(tenantId: string, companyId: string, status?: SalesInvoiceStatus, search?: string): Promise<import("../entities/sales-invoice.entity").SalesInvoice[]>;
    getSalesInvoiceById(tenantId: string, id: string): Promise<import("../entities/sales-invoice.entity").SalesInvoice>;
    getCustomerPendingInvoices(tenantId: string, customerId: string, companyId: string): Promise<import("../entities/sales-invoice.entity").SalesInvoice[]>;
    createSalesInvoice(tenantId: string, user: User, body: any): Promise<import("../entities/sales-invoice.entity").SalesInvoice>;
    getSalesReturns(tenantId: string, companyId: string): Promise<import("../entities/sales-return.entity").SalesReturn[]>;
    createSalesReturn(tenantId: string, user: User, body: any): Promise<import("../entities/sales-return.entity").SalesReturn>;
    getCustomerReceipts(tenantId: string, companyId: string): Promise<import("../entities/customer-receipt.entity").CustomerReceipt[]>;
    createCustomerReceipt(tenantId: string, user: User, body: any): Promise<import("../entities/customer-receipt.entity").CustomerReceipt>;
}
