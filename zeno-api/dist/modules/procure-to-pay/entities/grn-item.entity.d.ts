import { GoodsReceiptNote } from './goods-receipt-note.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Unit } from '../../masters/entities/unit.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { RackBin } from '../../tenancy/entities/rack-bin.entity';
export declare class GrnItem {
    id: string;
    grnId: string;
    grn: GoodsReceiptNote;
    poItemId: string;
    poItem: PurchaseOrderItem;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    unitId: string;
    unit: Unit;
    godownId: string;
    godown: Godown;
    rackBinId: string;
    rackBin: RackBin;
    receivedQty: number;
    invoicedQty: number;
    rate: number;
    totalAmount: number;
    createdAt: Date;
}
