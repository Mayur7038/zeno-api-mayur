import { Repository } from 'typeorm';
import { LedgerGroup } from '../entities/ledger-group.entity';
import { Ledger } from '../entities/ledger.entity';
import { Unit } from '../entities/unit.entity';
import { ItemGroup } from '../entities/item-group.entity';
import { ItemCategory } from '../entities/item-category.entity';
import { Item } from '../entities/item.entity';
import { ItemVariant } from '../entities/item-variant.entity';
export declare class MastersService {
    private groupRepo;
    private ledgerRepo;
    private unitRepo;
    private itemGroupRepo;
    private itemCatRepo;
    private itemRepo;
    private variantRepo;
    constructor(groupRepo: Repository<LedgerGroup>, ledgerRepo: Repository<Ledger>, unitRepo: Repository<Unit>, itemGroupRepo: Repository<ItemGroup>, itemCatRepo: Repository<ItemCategory>, itemRepo: Repository<Item>, variantRepo: Repository<ItemVariant>);
    getLedgerGroups(tenantId: string, companyId?: string): Promise<LedgerGroup[]>;
    createLedgerGroup(tenantId: string, companyId: string, data: Partial<LedgerGroup>): Promise<LedgerGroup>;
    updateLedgerGroup(tenantId: string, id: string, data: {
        name?: string;
        code?: string;
        parentId?: string;
        nature?: any;
        isCreditorVendor?: boolean;
        isDebtorCustomer?: boolean;
    }): Promise<LedgerGroup>;
    deleteLedgerGroup(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLedgers(tenantId: string, companyId: string, isVendorOnly?: boolean, isCustomerOnly?: boolean): Promise<Ledger[]>;
    createLedger(tenantId: string, companyId: string, data: Partial<Ledger>): Promise<Ledger>;
    updateLedger(tenantId: string, id: string, data: Partial<Ledger>): Promise<Ledger>;
    deleteLedger(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUnits(tenantId: string, companyId: string): Promise<Unit[]>;
    createUnit(tenantId: string, companyId: string, data: Partial<Unit>): Promise<Unit>;
    updateUnit(tenantId: string, id: string, data: Partial<Unit>): Promise<Unit>;
    deleteUnit(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItemGroups(tenantId: string, companyId: string): Promise<ItemGroup[]>;
    createItemGroup(tenantId: string, companyId: string, data: Partial<ItemGroup>): Promise<ItemGroup>;
    updateItemGroup(tenantId: string, id: string, data: Partial<ItemGroup>): Promise<ItemGroup>;
    deleteItemGroup(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItemCategories(tenantId: string, companyId: string, itemGroupId?: string): Promise<ItemCategory[]>;
    createItemCategory(tenantId: string, companyId: string, data: Partial<ItemCategory>): Promise<ItemCategory>;
    updateItemCategory(tenantId: string, id: string, data: Partial<ItemCategory>): Promise<ItemCategory>;
    deleteItemCategory(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getVariants(tenantId: string, companyId?: string, itemId?: string): Promise<ItemVariant[]>;
    createVariant(tenantId: string, data: Partial<ItemVariant>): Promise<ItemVariant>;
    updateVariant(tenantId: string, id: string, data: Partial<ItemVariant>): Promise<ItemVariant>;
    deleteVariant(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getItems(tenantId: string, companyId: string, search?: string): Promise<Item[]>;
    getItemById(tenantId: string, id: string): Promise<Item>;
    createItem(tenantId: string, companyId: string, data: Partial<Item> & {
        variants?: any[];
    }): Promise<Item>;
    updateItem(tenantId: string, id: string, data: Partial<Item>): Promise<Item>;
}
