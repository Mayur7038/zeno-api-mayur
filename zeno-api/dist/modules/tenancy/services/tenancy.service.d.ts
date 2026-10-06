import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Branch } from '../entities/branch.entity';
import { Godown } from '../entities/godown.entity';
import { RackBin } from '../entities/rack-bin.entity';
export declare class TenancyService {
    private companyRepo;
    private branchRepo;
    private godownRepo;
    private rackBinRepo;
    constructor(companyRepo: Repository<Company>, branchRepo: Repository<Branch>, godownRepo: Repository<Godown>, rackBinRepo: Repository<RackBin>);
    getCompanies(tenantId: string): Promise<Company[]>;
    getBranches(tenantId: string, companyId?: string): Promise<Branch[]>;
    updateCompany(tenantId: string, companyId: string, data: Partial<Company>): Promise<Company>;
    getGodowns(tenantId: string, branchId?: string): Promise<Godown[]>;
    getRacksBins(tenantId: string, godownId: string): Promise<RackBin[]>;
    createBranch(tenantId: string, data: Partial<Branch>): Promise<Branch>;
    createGodown(tenantId: string, data: Partial<Godown>): Promise<Godown>;
    updateGodown(tenantId: string, godownId: string, data: Partial<Godown>): Promise<Godown>;
    deleteGodown(tenantId: string, godownId: string): Promise<Godown>;
    createRackBin(tenantId: string, data: Partial<RackBin>): Promise<RackBin>;
}
