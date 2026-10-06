import { Branch } from '../../tenancy/entities/branch.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { AccountingVoucherLine } from './accounting-voucher-line.entity';
export declare class AccountingVoucher {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    voucherType: string;
    voucherNo: string;
    voucherDate: string;
    totalAmount: number;
    paymentMode: string;
    referenceNo: string;
    referenceDate: string;
    narration: string;
    sourceAccountLedgerId: string;
    sourceAccountLedger: Ledger;
    status: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lines: AccountingVoucherLine[];
}
