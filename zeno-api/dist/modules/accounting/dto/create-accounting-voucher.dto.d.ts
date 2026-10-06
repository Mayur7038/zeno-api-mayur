export declare class AccountingVoucherLineDto {
    ledgerId: string;
    debitAmount?: number;
    creditAmount?: number;
    amount?: number;
    narration?: string;
}
export declare class CreateAccountingVoucherDto {
    companyId: string;
    branchId: string;
    voucherType: 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
    voucherDate: string;
    paymentMode?: string;
    referenceNo?: string;
    referenceDate?: string;
    narration?: string;
    sourceAccountLedgerId?: string;
    destinationLedgerId?: string;
    totalAmount?: number;
    lines: AccountingVoucherLineDto[];
}
