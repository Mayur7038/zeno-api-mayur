import { SalesInvoice } from './sales-invoice.entity';
import { DeliveryChallanItem } from './delivery-challan-item.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
export declare class SalesInvoiceItem {
    id: string;
    salesInvoiceId: string;
    salesInvoice: SalesInvoice;
    deliveryChallanItemId: string;
    deliveryChallanItem: DeliveryChallanItem;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    unitId: string;
    unit: Unit;
    billedQty: number;
    rate: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalAmount: number;
    createdAt: Date;
}
