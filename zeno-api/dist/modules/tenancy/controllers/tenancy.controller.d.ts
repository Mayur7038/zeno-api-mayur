import { TenancyService } from '../services/tenancy.service';
export declare class TenancyController {
    private tenancyService;
    constructor(tenancyService: TenancyService);
    getCompanies(tenantId: string): Promise<import("../entities/company.entity").Company[]>;
    updateCompany(tenantId: string, companyId: string, data: any): Promise<import("../entities/company.entity").Company>;
    getBranches(tenantId: string, companyId?: string): Promise<import("../entities/branch.entity").Branch[]>;
    createBranch(tenantId: string, data: any): Promise<import("../entities/branch.entity").Branch>;
    getGodowns(tenantId: string, branchId?: string): Promise<import("../entities/godown.entity").Godown[]>;
    createGodown(tenantId: string, data: any): Promise<import("../entities/godown.entity").Godown>;
    updateGodown(tenantId: string, godownId: string, data: any): Promise<import("../entities/godown.entity").Godown>;
    deleteGodown(tenantId: string, godownId: string): Promise<import("../entities/godown.entity").Godown>;
    getRacksBins(tenantId: string, godownId: string): Promise<import("../entities/rack-bin.entity").RackBin[]>;
    createRackBin(tenantId: string, data: any): Promise<import("../entities/rack-bin.entity").RackBin>;
}
