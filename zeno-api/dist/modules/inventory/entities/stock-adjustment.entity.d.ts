import { Godown } from '../../tenancy/entities/godown.entity';
import { StockAdjustmentItem } from './stock-adjustment-item.entity';
export declare class StockAdjustment {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    voucherNo: string;
    adjustmentDate: string;
    godownId: string;
    godown: Godown;
    reason: string;
    status: string;
    totalQty: number;
    totalAmount: number;
    notes: string;
    items: StockAdjustmentItem[];
    createdAt: Date;
    updatedAt: Date;
}
