import { Repository } from 'typeorm';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { AccountingService } from '../services/accounting.service';
import { CreateAccountingVoucherDto } from '../dto/create-accounting-voucher.dto';
export declare class AccountingController {
    private accountingService;
    private entryRepo;
    constructor(accountingService: AccountingService, entryRepo: Repository<LedgerEntry>);
    getVouchers(tenantId: string, companyId: string, voucherType?: string, startDate?: string, endDate?: string, search?: string): Promise<import("../entities/accounting-voucher.entity").AccountingVoucher[]>;
    getVoucherById(tenantId: string, companyId: string, id: string): Promise<any>;
    createVoucher(tenantId: string, user: any, dto: CreateAccountingVoucherDto): Promise<import("../entities/accounting-voucher.entity").AccountingVoucher>;
    cancelVoucher(tenantId: string, user: any, id: string, reason?: string): Promise<import("../entities/accounting-voucher.entity").AccountingVoucher>;
    getLedgerStatement(tenantId: string, companyId: string, ledgerId: string, startDate?: string, endDate?: string): Promise<{
        ledgerId: string;
        totalDebit: number;
        totalCredit: number;
        netBalance: number;
        entries: LedgerEntry[];
    }>;
    getTrialBalance(tenantId: string, companyId: string): Promise<{
        totalDebit: number;
        totalCredit: number;
        isBalanced: boolean;
        rows: {
            ledgerId: any;
            ledgerName: any;
            debit: number;
            credit: number;
            balance: number;
        }[];
    }>;
}
