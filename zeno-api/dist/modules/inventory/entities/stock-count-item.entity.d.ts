import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { StockCount } from './stock-count.entity';
export declare class StockCountItem {
    id: string;
    tenantId: string;
    stockCountId: string;
    stockCount: StockCount;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    bookQty: number;
    physicalQty: number;
    differenceQty: number;
    unitRate: number;
    differenceValue: number;
    remarks: string;
}
