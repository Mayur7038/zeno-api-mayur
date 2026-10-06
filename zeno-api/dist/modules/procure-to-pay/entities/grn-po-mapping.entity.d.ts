import { GoodsReceiptNote } from './goods-receipt-note.entity';
import { PurchaseOrder } from './purchase-order.entity';
export declare class GrnPoMapping {
    id: string;
    grnId: string;
    grn: GoodsReceiptNote;
    purchaseOrderId: string;
    purchaseOrder: PurchaseOrder;
}
