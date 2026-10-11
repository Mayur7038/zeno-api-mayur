import { Repository, DataSource } from 'typeorm';
import { FinancialYear } from '../entities/financial-year.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
export declare class FinancialYearService {
    private fyRepo;
    private ledgerRepo;
    private dataSource;
    constructor(fyRepo: Repository<FinancialYear>, ledgerRepo: Repository<Ledger>, dataSource: DataSource);
    getFinancialYears(tenantId: string, companyId: string): Promise<FinancialYear[]>;
    getCurrentFinancialYear(tenantId: string, companyId: string): Promise<FinancialYear>;
    createFinancialYear(tenantId: string, companyId: string, data: {
        name: string;
        startDate: string;
        endDate: string;
    }): Promise<FinancialYear>;
    closeFinancialYearAndTransferBalances(tenantId: string, companyId: string, data: {
        fyId?: string;
        closingNotes?: string;
    }): Promise<{
        closedFy: FinancialYear;
        newFy: FinancialYear;
        transferredLedgersCount: number;
        message: string;
    }>;
    setCurrentFinancialYear(tenantId: string, companyId: string, fyId: string): Promise<FinancialYear>;
}
