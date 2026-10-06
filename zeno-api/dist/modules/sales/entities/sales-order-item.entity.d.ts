import { SalesOrder } from './sales-order.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
export declare class SalesOrderItem {
    id: string;
    salesOrderId: string;
    salesOrder: SalesOrder;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    unitId: string;
    unit: Unit;
    orderedQty: number;
    dispatchedQty: number;
    rate: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
    createdAt: Date;
}
