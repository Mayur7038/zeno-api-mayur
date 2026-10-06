import { Repository, DataSource } from 'typeorm';
import { BillOfMaterials } from '../entities/bom.entity';
import { BomItem } from '../entities/bom-item.entity';
import { ProductionEntry } from '../entities/production-entry.entity';
import { ProductionItem } from '../entities/production-item.entity';
import { StockLedger } from '../../inventory/entities/stock-ledger.entity';
import { Item } from '../../masters/entities/item.entity';
export declare class ManufacturingService {
    private bomRepo;
    private bomItemRepo;
    private productionRepo;
    private productionItemRepo;
    private stockLedgerRepo;
    private itemRepo;
    private dataSource;
    constructor(bomRepo: Repository<BillOfMaterials>, bomItemRepo: Repository<BomItem>, productionRepo: Repository<ProductionEntry>, productionItemRepo: Repository<ProductionItem>, stockLedgerRepo: Repository<StockLedger>, itemRepo: Repository<Item>, dataSource: DataSource);
    getBoms(tenantId: string, companyId: string): Promise<BillOfMaterials[]>;
    getBomById(tenantId: string, id: string): Promise<BillOfMaterials>;
    createBom(tenantId: string, companyId: string, data: any): Promise<BillOfMaterials>;
    updateBom(tenantId: string, id: string, data: any): Promise<BillOfMaterials>;
    deleteBom(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getProductionEntries(tenantId: string, companyId: string): Promise<ProductionEntry[]>;
    getProductionEntryById(tenantId: string, id: string): Promise<ProductionEntry>;
    createProductionEntry(tenantId: string, companyId: string, data: any): Promise<ProductionEntry>;
    cancelProductionEntry(tenantId: string, id: string): Promise<ProductionEntry>;
    private getDefaultBranchId;
}
