import { SalesReturn } from './sales-return.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
export declare class SalesReturnItem {
    id: string;
    salesReturnId: string;
    salesReturn: SalesReturn;
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
