import { Company } from './company.entity';
import { Godown } from './godown.entity';
export declare class Branch {
    id: string;
    tenantId: string;
    companyId: string;
    company: Company;
    branchName: string;
    branchCode: string;
    stateCode: string;
    stateName: string;
    addressLine1: string;
    pincode: string;
    isHeadOffice: boolean;
    createdAt: Date;
    updatedAt: Date;
    godowns: Godown[];
}
