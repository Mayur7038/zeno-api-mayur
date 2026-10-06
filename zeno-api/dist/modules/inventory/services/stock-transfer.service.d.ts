import { Repository, DataSource } from 'typeorm';
import { StockTransfer } from '../entities/stock-transfer.entity';
import { StockTransferItem } from '../entities/stock-transfer-item.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { InventoryService } from './inventory.service';
export declare class StockTransferService {
    private transferRepo;
    private transferItemRepo;
    private godownRepo;
    private inventoryService;
    private dataSource;
    constructor(transferRepo: Repository<StockTransfer>, transferItemRepo: Repository<StockTransferItem>, godownRepo: Repository<Godown>, inventoryService: InventoryService, dataSource: DataSource);
    getTransfers(tenantId: string, companyId: string): Promise<StockTransfer[]>;
    getTransferById(tenantId: string, id: string): Promise<StockTransfer>;
    createTransfer(tenantId: string, companyId: string, data: any): Promise<StockTransfer>;
    cancelTransfer(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
