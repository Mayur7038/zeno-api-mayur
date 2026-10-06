import { User } from '../../auth/entities/user.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
export declare class UserBranchAccess {
    id: string;
    userId: string;
    user: User;
    branchId: string;
    branch: Branch;
    isDefault: boolean;
    createdAt: Date;
}
