import { Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
import { InventoryService } from '../services/inventory.service';
export declare class InventoryController {
    private inventoryService;
    private stockRepo;
    constructor(inventoryService: InventoryService, stockRepo: Repository<StockLedger>);
    getStockSummary(tenantId: string, companyId: string, godownId?: string): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        unit: any;
        currentStock: number;
        averageRate: number;
        totalValue: number;
    }[]>;
    getItemBalance(tenantId: string, companyId: string, godownId: string, itemId: string, variantId?: string): Promise<{
        itemId: string;
        godownId: string;
        variantId: string;
        currentBalance: number;
    }>;
}
