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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ledger_entry_entity_1 = require("../entities/ledger-entry.entity");
const accounting_service_1 = require("../services/accounting.service");
const create_accounting_voucher_dto_1 = require("../dto/create-accounting-voucher.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let AccountingController = class AccountingController {
    accountingService;
    entryRepo;
    constructor(accountingService, entryRepo) {
        this.accountingService = accountingService;
        this.entryRepo = entryRepo;
    }
    async getVouchers(tenantId, companyId, voucherType, startDate, endDate, search) {
        return await this.accountingService.getVouchers(tenantId, companyId, {
            voucherType,
            startDate,
            endDate,
            search,
        });
    }
    async getVoucherById(tenantId, companyId, id) {
        return await this.accountingService.getVoucherById(tenantId, companyId, id);
    }
    async createVoucher(tenantId, user, dto) {
        return await this.accountingService.createVoucher(tenantId, user?.id, dto);
    }
    async cancelVoucher(tenantId, user, id, reason) {
        return await this.accountingService.cancelVoucher(tenantId, user?.id, id, reason);
    }
    async getLedgerStatement(tenantId, companyId, ledgerId, startDate, endDate) {
        const qb = this.entryRepo
            .createQueryBuilder('e')
            .where('e.tenant_id = :tenantId', { tenantId })
            .andWhere('e.company_id = :companyId', { companyId })
            .andWhere('e.ledger_id = :ledgerId', { ledgerId });
        if (startDate)
            qb.andWhere('e.entry_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('e.entry_date <= :endDate', { endDate });
        const entries = await qb.orderBy('e.entry_date', 'ASC').addOrderBy('e.created_at', 'ASC').getMany();
        const totalDebit = entries.reduce((s, e) => s + Number(e.debitAmount), 0);
        const totalCredit = entries.reduce((s, e) => s + Number(e.creditAmount), 0);
        return {
            ledgerId,
            totalDebit: Number(totalDebit.toFixed(2)),
            totalCredit: Number(totalCredit.toFixed(2)),
            netBalance: Number((totalDebit - totalCredit).toFixed(2)),
            entries,
        };
    }
    async getTrialBalance(tenantId, companyId) {
        const raw = await this.entryRepo
            .createQueryBuilder('e')
            .innerJoin('e.ledger', 'ledger')
            .select('ledger.id', 'ledgerId')
            .addSelect('ledger.name', 'ledgerName')
            .addSelect('SUM(e.debit_amount)', 'totalDebit')
            .addSelect('SUM(e.credit_amount)', 'totalCredit')
            .where('e.tenant_id = :tenantId', { tenantId })
            .andWhere('e.company_id = :companyId', { companyId })
            .groupBy('ledger.id')
            .addGroupBy('ledger.name')
            .getRawMany();
        let grandDebit = 0;
        let grandCredit = 0;
        const rows = raw.map((r) => {
            const dr = Number(r.totalDebit || 0);
            const cr = Number(r.totalCredit || 0);
            grandDebit += dr;
            grandCredit += cr;
            return {
                ledgerId: r.ledgerId,
                ledgerName: r.ledgerName,
                debit: Number(dr.toFixed(2)),
                credit: Number(cr.toFixed(2)),
                balance: Number((dr - cr).toFixed(2)),
            };
        });
        return {
            totalDebit: Number(grandDebit.toFixed(2)),
            totalCredit: Number(grandCredit.toFixed(2)),
            isBalanced: Math.abs(grandDebit - grandCredit) < 0.05,
            rows,
        };
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Get)('vouchers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of accounting vouchers (Payment, Receipt, Contra, Journal, Debit/Credit Notes)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('voucherType')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getVouchers", null);
__decorate([
    (0, common_1.Get)('vouchers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get voucher details with lines and general ledger postings' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getVoucherById", null);
__decorate([
    (0, common_1.Post)('vouchers'),
    (0, swagger_1.ApiOperation)({ summary: 'Create accounting voucher and post double-entry ledger entries' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_accounting_voucher_dto_1.CreateAccountingVoucherDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createVoucher", null);
__decorate([
    (0, common_1.Put)('vouchers/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel voucher and reverse general ledger entries' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "cancelVoucher", null);
__decorate([
    (0, common_1.Get)('ledger-statement'),
    (0, swagger_1.ApiOperation)({ summary: 'Get statement of entries for a ledger' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('ledgerId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getLedgerStatement", null);
__decorate([
    (0, common_1.Get)('trial-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate balanced Trial Balance report' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getTrialBalance", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('Accounting & Ledgers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('accounting'),
    __param(1, (0, typeorm_1.InjectRepository)(ledger_entry_entity_1.LedgerEntry)),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService,
        typeorm_2.Repository])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map