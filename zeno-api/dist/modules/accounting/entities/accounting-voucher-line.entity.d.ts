import { AccountingVoucher } from './accounting-voucher.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
export declare class AccountingVoucherLine {
    id: string;
    voucherId: string;
    voucher: AccountingVoucher;
    ledgerId: string;
    ledger: Ledger;
    debitAmount: number;
    creditAmount: number;
    narration: string;
}
