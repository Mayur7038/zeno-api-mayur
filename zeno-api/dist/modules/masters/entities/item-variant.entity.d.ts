import { Item } from './item.entity';
export declare class ItemVariant {
    id: string;
    tenantId: string;
    itemId: string;
    item: Item;
    name: string;
    sku: string;
    attributes: Record<string, string>;
    purchaseRate: number;
    saleRate: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
