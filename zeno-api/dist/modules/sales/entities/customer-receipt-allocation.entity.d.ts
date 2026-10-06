import { CustomerReceipt } from './customer-receipt.entity';
import { SalesInvoice } from './sales-invoice.entity';
export declare class CustomerReceiptAllocation {
    id: string;
    customerReceiptId: string;
    customerReceipt: CustomerReceipt;
    salesInvoiceId: string;
    salesInvoice: SalesInvoice;
    allocatedAmount: number;
    createdAt: Date;
}
