import { Godown } from '../../tenancy/entities/godown.entity';
import { StockCountItem } from './stock-count-item.entity';
export declare class StockCount {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    voucherNo: string;
    countDate: string;
    godownId: string;
    godown: Godown;
    status: string;
    totalBookQty: number;
    totalPhysicalQty: number;
    discrepancyQty: number;
    discrepancyValue: number;
    notes: string;
    items: StockCountItem[];
    createdAt: Date;
    updatedAt: Date;
}
