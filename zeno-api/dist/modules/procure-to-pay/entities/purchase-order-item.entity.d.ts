import { PurchaseOrder } from './purchase-order.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
export declare class PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    purchaseOrder: PurchaseOrder;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    unitId: string;
    unit: Unit;
    orderedQty: number;
    receivedQty: number;
    rate: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalAmount: number;
    createdAt: Date;
}
