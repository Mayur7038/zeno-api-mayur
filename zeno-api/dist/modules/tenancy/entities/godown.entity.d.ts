import { Branch } from './branch.entity';
import { RackBin } from './rack-bin.entity';
export declare class Godown {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    name: string;
    code: string;
    isActive: boolean;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactPerson: string;
    contactPhone: string;
    createdAt: Date;
    updatedAt: Date;
    racksBins: RackBin[];
}
