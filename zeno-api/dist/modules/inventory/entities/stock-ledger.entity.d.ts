import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { RackBin } from '../../tenancy/entities/rack-bin.entity';
export declare class StockLedger {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    godownId: string;
    godown: Godown;
    rackBinId: string;
    rackBin: RackBin;
    itemId: string;
    item: Item;
    variantId: string;
    variant: ItemVariant;
    entryDate: string;
    voucherType: string;
    voucherId: string;
    voucherNo: string;
    qtyIn: number;
    qtyOut: number;
    unitRate: number;
    totalValue: number;
    createdAt: Date;
}
