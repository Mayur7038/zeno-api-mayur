"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantSeederService = void 0;
const common_1 = require("@nestjs/common");
const company_entity_1 = require("../entities/company.entity");
const branch_entity_1 = require("../entities/branch.entity");
const godown_entity_1 = require("../entities/godown.entity");
const role_entity_1 = require("../../rbac/entities/role.entity");
const role_permission_entity_1 = require("../../rbac/entities/role-permission.entity");
const user_entity_1 = require("../../auth/entities/user.entity");
const user_branch_access_entity_1 = require("../../rbac/entities/user-branch-access.entity");
const ledger_group_entity_1 = require("../../masters/entities/ledger-group.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const unit_entity_1 = require("../../masters/entities/unit.entity");
const company_settings_entity_1 = require("../../settings/entities/company-settings.entity");
const feature_toggle_entity_1 = require("../../settings/entities/feature-toggle.entity");
const enums_1 = require("../../../common/enums");
let TenantSeederService = class TenantSeederService {
    async provisionTenantWithDefaults(manager, tenant, companyData, user) {
        const tenantId = tenant.id;
        const company = manager.create(company_entity_1.Company, {
            tenantId,
            legalName: companyData.legalName,
            tradeName: companyData.legalName,
            gstin: companyData.gstin || null,
            financialYearStart: '2025-04-01',
            currencyCode: 'INR',
        });
        await manager.save(company_entity_1.Company, company);
        const companyId = company.id;
        const branch = manager.create(branch_entity_1.Branch, {
            tenantId,
            companyId,
            branchName: 'Main Branch / Head Office',
            branchCode: 'HO',
            stateCode: companyData.stateCode || '27',
            stateName: companyData.stateName || 'Maharashtra',
            isHeadOffice: true,
            addressLine1: 'Corporate Headquarters',
            pincode: '400001',
        });
        await manager.save(branch_entity_1.Branch, branch);
        const branchId = branch.id;
        const godown = manager.create(godown_entity_1.Godown, {
            tenantId,
            companyId,
            branchId,
            name: 'Main Warehouse / Godown',
            code: 'WH-01',
            isActive: true,
        });
        await manager.save(godown_entity_1.Godown, godown);
        const adminRole = manager.create(role_entity_1.Role, {
            tenantId,
            name: enums_1.RoleType.SUPER_ADMIN,
            description: 'Super Administrator with full unrestricted access',
            isSystem: true,
        });
        await manager.save(role_entity_1.Role, adminRole);
        const standardRoles = [
            enums_1.RoleType.ADMIN,
            enums_1.RoleType.ACCOUNTANT,
            enums_1.RoleType.PURCHASE_MANAGER,
            enums_1.RoleType.STORE_KEEPER,
            enums_1.RoleType.VIEWER,
        ];
        for (const rName of standardRoles) {
            const r = manager.create(role_entity_1.Role, {
                tenantId,
                name: rName,
                description: `Standard system role for ${rName}`,
                isSystem: true,
            });
            await manager.save(role_entity_1.Role, r);
        }
        const modules = Object.values(enums_1.PermissionModule);
        const actions = Object.values(enums_1.PermissionAction);
        const rolePermissions = [];
        for (const mod of modules) {
            for (const act of actions) {
                rolePermissions.push(manager.create(role_permission_entity_1.RolePermission, {
                    roleId: adminRole.id,
                    moduleName: mod,
                    action: act,
                }));
            }
        }
        await manager.save(role_permission_entity_1.RolePermission, rolePermissions);
        user.tenantId = tenantId;
        user.roleId = adminRole.id;
        await manager.save(user_entity_1.User, user);
        const branchAccess = manager.create(user_branch_access_entity_1.UserBranchAccess, {
            userId: user.id,
            branchId,
            isDefault: true,
        });
        await manager.save(user_branch_access_entity_1.UserBranchAccess, branchAccess);
        const groupDefinitions = [
            { name: 'Capital Account', nature: enums_1.LedgerGroupNature.LIABILITY },
            { name: 'Current Liabilities', nature: enums_1.LedgerGroupNature.LIABILITY },
            {
                name: 'Sundry Creditors (Vendors)',
                nature: enums_1.LedgerGroupNature.LIABILITY,
                isCreditorVendor: true,
            },
            { name: 'Duties & Taxes', nature: enums_1.LedgerGroupNature.LIABILITY },
            { name: 'Current Assets', nature: enums_1.LedgerGroupNature.ASSET },
            {
                name: 'Sundry Debtors (Customers)',
                nature: enums_1.LedgerGroupNature.ASSET,
                isDebtorCustomer: true,
            },
            { name: 'Bank Accounts', nature: enums_1.LedgerGroupNature.ASSET },
            { name: 'Cash-in-hand', nature: enums_1.LedgerGroupNature.ASSET },
            { name: 'Stock-in-hand', nature: enums_1.LedgerGroupNature.ASSET },
            { name: 'Purchase Accounts', nature: enums_1.LedgerGroupNature.EXPENSE },
            { name: 'Direct Expenses', nature: enums_1.LedgerGroupNature.EXPENSE },
            { name: 'Indirect Expenses', nature: enums_1.LedgerGroupNature.EXPENSE },
            { name: 'Sales Accounts', nature: enums_1.LedgerGroupNature.INCOME },
            { name: 'Direct Incomes', nature: enums_1.LedgerGroupNature.INCOME },
            { name: 'Indirect Incomes', nature: enums_1.LedgerGroupNature.INCOME },
        ];
        const groupMap = new Map();
        for (const def of groupDefinitions) {
            const g = manager.create(ledger_group_entity_1.LedgerGroup, {
                tenantId,
                companyId,
                name: def.name,
                nature: def.nature,
                isCreditorVendor: def.isCreditorVendor || false,
                isDebtorCustomer: def.isDebtorCustomer || false,
                isPredefined: true,
            });
            const savedG = await manager.save(ledger_group_entity_1.LedgerGroup, g);
            groupMap.set(def.name, savedG);
        }
        const ledgerDefinitions = [
            { name: 'Cash', group: 'Cash-in-hand', balType: enums_1.BalanceType.DR },
            { name: 'Purchase Account', group: 'Purchase Accounts', balType: enums_1.BalanceType.DR },
            { name: 'Sales Account', group: 'Sales Accounts', balType: enums_1.BalanceType.CR },
            { name: 'Input CGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.DR },
            { name: 'Input SGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.DR },
            { name: 'Input IGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.DR },
            { name: 'Input Cess', group: 'Duties & Taxes', balType: enums_1.BalanceType.DR },
            { name: 'Output CGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.CR },
            { name: 'Output SGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.CR },
            { name: 'Output IGST', group: 'Duties & Taxes', balType: enums_1.BalanceType.CR },
            { name: 'Output Cess', group: 'Duties & Taxes', balType: enums_1.BalanceType.CR },
            { name: 'Discount Received', group: 'Indirect Incomes', balType: enums_1.BalanceType.CR },
            { name: 'Discount Allowed', group: 'Indirect Expenses', balType: enums_1.BalanceType.DR },
            { name: 'Round Off', group: 'Indirect Expenses', balType: enums_1.BalanceType.DR },
            { name: 'Inventory Asset', group: 'Stock-in-hand', balType: enums_1.BalanceType.DR },
        ];
        const ledgerMap = new Map();
        for (const def of ledgerDefinitions) {
            const parentGroup = groupMap.get(def.group);
            const l = manager.create(ledger_entity_1.Ledger, {
                tenantId,
                companyId,
                ledgerGroupId: parentGroup.id,
                name: def.name,
                openingBalance: 0,
                balanceType: def.balType,
                isPredefined: true,
                isActive: true,
            });
            const savedL = await manager.save(ledger_entity_1.Ledger, l);
            ledgerMap.set(def.name, savedL);
        }
        const unitDefinitions = [
            { name: 'Numbers', code: 'NOS', decimals: 0 },
            { name: 'Pieces', code: 'PCS', decimals: 0 },
            { name: 'Kilograms', code: 'KG', decimals: 3 },
            { name: 'Meters', code: 'MTR', decimals: 2 },
            { name: 'Boxes', code: 'BOX', decimals: 0 },
        ];
        for (const u of unitDefinitions) {
            const unit = manager.create(unit_entity_1.Unit, {
                tenantId,
                companyId,
                name: u.name,
                code: u.code,
                decimalPlaces: u.decimals,
                isActive: true,
            });
            await manager.save(unit_entity_1.Unit, unit);
        }
        const settings = manager.create(company_settings_entity_1.CompanySettings, {
            tenantId,
            companyId,
            gstActiveLevel: enums_1.GstActiveLevel.ITEM,
            defaultPurchaseLedgerId: ledgerMap.get('Purchase Account')?.id,
            defaultSalesLedgerId: ledgerMap.get('Sales Account')?.id,
            defaultCgstInputLedgerId: ledgerMap.get('Input CGST')?.id,
            defaultSgstInputLedgerId: ledgerMap.get('Input SGST')?.id,
            defaultIgstInputLedgerId: ledgerMap.get('Input IGST')?.id,
            defaultCessInputLedgerId: ledgerMap.get('Input Cess')?.id,
            defaultDiscountLedgerId: ledgerMap.get('Discount Received')?.id,
            defaultRoundOffLedgerId: ledgerMap.get('Round Off')?.id,
            defaultCashLedgerId: ledgerMap.get('Cash')?.id,
        });
        await manager.save(company_settings_entity_1.CompanySettings, settings);
        const toggles = [
            { key: enums_1.FeatureKey.GST, enabled: true },
            { key: enums_1.FeatureKey.PURCHASE_ORDER, enabled: true },
            { key: enums_1.FeatureKey.GRN, enabled: true },
            { key: enums_1.FeatureKey.VARIANTS, enabled: true },
            { key: enums_1.FeatureKey.RACK_BIN, enabled: true },
            { key: enums_1.FeatureKey.MANUFACTURING, enabled: false },
        ];
        for (const t of toggles) {
            const toggle = manager.create(feature_toggle_entity_1.FeatureToggle, {
                tenantId,
                companyId,
                featureKey: t.key,
                isEnabled: t.enabled,
            });
            await manager.save(feature_toggle_entity_1.FeatureToggle, toggle);
        }
        return { company, branch, role: adminRole };
    }
};
exports.TenantSeederService = TenantSeederService;
exports.TenantSeederService = TenantSeederService = __decorate([
    (0, common_1.Injectable)()
], TenantSeederService);
//# sourceMappingURL=tenant-seeder.service.js.map