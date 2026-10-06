import { SalesInvoice } from './sales-invoice.entity';
import { DeliveryChallan } from './delivery-challan.entity';
export declare class SalesInvoiceDcMapping {
    id: string;
    salesInvoiceId: string;
    salesInvoice: SalesInvoice;
    deliveryChallanId: string;
    deliveryChallan: DeliveryChallan;
    createdAt: Date;
}
