import { EntityManager } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
export interface StockMovementLine {
    godownId: string;
    rackBinId?: string;
    itemId: string;
    variantId?: string;
    qtyIn?: number;
    qtyOut?: number;
    unitRate: number;
}
export interface PostStockParams {
    tenantId: string;
    companyId: string;
    branchId: string;
    entryDate: string;
    voucherType: string;
    voucherId: string;
    voucherNo: string;
    lines: StockMovementLine[];
}
export declare class InventoryService {
    recordStockMovement(manager: EntityManager, params: PostStockParams): Promise<StockLedger[]>;
    reverseStockMovement(manager: EntityManager, voucherType: string, voucherId: string): Promise<void>;
    getCurrentStockBalance(manager: EntityManager, tenantId: string, companyId: string, godownId: string, itemId: string, variantId?: string): Promise<number>;
    getOpeningBalances(manager: EntityManager, tenantId: string, companyId: string, godownId: string): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        itemGroupId: any;
        itemGroupName: any;
        unitCode: any;
        standardPurchaseRate: number;
        standardSaleRate: number;
        openingQty: number;
        unitRate: number;
        totalValue: number;
        effectiveDate: string;
        ledgerId: string;
    }[]>;
    updateOpeningBalances(manager: EntityManager, tenantId: string, companyId: string, data: {
        godownId: string;
        branchId?: string;
        effectiveDate: string;
        items: Array<{
            itemId: string;
            variantId?: string;
            openingQty: number;
            unitRate: number;
        }>;
    }): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        itemGroupId: any;
        itemGroupName: any;
        unitCode: any;
        standardPurchaseRate: number;
        standardSaleRate: number;
        openingQty: number;
        unitRate: number;
        totalValue: number;
        effectiveDate: string;
        ledgerId: string;
    }[]>;
}
