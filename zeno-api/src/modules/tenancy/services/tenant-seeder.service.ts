import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { Company } from '../entities/company.entity';
import { Branch } from '../entities/branch.entity';
import { Godown } from '../entities/godown.entity';
import { Role } from '../../rbac/entities/role.entity';
import { RolePermission } from '../../rbac/entities/role-permission.entity';
import { User } from '../../auth/entities/user.entity';
import { UserBranchAccess } from '../../rbac/entities/user-branch-access.entity';
import { LedgerGroup } from '../../masters/entities/ledger-group.entity';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Unit } from '../../masters/entities/unit.entity';
import { CompanySettings } from '../../settings/entities/company-settings.entity';
import { FeatureToggle } from '../../settings/entities/feature-toggle.entity';
import {
  BalanceType,
  FeatureKey,
  GstActiveLevel,
  LedgerGroupNature,
  PermissionAction,
  PermissionModule,
  RoleType,
} from '../../../common/enums';

@Injectable()
export class TenantSeederService {
  /**
   * Seeds all required enterprise masters, settings, toggles, groups, ledgers, and roles for a new tenant.
   */
  async provisionTenantWithDefaults(
    manager: EntityManager,
    tenant: Tenant,
    companyData: {
      legalName: string;
      gstin?: string;
      stateCode?: string;
      stateName?: string;
    },
    user: User,
  ): Promise<{ company: Company; branch: Branch; role: Role }> {
    const tenantId = tenant.id;

    // 1. Create Company
    const company = manager.create(Company, {
      tenantId,
      legalName: companyData.legalName,
      tradeName: companyData.legalName,
      gstin: companyData.gstin || null,
      financialYearStart: '2025-04-01',
      currencyCode: 'INR',
    });
    await manager.save(Company, company);
    const companyId = company.id;

    // 2. Create Default Branch (Head Office)
    const branch = manager.create(Branch, {
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
    await manager.save(Branch, branch);
    const branchId = branch.id;

    // 3. Create Default Godown
    const godown = manager.create(Godown, {
      tenantId,
      companyId,
      branchId,
      name: 'Main Warehouse / Godown',
      code: 'WH-01',
      isActive: true,
    });
    await manager.save(Godown, godown);

    // 4. Create Standard Roles and Full Permissions
    const adminRole = manager.create(Role, {
      tenantId,
      name: RoleType.SUPER_ADMIN,
      description: 'Super Administrator with full unrestricted access',
      isSystem: true,
    });
    await manager.save(Role, adminRole);

    const standardRoles = [
      RoleType.ADMIN,
      RoleType.ACCOUNTANT,
      RoleType.PURCHASE_MANAGER,
      RoleType.STORE_KEEPER,
      RoleType.VIEWER,
    ];

    for (const rName of standardRoles) {
      const r = manager.create(Role, {
        tenantId,
        name: rName,
        description: `Standard system role for ${rName}`,
        isSystem: true,
      });
      await manager.save(Role, r);
    }

    // Populate all permissions for SUPER_ADMIN
    const modules = Object.values(PermissionModule);
    const actions = Object.values(PermissionAction);
    const rolePermissions: RolePermission[] = [];

    for (const mod of modules) {
      for (const act of actions) {
        rolePermissions.push(
          manager.create(RolePermission, {
            roleId: adminRole.id,
            moduleName: mod,
            action: act,
          }),
        );
      }
    }
    await manager.save(RolePermission, rolePermissions);

    // Update user role and assign branch access
    user.tenantId = tenantId;
    user.roleId = adminRole.id;
    await manager.save(User, user);

    const branchAccess = manager.create(UserBranchAccess, {
      userId: user.id,
      branchId,
      isDefault: true,
    });
    await manager.save(UserBranchAccess, branchAccess);

    // 5. Create Tally-style Standard Ledger Groups
    const groupDefinitions = [
      { name: 'Capital Account', nature: LedgerGroupNature.LIABILITY },
      { name: 'Current Liabilities', nature: LedgerGroupNature.LIABILITY },
      {
        name: 'Sundry Creditors (Vendors)',
        nature: LedgerGroupNature.LIABILITY,
        isCreditorVendor: true,
      },
      { name: 'Duties & Taxes', nature: LedgerGroupNature.LIABILITY },
      { name: 'Current Assets', nature: LedgerGroupNature.ASSET },
      {
        name: 'Sundry Debtors (Customers)',
        nature: LedgerGroupNature.ASSET,
        isDebtorCustomer: true,
      },
      { name: 'Bank Accounts', nature: LedgerGroupNature.ASSET },
      { name: 'Cash-in-hand', nature: LedgerGroupNature.ASSET },
      { name: 'Stock-in-hand', nature: LedgerGroupNature.ASSET },
      { name: 'Purchase Accounts', nature: LedgerGroupNature.EXPENSE },
      { name: 'Direct Expenses', nature: LedgerGroupNature.EXPENSE },
      { name: 'Indirect Expenses', nature: LedgerGroupNature.EXPENSE },
      { name: 'Sales Accounts', nature: LedgerGroupNature.INCOME },
      { name: 'Direct Incomes', nature: LedgerGroupNature.INCOME },
      { name: 'Indirect Incomes', nature: LedgerGroupNature.INCOME },
    ];

    const groupMap = new Map<string, LedgerGroup>();
    for (const def of groupDefinitions) {
      const g = manager.create(LedgerGroup, {
        tenantId,
        companyId,
        name: def.name,
        nature: def.nature,
        isCreditorVendor: def.isCreditorVendor || false,
        isDebtorCustomer: def.isDebtorCustomer || false,
        isPredefined: true,
      });
      const savedG = await manager.save(LedgerGroup, g);
      groupMap.set(def.name, savedG);
    }

    // 6. Create Standard Ledgers
    const ledgerDefinitions = [
      { name: 'Cash', group: 'Cash-in-hand', balType: BalanceType.DR },
      { name: 'Purchase Account', group: 'Purchase Accounts', balType: BalanceType.DR },
      { name: 'Sales Account', group: 'Sales Accounts', balType: BalanceType.CR },
      { name: 'Input CGST', group: 'Duties & Taxes', balType: BalanceType.DR },
      { name: 'Input SGST', group: 'Duties & Taxes', balType: BalanceType.DR },
      { name: 'Input IGST', group: 'Duties & Taxes', balType: BalanceType.DR },
      { name: 'Input Cess', group: 'Duties & Taxes', balType: BalanceType.DR },
      { name: 'Output CGST', group: 'Duties & Taxes', balType: BalanceType.CR },
      { name: 'Output SGST', group: 'Duties & Taxes', balType: BalanceType.CR },
      { name: 'Output IGST', group: 'Duties & Taxes', balType: BalanceType.CR },
      { name: 'Output Cess', group: 'Duties & Taxes', balType: BalanceType.CR },
      { name: 'Discount Received', group: 'Indirect Incomes', balType: BalanceType.CR },
      { name: 'Discount Allowed', group: 'Indirect Expenses', balType: BalanceType.DR },
      { name: 'Round Off', group: 'Indirect Expenses', balType: BalanceType.DR },
      { name: 'Inventory Asset', group: 'Stock-in-hand', balType: BalanceType.DR },
    ];

    const ledgerMap = new Map<string, Ledger>();
    for (const def of ledgerDefinitions) {
      const parentGroup = groupMap.get(def.group);
      const l = manager.create(Ledger, {
        tenantId,
        companyId,
        ledgerGroupId: parentGroup.id,
        name: def.name,
        openingBalance: 0,
        balanceType: def.balType,
        isPredefined: true,
        isActive: true,
      });
      const savedL = await manager.save(Ledger, l);
      ledgerMap.set(def.name, savedL);
    }

    // 7. Seed Default Units
    const unitDefinitions = [
      { name: 'Numbers', code: 'NOS', decimals: 0 },
      { name: 'Pieces', code: 'PCS', decimals: 0 },
      { name: 'Kilograms', code: 'KG', decimals: 3 },
      { name: 'Meters', code: 'MTR', decimals: 2 },
      { name: 'Boxes', code: 'BOX', decimals: 0 },
    ];

    for (const u of unitDefinitions) {
      const unit = manager.create(Unit, {
        tenantId,
        companyId,
        name: u.name,
        code: u.code,
        decimalPlaces: u.decimals,
        isActive: true,
      });
      await manager.save(Unit, unit);
    }

    // 8. Create CompanySettings
    const settings = manager.create(CompanySettings, {
      tenantId,
      companyId,
      gstActiveLevel: GstActiveLevel.ITEM,
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
    await manager.save(CompanySettings, settings);

    // 9. Create Feature Toggles
    const toggles = [
      { key: FeatureKey.GST, enabled: true },
      { key: FeatureKey.PURCHASE_ORDER, enabled: true },
      { key: FeatureKey.GRN, enabled: true },
      { key: FeatureKey.VARIANTS, enabled: true },
      { key: FeatureKey.RACK_BIN, enabled: true },
      { key: FeatureKey.MANUFACTURING, enabled: false }, // Coming soon
    ];

    for (const t of toggles) {
      const toggle = manager.create(FeatureToggle, {
        tenantId,
        companyId,
        featureKey: t.key,
        isEnabled: t.enabled,
      });
      await manager.save(FeatureToggle, toggle);
    }

    return { company, branch, role: adminRole };
  }
}
