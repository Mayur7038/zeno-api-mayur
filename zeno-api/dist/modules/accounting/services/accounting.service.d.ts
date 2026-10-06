import { DataSource, EntityManager, Repository } from 'typeorm';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { AccountingVoucher } from '../entities/accounting-voucher.entity';
import { AccountingVoucherLine } from '../entities/accounting-voucher-line.entity';
import { VoucherSequenceService } from '../../procure-to-pay/services/voucher-sequence.service';
import { CreateAccountingVoucherDto } from '../dto/create-accounting-voucher.dto';
export interface LedgerPostingLine {
    ledgerId: string;
    debitAmount: number;
    creditAmount: number;
    narration?: string;
}
export interface PostVoucherParams {
    tenantId: string;
    companyId: string;
    branchId: string;
    entryDate: string;
    voucherType: string;
    voucherId: string;
    voucherNo: string;
    lines: LedgerPostingLine[];
}
export declare class AccountingService {
    private dataSource;
    private sequenceService;
    private voucherRepo;
    private voucherLineRepo;
    private entryRepo;
    constructor(dataSource: DataSource, sequenceService: VoucherSequenceService, voucherRepo: Repository<AccountingVoucher>, voucherLineRepo: Repository<AccountingVoucherLine>, entryRepo: Repository<LedgerEntry>);
    postTransaction(manager: EntityManager, params: PostVoucherParams): Promise<LedgerEntry[]>;
    reverseTransaction(manager: EntityManager, voucherType: string, voucherId: string, reversalReason: string): Promise<void>;
    createVoucher(tenantId: string, userId: string, dto: CreateAccountingVoucherDto): Promise<AccountingVoucher>;
    getVouchers(tenantId: string, companyId: string, query: {
        voucherType?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<AccountingVoucher[]>;
    getVoucherById(tenantId: string, companyId: string, id: string): Promise<any>;
    cancelVoucher(tenantId: string, userId: string, id: string, reason?: string): Promise<AccountingVoucher>;
}
