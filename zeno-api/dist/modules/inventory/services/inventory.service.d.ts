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
}
