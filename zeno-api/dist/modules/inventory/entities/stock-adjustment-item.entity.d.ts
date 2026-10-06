import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { StockAdjustment } from './stock-adjustment.entity';
export declare class StockAdjustmentItem {
    id: string;
    tenantId: string;
    adjustmentId: string;
    adjustment: StockAdjustment;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    adjustmentType: string;
    qty: number;
    unitRate: number;
    totalAmount: number;
    reason: string;
}
