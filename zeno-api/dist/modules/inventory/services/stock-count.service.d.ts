import { Repository, DataSource } from 'typeorm';
import { StockCount } from '../entities/stock-count.entity';
import { StockCountItem } from '../entities/stock-count-item.entity';
import { StockLedger } from '../entities/stock-ledger.entity';
import { Item } from '../../masters/entities/item.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { InventoryService } from './inventory.service';
export declare class StockCountService {
    private countRepo;
    private countItemRepo;
    private godownRepo;
    private itemRepo;
    private stockRepo;
    private inventoryService;
    private dataSource;
    constructor(countRepo: Repository<StockCount>, countItemRepo: Repository<StockCountItem>, godownRepo: Repository<Godown>, itemRepo: Repository<Item>, stockRepo: Repository<StockLedger>, inventoryService: InventoryService, dataSource: DataSource);
    getStockCounts(tenantId: string, companyId: string): Promise<StockCount[]>;
    getStockCountById(tenantId: string, id: string): Promise<StockCount>;
    initiateStockCount(tenantId: string, companyId: string, data: any): Promise<StockCount>;
    updateStockCount(tenantId: string, id: string, data: any): Promise<StockCount>;
    reconcileStockCount(tenantId: string, id: string): Promise<StockCount>;
    cancelStockCount(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
