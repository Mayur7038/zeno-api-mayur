import { DeliveryChallan } from './delivery-challan.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
export declare class DeliveryChallanItem {
    id: string;
    deliveryChallanId: string;
    deliveryChallan: DeliveryChallan;
    salesOrderItemId: string;
    salesOrderItem: SalesOrderItem;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    unitId: string;
    unit: Unit;
    dispatchedQty: number;
    invoicedQty: number;
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
