import { Godown } from './godown.entity';
export declare class RackBin {
    id: string;
    tenantId: string;
    godownId: string;
    godown: Godown;
    rackCode: string;
    binCode: string;
    createdAt: Date;
    updatedAt: Date;
}
