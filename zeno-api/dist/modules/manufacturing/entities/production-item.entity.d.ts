import { ProductionEntry } from './production-entry.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
export declare class ProductionItem {
    id: string;
    tenantId: string;
    productionEntryId: string;
    productionEntry: ProductionEntry;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    consumedQty: number;
    unitRate: number;
    amount: number;
    notes: string;
}
