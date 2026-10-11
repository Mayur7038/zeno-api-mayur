"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ledger_entry_entity_1 = require("./entities/ledger-entry.entity");
const accounting_voucher_entity_1 = require("./entities/accounting-voucher.entity");
const accounting_voucher_line_entity_1 = require("./entities/accounting-voucher-line.entity");
const financial_year_entity_1 = require("./entities/financial-year.entity");
const ledger_entity_1 = require("../masters/entities/ledger.entity");
const accounting_service_1 = require("./services/accounting.service");
const financial_year_service_1 = require("./services/financial-year.service");
const accounting_controller_1 = require("./controllers/accounting.controller");
const financial_year_controller_1 = require("./controllers/financial-year.controller");
const voucher_sequence_service_1 = require("../procure-to-pay/services/voucher-sequence.service");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                ledger_entry_entity_1.LedgerEntry,
                accounting_voucher_entity_1.AccountingVoucher,
                accounting_voucher_line_entity_1.AccountingVoucherLine,
                financial_year_entity_1.FinancialYear,
                ledger_entity_1.Ledger,
            ]),
        ],
        controllers: [accounting_controller_1.AccountingController, financial_year_controller_1.FinancialYearController],
        providers: [accounting_service_1.AccountingService, financial_year_service_1.FinancialYearService, voucher_sequence_service_1.VoucherSequenceService],
        exports: [accounting_service_1.AccountingService, financial_year_service_1.FinancialYearService, typeorm_1.TypeOrmModule],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map