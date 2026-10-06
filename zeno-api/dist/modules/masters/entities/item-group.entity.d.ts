import { ItemCategory } from './item-category.entity';
import { Item } from './item.entity';
export declare class ItemGroup {
    id: string;
    tenantId: string;
    companyId: string;
    name: string;
    hsnSac: string;
    gstRate: number;
    createdAt: Date;
    updatedAt: Date;
    categories: ItemCategory[];
    items: Item[];
}
