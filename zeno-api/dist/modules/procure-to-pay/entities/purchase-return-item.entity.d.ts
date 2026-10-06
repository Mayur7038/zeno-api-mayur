import { PurchaseReturn } from './purchase-return.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
export declare class PurchaseReturnItem {
    id: string;
    purchaseReturnId: string;
    purchaseReturn: PurchaseReturn;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    returnedQty: number;
    rate: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
    createdAt: Date;
}
