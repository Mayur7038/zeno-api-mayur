import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { PriceList } from './price-list.entity';
export declare class PriceListItem {
    id: string;
    tenantId: string;
    priceListId: string;
    priceList: PriceList;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    standardRate: number;
    customRate: number;
    discountPercentage: number;
    minSellingPrice: number;
    notes: string;
}
