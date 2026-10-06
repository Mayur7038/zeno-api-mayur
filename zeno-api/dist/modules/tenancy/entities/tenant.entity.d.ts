import { Company } from './company.entity';
import { User } from '../../auth/entities/user.entity';
export declare class Tenant {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companies: Company[];
    users: User[];
}
