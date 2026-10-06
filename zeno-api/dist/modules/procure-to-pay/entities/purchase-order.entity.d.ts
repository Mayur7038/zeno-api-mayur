import { PurchaseOrderStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
export declare class PurchaseOrder {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    voucherNo: string;
    orderDate: string;
    vendorLedgerId: string;
    vendorLedger: Ledger;
    status: PurchaseOrderStatus;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    notes: string;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    items: PurchaseOrderItem[];
}
