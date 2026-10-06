import { Ledger } from '../../masters/entities/ledger.entity';
export declare class LedgerEntry {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    entryDate: string;
    voucherType: string;
    voucherId: string;
    voucherNo: string;
    ledgerId: string;
    ledger: Ledger;
    debitAmount: number;
    creditAmount: number;
    narration: string;
    createdAt: Date;
}
