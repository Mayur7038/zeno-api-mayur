import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { CustomerReceiptAllocation } from './customer-receipt-allocation.entity';
export declare class CustomerReceipt {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    voucherNo: string;
    receiptDate: string;
    customerLedgerId: string;
    customerLedger: Ledger;
    paymentLedgerId: string;
    paymentLedger: Ledger;
    amount: number;
    paymentMode: string;
    referenceNo: string;
    notes: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    allocations: CustomerReceiptAllocation[];
}
