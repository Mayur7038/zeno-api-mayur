import { Item } from '../../masters/entities/item.entity';
import { ItemVariant } from '../../masters/entities/item-variant.entity';
import { BomItem } from './bom-item.entity';
export declare class BillOfMaterials {
    id: string;
    tenantId: string;
    companyId: string;
    bomNo: string;
    name: string;
    finishedItemId: string;
    finishedItem: Item;
    finishedVariantId: string;
    finishedVariant: ItemVariant;
    producedQty: number;
    estimatedLaborCost: number;
    estimatedOverheadCost: number;
    totalCost: number;
    isActive: boolean;
    description: string;
    items: BomItem[];
    createdAt: Date;
    updatedAt: Date;
}
