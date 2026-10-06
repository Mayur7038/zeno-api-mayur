import { BillOfMaterials } from './bom.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
export declare class BomItem {
    id: string;
    tenantId: string;
    bomId: string;
    bom: BillOfMaterials;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    consumedQty: number;
    unitRate: number;
    scrapPercentage: number;
    totalAmount: number;
    notes: string;
}
