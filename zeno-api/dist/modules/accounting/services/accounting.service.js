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
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ledger_entry_entity_1 = require("../entities/ledger-entry.entity");
const accounting_voucher_entity_1 = require("../entities/accounting-voucher.entity");
const accounting_voucher_line_entity_1 = require("../entities/accounting-voucher-line.entity");
const voucher_sequence_service_1 = require("../../procure-to-pay/services/voucher-sequence.service");
const enums_1 = require("../../../common/enums");
let AccountingService = class AccountingService {
    dataSource;
    sequenceService;
    voucherRepo;
    voucherLineRepo;
    entryRepo;
    constructor(dataSource, sequenceService, voucherRepo, voucherLineRepo, entryRepo) {
        this.dataSource = dataSource;
        this.sequenceService = sequenceService;
        this.voucherRepo = voucherRepo;
        this.voucherLineRepo = voucherLineRepo;
        this.entryRepo = entryRepo;
    }
    async postTransaction(manager, params) {
        const { tenantId, companyId, branchId, entryDate, voucherType, voucherId, voucherNo, lines, } = params;
        const activeLines = lines.filter((l) => Number(l.debitAmount || 0) > 0 || Number(l.creditAmount || 0) > 0);
        if (activeLines.length < 2) {
            throw new common_1.BadRequestException('Double-entry transaction requires at least two balanced accounts');
        }
        const totalDebit = activeLines.reduce((sum, l) => sum + Number(l.debitAmount || 0), 0);
        const totalCredit = activeLines.reduce((sum, l) => sum + Number(l.creditAmount || 0), 0);
        const diff = Math.abs(Number(totalDebit.toFixed(2)) - Number(totalCredit.toFixed(2)));
        if (diff > 0.05) {
            throw new common_1.BadRequestException(`Double-entry unbalanced! Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`);
        }
        const entries = [];
        for (const line of activeLines) {
            const entry = manager.create(ledger_entry_entity_1.LedgerEntry, {
                tenantId,
                companyId,
                branchId,
                entryDate,
                voucherType,
                voucherId,
                voucherNo,
                ledgerId: line.ledgerId,
                debitAmount: Number(Number(line.debitAmount || 0).toFixed(2)),
                creditAmount: Number(Number(line.creditAmount || 0).toFixed(2)),
                narration: line.narration || `${voucherType} #${voucherNo}`,
            });
            entries.push(entry);
        }
        return await manager.save(ledger_entry_entity_1.LedgerEntry, entries);
    }
    async reverseTransaction(manager, voucherType, voucherId, reversalReason) {
        const originalEntries = await manager.find(ledger_entry_entity_1.LedgerEntry, {
            where: { voucherType, voucherId },
        });
        if (!originalEntries || originalEntries.length === 0) {
            return;
        }
        const reversalEntries = originalEntries.map((entry) => {
            return manager.create(ledger_entry_entity_1.LedgerEntry, {
                tenantId: entry.tenantId,
                companyId: entry.companyId,
                branchId: entry.branchId,
                entryDate: new Date().toISOString().split('T')[0],
                voucherType: `${entry.voucherType}_REVERSAL`,
                voucherId: entry.voucherId,
                voucherNo: entry.voucherNo,
                ledgerId: entry.ledgerId,
                debitAmount: entry.creditAmount,
                creditAmount: entry.debitAmount,
                narration: `Reversal: ${reversalReason} (Orig: ${entry.voucherNo})`,
            });
        });
        await manager.save(ledger_entry_entity_1.LedgerEntry, reversalEntries);
    }
    async createVoucher(tenantId, userId, dto) {
        return await this.dataSource.transaction(async (manager) => {
            const vEnum = (enums_1.VoucherType[dto.voucherType] ||
                dto.voucherType);
            const voucherNo = await this.sequenceService.getNextVoucherNumber(manager, tenantId, dto.companyId, dto.branchId, vEnum);
            const postingLines = [];
            const voucherLinesToSave = [];
            let calculatedTotal = 0;
            if (dto.voucherType === 'PAYMENT') {
                if (!dto.sourceAccountLedgerId) {
                    throw new common_1.BadRequestException('Cash or Bank account is required for Payment voucher');
                }
                if (!dto.lines || dto.lines.length === 0) {
                    throw new common_1.BadRequestException('At least one payment line/expense account is required');
                }
                for (const line of dto.lines) {
                    const amt = Number(line.amount || line.debitAmount || 0);
                    if (amt <= 0)
                        continue;
                    calculatedTotal += amt;
                    voucherLinesToSave.push({
                        ledgerId: line.ledgerId,
                        debitAmount: amt,
                        creditAmount: 0,
                        narration: line.narration || dto.narration,
                    });
                    postingLines.push({
                        ledgerId: line.ledgerId,
                        debitAmount: amt,
                        creditAmount: 0,
                        narration: line.narration || dto.narration || `Payment towards ledger`,
                    });
                }
                postingLines.push({
                    ledgerId: dto.sourceAccountLedgerId,
                    debitAmount: 0,
                    creditAmount: Number(calculatedTotal.toFixed(2)),
                    narration: dto.narration || `Payment via Cash/Bank account`,
                });
            }
            else if (dto.voucherType === 'RECEIPT') {
                if (!dto.sourceAccountLedgerId) {
                    throw new common_1.BadRequestException('Cash or Bank account is required for Receipt voucher');
                }
                if (!dto.lines || dto.lines.length === 0) {
                    throw new common_1.BadRequestException('At least one receipt line/income account is required');
                }
                for (const line of dto.lines) {
                    const amt = Number(line.amount || line.creditAmount || 0);
                    if (amt <= 0)
                        continue;
                    calculatedTotal += amt;
                    voucherLinesToSave.push({
                        ledgerId: line.ledgerId,
                        debitAmount: 0,
                        creditAmount: amt,
                        narration: line.narration || dto.narration,
                    });
                    postingLines.push({
                        ledgerId: line.ledgerId,
                        debitAmount: 0,
                        creditAmount: amt,
                        narration: line.narration || dto.narration || `Receipt from ledger`,
                    });
                }
                postingLines.push({
                    ledgerId: dto.sourceAccountLedgerId,
                    debitAmount: Number(calculatedTotal.toFixed(2)),
                    creditAmount: 0,
                    narration: dto.narration || `Receipt into Cash/Bank account`,
                });
            }
            else if (dto.voucherType === 'CONTRA') {
                if (!dto.sourceAccountLedgerId) {
                    throw new common_1.BadRequestException('Source Cash/Bank account is required for Contra transfer');
                }
                if (!dto.destinationLedgerId) {
                    throw new common_1.BadRequestException('Destination Cash/Bank account is required for Contra transfer');
                }
                if (dto.sourceAccountLedgerId === dto.destinationLedgerId) {
                    throw new common_1.BadRequestException('Source and Destination accounts cannot be the same for Contra');
                }
                const amt = Number(dto.totalAmount || (dto.lines && dto.lines[0]?.amount) || 0);
                if (amt <= 0) {
                    throw new common_1.BadRequestException('Contra transfer amount must be greater than zero');
                }
                calculatedTotal = amt;
                voucherLinesToSave.push({
                    ledgerId: dto.destinationLedgerId,
                    debitAmount: amt,
                    creditAmount: 0,
                    narration: dto.narration || `Transfer into ${dto.destinationLedgerId}`,
                });
                postingLines.push({
                    ledgerId: dto.destinationLedgerId,
                    debitAmount: amt,
                    creditAmount: 0,
                    narration: dto.narration || `Fund transfer in`,
                });
                postingLines.push({
                    ledgerId: dto.sourceAccountLedgerId,
                    debitAmount: 0,
                    creditAmount: amt,
                    narration: dto.narration || `Fund transfer out`,
                });
            }
            else if (dto.voucherType === 'JOURNAL') {
                if (!dto.lines || dto.lines.length < 2) {
                    throw new common_1.BadRequestException('Journal voucher requires at least two balanced debit/credit lines');
                }
                let totalDebit = 0;
                let totalCredit = 0;
                for (const line of dto.lines) {
                    const dr = Number(line.debitAmount || 0);
                    const cr = Number(line.creditAmount || 0);
                    totalDebit += dr;
                    totalCredit += cr;
                    voucherLinesToSave.push({
                        ledgerId: line.ledgerId,
                        debitAmount: dr,
                        creditAmount: cr,
                        narration: line.narration || dto.narration,
                    });
                    postingLines.push({
                        ledgerId: line.ledgerId,
                        debitAmount: dr,
                        creditAmount: cr,
                        narration: line.narration || dto.narration || `Journal adjustment`,
                    });
                }
                if (Math.abs(totalDebit - totalCredit) > 0.05) {
                    throw new common_1.BadRequestException(`Journal unbalanced: Total Debit (₹${totalDebit.toFixed(2)}) != Total Credit (₹${totalCredit.toFixed(2)})`);
                }
                calculatedTotal = totalDebit;
            }
            else if (dto.voucherType === 'DEBIT_NOTE') {
                if (!dto.sourceAccountLedgerId) {
                    throw new common_1.BadRequestException('Party account to debit is required');
                }
                if (!dto.lines || dto.lines.length === 0) {
                    throw new common_1.BadRequestException('At least one line account to credit is required');
                }
                for (const line of dto.lines) {
                    const amt = Number(line.amount || line.creditAmount || 0);
                    if (amt <= 0)
                        continue;
                    calculatedTotal += amt;
                    voucherLinesToSave.push({
                        ledgerId: line.ledgerId,
                        debitAmount: 0,
                        creditAmount: amt,
                        narration: line.narration || dto.narration,
                    });
                    postingLines.push({
                        ledgerId: line.ledgerId,
                        debitAmount: 0,
                        creditAmount: amt,
                        narration: line.narration || dto.narration || `Debit Note offset`,
                    });
                }
                postingLines.push({
                    ledgerId: dto.sourceAccountLedgerId,
                    debitAmount: Number(calculatedTotal.toFixed(2)),
                    creditAmount: 0,
                    narration: dto.narration || `Debit Note issued to party`,
                });
            }
            else if (dto.voucherType === 'CREDIT_NOTE') {
                if (!dto.sourceAccountLedgerId) {
                    throw new common_1.BadRequestException('Party account to credit is required');
                }
                if (!dto.lines || dto.lines.length === 0) {
                    throw new common_1.BadRequestException('At least one line account to debit is required');
                }
                for (const line of dto.lines) {
                    const amt = Number(line.amount || line.debitAmount || 0);
                    if (amt <= 0)
                        continue;
                    calculatedTotal += amt;
                    voucherLinesToSave.push({
                        ledgerId: line.ledgerId,
                        debitAmount: amt,
                        creditAmount: 0,
                        narration: line.narration || dto.narration,
                    });
                    postingLines.push({
                        ledgerId: line.ledgerId,
                        debitAmount: amt,
                        creditAmount: 0,
                        narration: line.narration || dto.narration || `Credit Note offset`,
                    });
                }
                postingLines.push({
                    ledgerId: dto.sourceAccountLedgerId,
                    debitAmount: 0,
                    creditAmount: Number(calculatedTotal.toFixed(2)),
                    narration: dto.narration || `Credit Note issued to party`,
                });
            }
            const voucher = manager.create(accounting_voucher_entity_1.AccountingVoucher, {
                tenantId,
                companyId: dto.companyId,
                branchId: dto.branchId,
                voucherType: dto.voucherType,
                voucherNo,
                voucherDate: dto.voucherDate,
                totalAmount: Number(calculatedTotal.toFixed(2)),
                paymentMode: dto.paymentMode || 'CASH',
                referenceNo: dto.referenceNo,
                referenceDate: dto.referenceDate,
                narration: dto.narration,
                sourceAccountLedgerId: dto.sourceAccountLedgerId,
                status: 'POSTED',
                createdBy: userId,
            });
            const savedVoucher = await manager.save(accounting_voucher_entity_1.AccountingVoucher, voucher);
            const linesWithVoucher = voucherLinesToSave.map((l) => manager.create(accounting_voucher_line_entity_1.AccountingVoucherLine, {
                ...l,
                voucherId: savedVoucher.id,
            }));
            await manager.save(accounting_voucher_line_entity_1.AccountingVoucherLine, linesWithVoucher);
            await this.postTransaction(manager, {
                tenantId,
                companyId: dto.companyId,
                branchId: dto.branchId,
                entryDate: dto.voucherDate,
                voucherType: dto.voucherType,
                voucherId: savedVoucher.id,
                voucherNo,
                lines: postingLines,
            });
            return await manager.findOne(accounting_voucher_entity_1.AccountingVoucher, {
                where: { id: savedVoucher.id },
                relations: ['lines', 'lines.ledger', 'sourceAccountLedger', 'branch'],
            });
        });
    }
    async getVouchers(tenantId, companyId, query) {
        const qb = this.voucherRepo
            .createQueryBuilder('v')
            .leftJoinAndSelect('v.lines', 'line')
            .leftJoinAndSelect('line.ledger', 'lineLedger')
            .leftJoinAndSelect('v.sourceAccountLedger', 'sourceLedger')
            .leftJoinAndSelect('v.branch', 'branch')
            .where('v.tenant_id = :tenantId', { tenantId })
            .andWhere('v.company_id = :companyId', { companyId });
        if (query.voucherType) {
            qb.andWhere('v.voucher_type = :vType', { vType: query.voucherType });
        }
        if (query.startDate) {
            qb.andWhere('v.voucher_date >= :sDate', { sDate: query.startDate });
        }
        if (query.endDate) {
            qb.andWhere('v.voucher_date <= :eDate', { eDate: query.endDate });
        }
        if (query.search) {
            qb.andWhere('(v.voucher_no ILIKE :q OR v.narration ILIKE :q OR sourceLedger.name ILIKE :q)', { q: `%${query.search}%` });
        }
        return await qb.orderBy('v.voucher_date', 'DESC').addOrderBy('v.created_at', 'DESC').getMany();
    }
    async getVoucherById(tenantId, companyId, id) {
        const voucher = await this.voucherRepo.findOne({
            where: { id, tenantId, companyId },
            relations: ['lines', 'lines.ledger', 'sourceAccountLedger', 'branch'],
        });
        if (!voucher) {
            throw new common_1.NotFoundException(`Accounting voucher not found`);
        }
        const glEntries = await this.entryRepo.find({
            where: { voucherId: id },
            relations: ['ledger'],
            order: { debitAmount: 'DESC' },
        });
        return {
            ...voucher,
            ledgerEntries: glEntries,
        };
    }
    async cancelVoucher(tenantId, userId, id, reason) {
        return await this.dataSource.transaction(async (manager) => {
            const voucher = await manager.findOne(accounting_voucher_entity_1.AccountingVoucher, {
                where: { id, tenantId },
            });
            if (!voucher) {
                throw new common_1.NotFoundException('Voucher not found');
            }
            if (voucher.status === 'CANCELLED') {
                throw new common_1.BadRequestException('Voucher is already cancelled');
            }
            await this.reverseTransaction(manager, voucher.voucherType, voucher.id, reason || 'Voucher cancelled by user');
            voucher.status = 'CANCELLED';
            return await manager.save(accounting_voucher_entity_1.AccountingVoucher, voucher);
        });
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(accounting_voucher_entity_1.AccountingVoucher)),
    __param(3, (0, typeorm_1.InjectRepository)(accounting_voucher_line_entity_1.AccountingVoucherLine)),
    __param(4, (0, typeorm_1.InjectRepository)(ledger_entry_entity_1.LedgerEntry)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        voucher_sequence_service_1.VoucherSequenceService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map