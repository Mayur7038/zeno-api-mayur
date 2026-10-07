import { MastersService } from '../services/masters.service';
export declare class MastersController {
    private mastersService;
    constructor(mastersService: MastersService);
    getLedgerGroups(tenantId: string, companyId?: string): Promise<import("../entities/ledger-group.entity").LedgerGroup[]>;
    createLedgerGroup(tenantId: string, body: any): Promise<import("../entities/ledger-group.entity").LedgerGroup>;
    updateLedgerGroup(tenantId: string, id: string, body: any): Promise<import("../entities/ledger-group.entity").LedgerGroup>;
    deleteLedgerGroup(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLedgers(tenantId: string, companyId: string, isVendorOnly?: string, isCustomerOnly?: string): Promise<import("../entities/ledger.entity").Ledger[]>;
    createLedger(tenantId: string, body: any): Promise<import("../entities/ledger.entity").Ledger>;
    updateLedger(tenantId: string, id: string, body: any): Promise<import("../entities/ledger.entity").Ledger>;
    deleteLedger(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUnits(tenantId: string, companyId: string): Promise<import("../entities/unit.entity").Unit[]>;
    createUnit(tenantId: string, body: any): Promise<import("../entities/unit.entity").Unit>;
    updateUnit(tenantId: string, id: string, body: any): Promise<import("../entities/unit.entity").Unit>;
    deleteUnit(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItemGroups(tenantId: string, companyId: string): Promise<import("../entities/item-group.entity").ItemGroup[]>;
    createItemGroup(tenantId: string, body: any): Promise<import("../entities/item-group.entity").ItemGroup>;
    updateItemGroup(tenantId: string, id: string, body: any): Promise<import("../entities/item-group.entity").ItemGroup>;
    deleteItemGroup(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItemCategories(tenantId: string, companyId: string, itemGroupId?: string): Promise<import("../entities/item-category.entity").ItemCategory[]>;
    createItemCategory(tenantId: string, body: any): Promise<import("../entities/item-category.entity").ItemCategory>;
    updateItemCategory(tenantId: string, id: string, body: any): Promise<import("../entities/item-category.entity").ItemCategory>;
    deleteItemCategory(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getVariants(tenantId: string, companyId?: string, itemId?: string): Promise<import("../entities/item-variant.entity").ItemVariant[]>;
    createVariant(tenantId: string, body: any): Promise<import("../entities/item-variant.entity").ItemVariant>;
    updateVariant(tenantId: string, id: string, body: any): Promise<import("../entities/item-variant.entity").ItemVariant>;
    deleteVariant(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getVariantDefinitions(tenantId: string, companyId?: string): Promise<import("../entities/variant-definition.entity").VariantDefinition[]>;
    createVariantDefinition(tenantId: string, body: any): Promise<import("../entities/variant-definition.entity").VariantDefinition>;
    updateVariantDefinition(tenantId: string, id: string, body: any): Promise<import("../entities/variant-definition.entity").VariantDefinition>;
    deleteVariantDefinition(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItems(tenantId: string, companyId: string, search?: string): Promise<import("../entities/item.entity").Item[]>;
    getItemById(tenantId: string, id: string): Promise<import("../entities/item.entity").Item>;
    createItem(tenantId: string, body: any): Promise<import("../entities/item.entity").Item>;
    updateItem(tenantId: string, id: string, body: any): Promise<import("../entities/item.entity").Item>;
    deleteItem(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
