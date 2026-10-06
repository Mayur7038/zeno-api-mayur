import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { StockTransfer } from './stock-transfer.entity';
export declare class StockTransferItem {
    id: string;
    tenantId: string;
    transferId: string;
    transfer: StockTransfer;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    transferQty: number;
    unitRate: number;
    totalAmount: number;
    notes: string;
}
