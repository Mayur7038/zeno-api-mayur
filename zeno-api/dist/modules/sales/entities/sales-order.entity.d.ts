import { SalesOrderStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { SalesOrderItem } from './sales-order-item.entity';
export declare class SalesOrder {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    voucherNo: string;
    orderDate: string;
    deliveryDueDate: string;
    customerLedgerId: string;
    customerLedger: Ledger;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    status: SalesOrderStatus;
    notes: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    items: SalesOrderItem[];
}
