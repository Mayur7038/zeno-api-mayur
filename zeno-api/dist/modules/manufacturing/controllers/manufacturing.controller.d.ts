import { ManufacturingService } from '../services/manufacturing.service';
export declare class ManufacturingController {
    private manufacturingService;
    constructor(manufacturingService: ManufacturingService);
    getBoms(tenantId: string, companyId: string): Promise<import("../entities/bom.entity").BillOfMaterials[]>;
    getBomById(tenantId: string, id: string): Promise<import("../entities/bom.entity").BillOfMaterials>;
    createBom(tenantId: string, body: any): Promise<import("../entities/bom.entity").BillOfMaterials>;
    updateBom(tenantId: string, id: string, body: any): Promise<import("../entities/bom.entity").BillOfMaterials>;
    deleteBom(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getProductionEntries(tenantId: string, companyId: string): Promise<import("../entities/production-entry.entity").ProductionEntry[]>;
    getProductionEntryById(tenantId: string, id: string): Promise<import("../entities/production-entry.entity").ProductionEntry>;
    createProductionEntry(tenantId: string, body: any): Promise<import("../entities/production-entry.entity").ProductionEntry>;
    cancelProductionEntry(tenantId: string, id: string): Promise<import("../entities/production-entry.entity").ProductionEntry>;
}
