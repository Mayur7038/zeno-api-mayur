import { FinancialYearService } from '../services/financial-year.service';
export declare class FinancialYearController {
    private fyService;
    constructor(fyService: FinancialYearService);
    getFinancialYears(tenantId: string, companyId: string): Promise<import("../entities/financial-year.entity").FinancialYear[]>;
    getCurrentFinancialYear(tenantId: string, companyId: string): Promise<import("../entities/financial-year.entity").FinancialYear>;
    createFinancialYear(tenantId: string, body: {
        companyId: string;
        name: string;
        startDate: string;
        endDate: string;
    }): Promise<import("../entities/financial-year.entity").FinancialYear>;
    closeFinancialYear(tenantId: string, body: {
        companyId: string;
        fyId?: string;
        closingNotes?: string;
    }): Promise<{
        closedFy: import("../entities/financial-year.entity").FinancialYear;
        newFy: import("../entities/financial-year.entity").FinancialYear;
        transferredLedgersCount: number;
        message: string;
    }>;
    switchFinancialYear(tenantId: string, body: {
        companyId: string;
        fyId: string;
    }): Promise<import("../entities/financial-year.entity").FinancialYear>;
}
