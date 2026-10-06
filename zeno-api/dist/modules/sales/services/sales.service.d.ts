import { Repository, DataSource } from 'typeorm';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { DeliveryChallan } from '../entities/delivery-challan.entity';
import { DeliveryChallanItem } from '../entities/delivery-challan-item.entity';
import { SalesInvoice } from '../entities/sales-invoice.entity';
import { SalesInvoiceItem } from '../entities/sales-invoice-item.entity';
import { SalesReturn } from '../entities/sales-return.entity';
import { CustomerReceipt } from '../entities/customer-receipt.entity';
import { VoucherSequenceService } from '../../procure-to-pay/services/voucher-sequence.service';
import { AccountingService } from '../../accounting/services/accounting.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { SettingsService } from '../../settings/services/settings.service';
import { SalesOrderStatus, DeliveryChallanStatus, SalesInvoiceStatus } from '../../../common/enums';
export declare class SalesService {
    private dataSource;
    private soRepo;
    private soItemRepo;
    private dcRepo;
    private dcItemRepo;
    private siRepo;
    private siItemRepo;
    private srRepo;
    private crRepo;
    private sequenceService;
    private accountingService;
    private inventoryService;
    private settingsService;
    constructor(dataSource: DataSource, soRepo: Repository<SalesOrder>, soItemRepo: Repository<SalesOrderItem>, dcRepo: Repository<DeliveryChallan>, dcItemRepo: Repository<DeliveryChallanItem>, siRepo: Repository<SalesInvoice>, siItemRepo: Repository<SalesInvoiceItem>, srRepo: Repository<SalesReturn>, crRepo: Repository<CustomerReceipt>, sequenceService: VoucherSequenceService, accountingService: AccountingService, inventoryService: InventoryService, settingsService: SettingsService);
    getSalesOrders(tenantId: string, companyId: string, filters: {
        status?: SalesOrderStatus;
        search?: string;
    }): Promise<SalesOrder[]>;
    getSalesOrderById(tenantId: string, id: string): Promise<SalesOrder>;
    getCustomerPendingSalesOrders(tenantId: string, companyId: string, customerLedgerId: string): Promise<SalesOrder[]>;
    createSalesOrder(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<SalesOrder>;
    cancelSalesOrder(tenantId: string, id: string): Promise<SalesOrder>;
    getDeliveryChallans(tenantId: string, companyId: string, filters: {
        status?: DeliveryChallanStatus;
        search?: string;
    }): Promise<DeliveryChallan[]>;
    getDeliveryChallanById(tenantId: string, id: string): Promise<DeliveryChallan>;
    getCustomerPendingChallans(tenantId: string, companyId: string, customerLedgerId: string): Promise<DeliveryChallan[]>;
    createDeliveryChallan(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<DeliveryChallan>;
    getSalesInvoices(tenantId: string, companyId: string, filters: {
        status?: SalesInvoiceStatus;
        search?: string;
    }): Promise<SalesInvoice[]>;
    getSalesInvoiceById(tenantId: string, id: string): Promise<SalesInvoice>;
    getCustomerPendingInvoices(tenantId: string, companyId: string, customerLedgerId: string): Promise<SalesInvoice[]>;
    createSalesInvoice(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<SalesInvoice>;
    getSalesReturns(tenantId: string, companyId: string): Promise<SalesReturn[]>;
    createSalesReturn(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<SalesReturn>;
    getCustomerReceipts(tenantId: string, companyId: string): Promise<CustomerReceipt[]>;
    createCustomerReceipt(tenantId: string, companyId: string, branchId: string, userId: string, data: any): Promise<CustomerReceipt>;
}
