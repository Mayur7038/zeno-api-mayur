import { ItemGroup } from './item-group.entity';
import { Item } from './item.entity';
export declare class ItemCategory {
    id: string;
    tenantId: string;
    companyId: string;
    itemGroupId: string;
    itemGroup: ItemGroup;
    name: string;
    gstRate: number;
    createdAt: Date;
    updatedAt: Date;
    items: Item[];
}
