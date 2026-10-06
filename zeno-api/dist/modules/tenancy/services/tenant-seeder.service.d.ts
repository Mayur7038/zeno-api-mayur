import { EntityManager } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { Company } from '../entities/company.entity';
import { Branch } from '../entities/branch.entity';
import { Role } from '../../rbac/entities/role.entity';
import { User } from '../../auth/entities/user.entity';
export declare class TenantSeederService {
    provisionTenantWithDefaults(manager: EntityManager, tenant: Tenant, companyData: {
        legalName: string;
        gstin?: string;
        stateCode?: string;
        stateName?: string;
    }, user: User): Promise<{
        company: Company;
        branch: Branch;
        role: Role;
    }>;
}
