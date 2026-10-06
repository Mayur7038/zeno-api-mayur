import { Repository, DataSource } from 'typeorm';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { StockAdjustmentItem } from '../entities/stock-adjustment-item.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { InventoryService } from './inventory.service';
export declare class StockAdjustmentService {
    private adjustmentRepo;
    private adjustmentItemRepo;
    private godownRepo;
    private inventoryService;
    private dataSource;
    constructor(adjustmentRepo: Repository<StockAdjustment>, adjustmentItemRepo: Repository<StockAdjustmentItem>, godownRepo: Repository<Godown>, inventoryService: InventoryService, dataSource: DataSource);
    getAdjustments(tenantId: string, companyId: string): Promise<StockAdjustment[]>;
    getAdjustmentById(tenantId: string, id: string): Promise<StockAdjustment>;
    createAdjustment(tenantId: string, companyId: string, data: any): Promise<StockAdjustment>;
    cancelAdjustment(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
