import { Tenant } from './tenant.entity';
import { Branch } from './branch.entity';
export declare class Company {
    id: string;
    tenantId: string;
    tenant: Tenant;
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    currencyCode: string;
    financialYearStart: string;
    createdAt: Date;
    updatedAt: Date;
    branches: Branch[];
}
