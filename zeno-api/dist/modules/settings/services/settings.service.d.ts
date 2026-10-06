import { Repository } from 'typeorm';
import { CompanySettings } from '../entities/company-settings.entity';
import { FeatureToggle } from '../entities/feature-toggle.entity';
import { TaxMaster } from '../entities/tax-master.entity';
import { FeatureKey } from '../../../common/enums';
export declare class SettingsService {
    private settingsRepo;
    private toggleRepo;
    private taxMasterRepo;
    constructor(settingsRepo: Repository<CompanySettings>, toggleRepo: Repository<FeatureToggle>, taxMasterRepo: Repository<TaxMaster>);
    getSettings(tenantId: string, companyId: string): Promise<CompanySettings>;
    getDefaultVoucherConfig(): {
        PO: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        GRN: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        PI: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        PR: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        VP: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        SO: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        DC: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        SI: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        SR: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        CR: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        PAYMENT: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        RECEIPT: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        CONTRA: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        JOURNAL: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        DEBIT_NOTE: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        CREDIT_NOTE: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        PRODUCTION: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
        BOM: {
            name: string;
            prefix: string;
            suffix: string;
            startingNumber: number;
            padding: number;
            resetFrequency: string;
            isAuto: boolean;
        };
    };
    getDefaultSalesSettings(): {
        defaultCreditPeriod: number;
        ewayBillThreshold: number;
        einvoiceThreshold: number;
        enableRoundOff: boolean;
        allowSalesBelowCost: boolean;
        allowNegativeStockSale: boolean;
        creditLimitAction: string;
        printTemplate: string;
        termsAndConditions: string;
    };
    getDefaultPurchaseSettings(): {
        poApprovalThreshold: number;
        autoGrnFromPo: boolean;
        autoInvoiceFromGrn: boolean;
        enforceThreeWayMatch: boolean;
        debitNoteAutoItcReversal: boolean;
        defaultVendorCreditDays: number;
        strictPriceVariancePercent: number;
    };
    getDefaultInventorySettings(): {
        allowNegativeStock: boolean;
        valuationMethod: string;
        mandatoryBatchTracking: boolean;
        mandatorySerialNumber: boolean;
        autoGenerateBarcodes: boolean;
        lowStockAlertEnabled: boolean;
        godownTransferVerification: boolean;
    };
    updateSettings(tenantId: string, companyId: string, data: Partial<CompanySettings>): Promise<CompanySettings>;
    getFeatureToggles(tenantId: string, companyId: string): Promise<FeatureToggle[]>;
    setFeatureToggle(tenantId: string, companyId: string, featureKey: FeatureKey, isEnabled: boolean): Promise<FeatureToggle>;
    isFeatureEnabled(tenantId: string, companyId: string, featureKey: FeatureKey): Promise<boolean>;
    getTaxMasters(tenantId: string, companyId: string): Promise<TaxMaster[]>;
    createTaxMaster(tenantId: string, companyId: string, data: Partial<TaxMaster>): Promise<TaxMaster>;
}
