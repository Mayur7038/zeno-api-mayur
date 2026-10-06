import { ItemGroup } from '../../masters/entities/item-group.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Item } from '../../masters/entities/item.entity';
import { PriceListItem } from './price-list-item.entity';
export declare enum PricingDimension {
    STOCK_GROUP_WISE = "STOCK_GROUP_WISE",
    CUSTOMER_WISE = "CUSTOMER_WISE",
    PRODUCT_WISE = "PRODUCT_WISE"
}
export declare class PriceList {
    id: string;
    tenantId: string;
    companyId: string;
    name: string;
    code: string;
    pricingType: PricingDimension;
    effectiveFrom: string;
    effectiveTo: string;
    itemGroupId: string;
    itemGroup: ItemGroup;
    customerId: string;
    customer: Ledger;
    itemId: string;
    item: Item;
    discountPercentage: number;
    marginPercentage: number;
    currency: string;
    isActive: boolean;
    notes: string;
    items: PriceListItem[];
    createdAt: Date;
    updatedAt: Date;
}
