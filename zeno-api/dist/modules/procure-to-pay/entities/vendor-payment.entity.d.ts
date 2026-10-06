import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { VendorPaymentAllocation } from './vendor-payment-allocation.entity';
export declare class VendorPayment {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    voucherNo: string;
    paymentDate: string;
    vendorLedgerId: string;
    vendorLedger: Ledger;
    paymentModeLedgerId: string;
    paymentModeLedger: Ledger;
    totalAmountPaid: number;
    totalDiscountReceived: number;
    referenceChequeNo: string;
    notes: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    allocations: VendorPaymentAllocation[];
}
