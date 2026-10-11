import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
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

  async checkTransactionRecordsExist(
    tenantId: string,
    companyId: string,
    featureKey: FeatureKey,
  ): Promise<{ hasRecords: boolean; message?: string }> {
    try {
      switch (featureKey) {
        case FeatureKey.PURCHASE_ORDER: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM purchase_orders WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Purchase Orders option because ${count} Purchase Order transaction record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.GRN: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM goods_receipt_notes WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Goods Receipt Notes (GRN) option because ${count} GRN transaction record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.SALES_ORDER: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM sales_orders WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Sales Orders option because ${count} Sales Order transaction record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.DELIVERY_CHALLAN: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM delivery_challans WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Delivery Challans option because ${count} Delivery Challan transaction record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.MANUFACTURING: {
          const boms = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM boms WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const entries = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM production_entries WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const total = (boms?.[0]?.count || 0) + (entries?.[0]?.count || 0);
          if (total > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Manufacturing option because ${total} BOM / Production Entry record(s) exist. Please delete existing records first.`,
            };
          }
          break;
        }
        case FeatureKey.STOCK_TRANSFER: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM stock_transfers WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Stock Transfers option because ${count} Stock Transfer record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.STOCK_ADJUSTMENT: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM stock_adjustments WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Stock Adjustments option because ${count} Stock Adjustment record(s) exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.PRICE_LIST: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM price_lists WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Price Lists option because ${count} Price List record(s) exist. Please delete existing records first.`,
            };
          }
          break;
        }
        case FeatureKey.VARIANTS: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM variant_definitions WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Item Variants option because ${count} Variant Definition record(s) exist. Please delete existing records first.`,
            };
          }
          break;
        }
        case FeatureKey.GST: {
          const resSales = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM sales_invoices WHERE tenant_id = $1 AND company_id = $2 AND total_tax > 0`,
            [tenantId, companyId],
          );
          const resPur = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM purchase_invoices WHERE tenant_id = $1 AND company_id = $2 AND total_tax > 0`,
            [tenantId, companyId],
          );
          const total = (resSales?.[0]?.count || 0) + (resPur?.[0]?.count || 0);
          if (total > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable GST option because ${total} Invoice transaction record(s) with GST exist. Please delete existing transactions first.`,
            };
          }
          break;
        }
        case FeatureKey.RACK_BIN: {
          const res = await this.dataSource.query(
            `SELECT COUNT(*)::int as count FROM rack_bins WHERE tenant_id = $1 AND company_id = $2`,
            [tenantId, companyId],
          );
          const count = res?.[0]?.count || 0;
          if (count > 0) {
            return {
              hasRecords: true,
              message: `Cannot disable Rack/Bin Storage option because ${count} Rack/Bin location record(s) exist. Please delete existing locations first.`,
            };
          }
          break;
        }
      }
    } catch (err) {
      console.warn('Transaction record existence check warning:', err);
    }
    return { hasRecords: false };
  }

  async setFeatureToggle(
    tenantId: string,
    companyId: string,
    featureKey: FeatureKey,
    isEnabled: boolean,
  ) {
    if (isEnabled === false) {
      const check = await this.checkTransactionRecordsExist(tenantId, companyId, featureKey);
      if (check.hasRecords) {
        throw new BadRequestException(check.message);
      }
    }

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
