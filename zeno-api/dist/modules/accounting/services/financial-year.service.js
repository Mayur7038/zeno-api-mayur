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
exports.FinancialYearService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const financial_year_entity_1 = require("../entities/financial-year.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const enums_1 = require("../../../common/enums");
let FinancialYearService = class FinancialYearService {
    fyRepo;
    ledgerRepo;
    dataSource;
    constructor(fyRepo, ledgerRepo, dataSource) {
        this.fyRepo = fyRepo;
        this.ledgerRepo = ledgerRepo;
        this.dataSource = dataSource;
    }
    async getFinancialYears(tenantId, companyId) {
        let years = await this.fyRepo.find({
            where: { tenantId, companyId },
            order: { startDate: 'DESC' },
        });
        if (years.length === 0) {
            const initialFy = this.fyRepo.create({
                tenantId,
                companyId,
                name: 'F.Y. 2025-2026',
                startDate: '2025-04-01',
                endDate: '2026-03-31',
                isClosed: false,
                isCurrent: true,
            });
            const saved = await this.fyRepo.save(initialFy);
            years = [saved];
        }
        return years;
    }
    async getCurrentFinancialYear(tenantId, companyId) {
        const years = await this.getFinancialYears(tenantId, companyId);
        let current = years.find((y) => y.isCurrent);
        if (!current) {
            current = years.find((y) => !y.isClosed) || years[0];
        }
        return current;
    }
    async createFinancialYear(tenantId, companyId, data) {
        const years = await this.getFinancialYears(tenantId, companyId);
        const openFy = years.find((y) => !y.isClosed);
        if (openFy) {
            throw new common_1.BadRequestException(`Cannot create a new Financial Year. The current active Financial Year ('${openFy.name}') must be closed first before opening a new Financial Year.`);
        }
        await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });
        const newFy = this.fyRepo.create({
            tenantId,
            companyId,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            isClosed: false,
            isCurrent: true,
        });
        return this.fyRepo.save(newFy);
    }
    async closeFinancialYearAndTransferBalances(tenantId, companyId, data) {
        const years = await this.getFinancialYears(tenantId, companyId);
        let targetFy;
        if (data.fyId) {
            targetFy = years.find((y) => y.id === data.fyId);
        }
        else {
            targetFy = years.find((y) => !y.isClosed);
        }
        if (!targetFy) {
            throw new common_1.NotFoundException('No active open Financial Year found to close.');
        }
        if (targetFy.isClosed) {
            throw new common_1.BadRequestException(`Financial Year '${targetFy.name}' is already closed.`);
        }
        const ledgers = await this.ledgerRepo.find({
            where: { tenantId, companyId },
            relations: ['ledgerGroup'],
        });
        const balanceSheetNatures = [
            enums_1.LedgerGroupNature.ASSET,
            enums_1.LedgerGroupNature.LIABILITY,
        ];
        const balanceSheetLedgers = ledgers.filter((l) => l.ledgerGroup && balanceSheetNatures.includes(l.ledgerGroup.nature));
        for (const ledger of balanceSheetLedgers) {
            const lineRes = await this.dataSource.query(`SELECT 
           COALESCE(SUM(l.debit_amount), 0)::numeric as total_debit,
           COALESCE(SUM(l.credit_amount), 0)::numeric as total_credit
         FROM accounting_voucher_lines l
         INNER JOIN accounting_vouchers v ON v.id = l.voucher_id
         WHERE l.ledger_id = $1 
           AND v.tenant_id = $2 
           AND v.company_id = $3
           AND v.voucher_date >= $4 
           AND v.voucher_date <= $5`, [ledger.id, tenantId, companyId, targetFy.startDate, targetFy.endDate]);
            const totalDebit = parseFloat(lineRes?.[0]?.total_debit || '0');
            const totalCredit = parseFloat(lineRes?.[0]?.total_credit || '0');
            const initialOpening = Number(ledger.openingBalance || 0);
            const initialType = ledger.balanceType === enums_1.BalanceType.CR ? -1 : 1;
            const netClosing = initialOpening * initialType + (totalDebit - totalCredit);
            if (netClosing >= 0) {
                ledger.openingBalance = Number(netClosing.toFixed(2));
                ledger.balanceType = enums_1.BalanceType.DR;
            }
            else {
                ledger.openingBalance = Number(Math.abs(netClosing).toFixed(2));
                ledger.balanceType = enums_1.BalanceType.CR;
            }
            await this.ledgerRepo.save(ledger);
        }
        targetFy.isClosed = true;
        targetFy.closedAt = new Date();
        targetFy.isCurrent = false;
        targetFy.closingNotes = data.closingNotes || 'Closed & transferred closing balances to new F.Y.';
        await this.fyRepo.save(targetFy);
        const startYear = parseInt(targetFy.startDate.substring(0, 4), 10) + 1;
        const endYear = parseInt(targetFy.endDate.substring(0, 4), 10) + 1;
        const nextStartDate = `${startYear}-04-01`;
        const nextEndDate = `${endYear}-03-31`;
        const nextName = `F.Y. ${startYear}-${endYear}`;
        await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });
        const newFy = this.fyRepo.create({
            tenantId,
            companyId,
            name: nextName,
            startDate: nextStartDate,
            endDate: nextEndDate,
            isClosed: false,
            isCurrent: true,
        });
        const savedNewFy = await this.fyRepo.save(newFy);
        return {
            closedFy: targetFy,
            newFy: savedNewFy,
            transferredLedgersCount: balanceSheetLedgers.length,
            message: `Financial Year '${targetFy.name}' successfully closed. Transferred closing balances for ${balanceSheetLedgers.length} balance sheet head(s) into new active '${savedNewFy.name}'.`,
        };
    }
    async setCurrentFinancialYear(tenantId, companyId, fyId) {
        const year = await this.fyRepo.findOne({ where: { id: fyId, tenantId, companyId } });
        if (!year) {
            throw new common_1.NotFoundException('Financial Year not found.');
        }
        await this.fyRepo.update({ tenantId, companyId }, { isCurrent: false });
        year.isCurrent = true;
        return this.fyRepo.save(year);
    }
};
exports.FinancialYearService = FinancialYearService;
exports.FinancialYearService = FinancialYearService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(financial_year_entity_1.FinancialYear)),
    __param(1, (0, typeorm_1.InjectRepository)(ledger_entity_1.Ledger)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], FinancialYearService);
//# sourceMappingURL=financial-year.service.js.map