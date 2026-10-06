import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySettings } from '../entities/company-settings.entity';
import { FeatureToggle } from '../entities/feature-toggle.entity';
import { TaxMaster } from '../entities/tax-master.entity';
import { FeatureKey, GstActiveLevel } from '../../../common/enums';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(CompanySettings)
    private settingsRepo: Repository<CompanySettings>,
    @InjectRepository(FeatureToggle)
    private toggleRepo: Repository<FeatureToggle>,
    @InjectRepository(TaxMaster)
    private taxMasterRepo: Repository<TaxMaster>,
  ) {}

  async getSettings(tenantId: string, companyId: string) {
    let settings = await this.settingsRepo.findOne({
      where: { tenantId, companyId },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        tenantId,
        companyId,
        gstActiveLevel: GstActiveLevel.ITEM,
        voucherConfig: this.getDefaultVoucherConfig(),
        salesSettings: this.getDefaultSalesSettings(),
        purchaseSettings: this.getDefaultPurchaseSettings(),
        inventorySettings: this.getDefaultInventorySettings(),
      });
      await this.settingsRepo.save(settings);
    } else {
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

  async updateSettings(tenantId: string, companyId: string, data: Partial<CompanySettings>) {
    const settings = await this.getSettings(tenantId, companyId);
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }

  async getFeatureToggles(tenantId: string, companyId: string) {
    let toggles = await this.toggleRepo.find({ where: { tenantId, companyId } });
    if (toggles.length === 0) {
      const keys = Object.values(FeatureKey);
      const newToggles = keys.map((key) =>
        this.toggleRepo.create({
          tenantId,
          companyId,
          featureKey: key,
          isEnabled: true,
        }),
      );
      toggles = await this.toggleRepo.save(newToggles);
    }
    return toggles;
  }

  async setFeatureToggle(
    tenantId: string,
    companyId: string,
    featureKey: FeatureKey,
    isEnabled: boolean,
  ) {
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
    } else {
      toggle.isEnabled = isEnabled;
    }
    return this.toggleRepo.save(toggle);
  }

  async isFeatureEnabled(
    tenantId: string,
    companyId: string,
    featureKey: FeatureKey,
  ): Promise<boolean> {
    const toggle = await this.toggleRepo.findOne({
      where: { tenantId, companyId, featureKey },
    });
    return toggle ? toggle.isEnabled : true;
  }

  // Tax Masters
  async getTaxMasters(tenantId: string, companyId: string) {
    return this.taxMasterRepo.find({
      where: { tenantId, companyId },
      order: { taxRate: 'ASC' },
    });
  }

  async createTaxMaster(tenantId: string, companyId: string, data: Partial<TaxMaster>) {
    const tax = this.taxMasterRepo.create({
      ...data,
      tenantId,
      companyId,
    });
    return this.taxMasterRepo.save(tax);
  }
}
