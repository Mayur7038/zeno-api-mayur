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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettings = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
let CompanySettings = class CompanySettings {
    id;
    tenantId;
    companyId;
    gstActiveLevel;
    defaultPurchaseLedgerId;
    defaultSalesLedgerId;
    defaultCgstInputLedgerId;
    defaultSgstInputLedgerId;
    defaultIgstInputLedgerId;
    defaultCgstOutputLedgerId;
    defaultSgstOutputLedgerId;
    defaultIgstOutputLedgerId;
    defaultCessInputLedgerId;
    defaultDiscountLedgerId;
    defaultRoundOffLedgerId;
    defaultCashLedgerId;
    defaultBankLedgerId;
    defaultDiscountAllowedLedgerId;
    defaultDiscountReceivedLedgerId;
    defaultSalesReturnLedgerId;
    defaultPurchaseReturnLedgerId;
    defaultFreightLedgerId;
    voucherConfig;
    salesSettings;
    purchaseSettings;
    inventorySettings;
    createdAt;
    updatedAt;
};
exports.CompanySettings = CompanySettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompanySettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'gst_active_level',
        type: 'enum',
        enum: enums_1.GstActiveLevel,
        default: enums_1.GstActiveLevel.ITEM,
    }),
    __metadata("design:type", String)
], CompanySettings.prototype, "gstActiveLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_purchase_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultPurchaseLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_sales_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultSalesLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_cgst_input_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultCgstInputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_sgst_input_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultSgstInputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_igst_input_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultIgstInputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_cgst_output_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultCgstOutputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_sgst_output_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultSgstOutputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_igst_output_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultIgstOutputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_cess_input_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultCessInputLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_discount_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultDiscountLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_round_off_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultRoundOffLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_cash_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultCashLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_bank_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultBankLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_discount_allowed_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultDiscountAllowedLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_discount_received_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultDiscountReceivedLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_sales_return_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultSalesReturnLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_purchase_return_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultPurchaseReturnLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_freight_ledger_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "defaultFreightLedgerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_config', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CompanySettings.prototype, "voucherConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_settings', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CompanySettings.prototype, "salesSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_settings', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CompanySettings.prototype, "purchaseSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inventory_settings', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CompanySettings.prototype, "inventorySettings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CompanySettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CompanySettings.prototype, "updatedAt", void 0);
exports.CompanySettings = CompanySettings = __decorate([
    (0, typeorm_1.Entity)('company_settings'),
    (0, typeorm_1.Unique)(['companyId'])
], CompanySettings);
//# sourceMappingURL=company-settings.entity.js.map