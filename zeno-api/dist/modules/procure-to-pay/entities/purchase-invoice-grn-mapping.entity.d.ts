import { PurchaseInvoice } from './purchase-invoice.entity';
import { GoodsReceiptNote } from './goods-receipt-note.entity';
export declare class PurchaseInvoiceGrnMapping {
    id: string;
    purchaseInvoiceId: string;
    purchaseInvoice: PurchaseInvoice;
    grnId: string;
    grn: GoodsReceiptNote;
}
