import { VendorPayment } from './vendor-payment.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';
export declare class VendorPaymentAllocation {
    id: string;
    vendorPaymentId: string;
    vendorPayment: VendorPayment;
    purchaseInvoiceId: string;
    purchaseInvoice: PurchaseInvoice;
    allocatedAmount: number;
    discountAmount: number;
    createdAt: Date;
}
