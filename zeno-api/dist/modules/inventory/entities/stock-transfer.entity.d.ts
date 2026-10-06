import { Godown } from '../../tenancy/entities/godown.entity';
import { StockTransferItem } from './stock-transfer-item.entity';
export declare class StockTransfer {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    voucherNo: string;
    transferDate: string;
    sourceGodownId: string;
    sourceGodown: Godown;
    destinationGodownId: string;
    destinationGodown: Godown;
    status: string;
    totalQty: number;
    totalAmount: number;
    notes: string;
    items: StockTransferItem[];
    createdAt: Date;
    updatedAt: Date;
}
