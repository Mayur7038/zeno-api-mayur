"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_settings_entity_1 = require("../entities/company-settings.entity");
const feature_toggle_entity_1 = require("../entities/feature-toggle.entity");
const tax_master_entity_1 = require("../entities/tax-master.entity");
const enums_1 = require("../../../common/enums");
let SettingsService = class SettingsService {
    settingsRepo;
    toggleRepo;
    taxMasterRepo;
    constructor(settingsRepo, toggleRepo, taxMasterRepo) {
        this.settingsRepo = settingsRepo;
        this.toggleRepo = toggleRepo;
        this.taxMasterRepo = taxMasterRepo;
    }
    async getSettings(tenantId, companyId) {
        let settings = await this.settingsRepo.findOne({
            where: { tenantId, companyId },
        });
        if (!settings) {
            settings = this.settingsRepo.create({
                tenantId,
                companyId,
                gstActiveLevel: enums_1.GstActiveLevel.ITEM,
                voucherConfig: this.getDefaultVoucherConfig(),
                salesSettings: this.getDefaultSalesSettings(),
                purchaseSettings: this.getDefaultPurchaseSettings(),
                inventorySettings: this.getDefaultInventorySettings(),
            });
            await this.settingsRepo.save(settings);
        }
        else {
            let needsSave = false;
            if (!settings.voucherConfig) {
                settings.voucherConfig = this.getDefaultVoucherConfig();
                needsSave = true;
            }
            if (!settings.salesSettings) {
                settings.salesSettings = this.getDefaultSalesSettings();
                needsSave = true;
            }
            if (!settings.purchaseSettings) {
                settings.purchaseSettings = this.getDefaultPurchaseSettings();
                needsSave = true;
            }
            if (!settings.inventorySettings) {
                settings.inventorySettings = this.getDefaultInventorySettings();
                needsSave = true;
            }
            if (needsSave) {
                await this.settingsRepo.save(settings);
            }
        }
        return settings;
    }
    getDefaultVoucherConfig() {
        return {
            PO: { name: 'Purchase Order', prefix: 'PO-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            GRN: { name: 'Goods Receipt Note', prefix: 'GRN-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            PI: { name: 'Purchase Invoice', prefix: 'PI-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            PR: { name: 'Purchase Return', prefix: 'PR-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            VP: { name: 'Vendor Payment', prefix: 'PMT-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            SO: { name: 'Sales Order', prefix: 'SO-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            DC: { name: 'Delivery Challan', prefix: 'DC-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            SI: { name: 'Sales Invoice', prefix: 'INV-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            SR: { name: 'Sales Return', prefix: 'SR-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            CR: { name: 'Customer Receipt', prefix: 'RCP-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            PAYMENT: { name: 'Payment Voucher', prefix: 'PAY/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            RECEIPT: { name: 'Receipt Voucher', prefix: 'REC/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            CONTRA: { name: 'Contra Voucher', prefix: 'CTR/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            JOURNAL: { name: 'Journal Voucher', prefix: 'JRN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            DEBIT_NOTE: { name: 'Debit Note', prefix: 'DN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            CREDIT_NOTE: { name: 'Credit Note', prefix: 'CN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            PRODUCTION: { name: 'Production Entry', prefix: 'PRD/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
            BOM: { name: 'Bill of Materials', prefix: 'BOM/', suffix: '', startingNumber: 1, padding: 3, resetFrequency: 'NEVER', isAuto: true },
        };
    }
    getDefaultSalesSettings() {
        return {
            defaultCreditPeriod: 30,
            ewayBillThreshold: 50000,
            einvoiceThreshold: 50000000,
            enableRoundOff: true,
            allowSalesBelowCost: false,
            allowNegativeStockSale: false,
            creditLimitAction: 'WARN',
            printTemplate: 'TAX_INVOICE_GST',
            termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged for delayed payments beyond due date.\n3. Subject to local state jurisdiction only.',
        };
    }
    getDefaultPurchaseSettings() {
        return {
            poApprovalThreshold: 100000,
            autoGrnFromPo: false,
            autoInvoiceFromGrn: false,
            enforceThreeWayMatch: true,
            debitNoteAutoItcReversal: true,
            defaultVendorCreditDays: 30,
            strictPriceVariancePercent: 5,
        };
    }
    getDefaultInventorySettings() {
        return {
            allowNegativeStock: false,
            valuationMethod: 'FIFO',
            mandatoryBatchTracking: false,
            mandatorySerialNumber: false,
            autoGenerateBarcodes: true,
            lowStockAlertEnabled: true,
            godownTransferVerification: true,
        };
    }
    async updateSettings(tenantId, companyId, data) {
        const settings = await this.getSettings(tenantId, companyId);
        Object.assign(settings, data);
        return this.settingsRepo.save(settings);
    }
    async getFeatureToggles(tenantId, companyId) {
        let toggles = await this.toggleRepo.find({ where: { tenantId, companyId } });
        if (toggles.length === 0) {
            const keys = Object.values(enums_1.FeatureKey);
            const newToggles = keys.map((key) => this.toggleRepo.create({
                tenantId,
                companyId,
                featureKey: key,
                isEnabled: true,
            }));
            toggles = await this.toggleRepo.save(newToggles);
        }
        return toggles;
    }
    async setFeatureToggle(tenantId, companyId, featureKey, isEnabled) {
        let toggle = await this.toggleRepo.findOne({
            where: { tenantId, companyId, featureKey },
        });
        if (!toggle) {
            toggle = this.toggleRepo.create({
                tenantId,
                companyId,
                featureKey,
                isEnabled,
            });
        }
        else {
            toggle.isEnabled = isEnabled;
        }
        return this.toggleRepo.save(toggle);
    }
    async isFeatureEnabled(tenantId, companyId, featureKey) {
        const toggle = await this.toggleRepo.findOne({
            where: { tenantId, companyId, featureKey },
        });
        return toggle ? toggle.isEnabled : true;
    }
    async getTaxMasters(tenantId, companyId) {
        return this.taxMasterRepo.find({
            where: { tenantId, companyId },
            order: { taxRate: 'ASC' },
        });
    }
    async createTaxMaster(tenantId, companyId, data) {
        const tax = this.taxMasterRepo.create({
            ...data,
            tenantId,
            companyId,
        });
        return this.taxMasterRepo.save(tax);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_settings_entity_1.CompanySettings)),
    __param(1, (0, typeorm_1.InjectRepository)(feature_toggle_entity_1.FeatureToggle)),
    __param(2, (0, typeorm_1.InjectRepository)(tax_master_entity_1.TaxMaster)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map