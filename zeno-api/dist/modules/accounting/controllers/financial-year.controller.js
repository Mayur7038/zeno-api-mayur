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
exports.FinancialYearController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const financial_year_service_1 = require("../services/financial-year.service");
let FinancialYearController = class FinancialYearController {
    fyService;
    constructor(fyService) {
        this.fyService = fyService;
    }
    async getFinancialYears(tenantId, companyId) {
        const tid = tenantId || '11111111-1111-1111-1111-111111111111';
        if (!companyId)
            throw new common_1.BadRequestException('companyId query parameter is required');
        return this.fyService.getFinancialYears(tid, companyId);
    }
    async getCurrentFinancialYear(tenantId, companyId) {
        const tid = tenantId || '11111111-1111-1111-1111-111111111111';
        if (!companyId)
            throw new common_1.BadRequestException('companyId query parameter is required');
        return this.fyService.getCurrentFinancialYear(tid, companyId);
    }
    async createFinancialYear(tenantId, body) {
        const tid = tenantId || '11111111-1111-1111-1111-111111111111';
        if (!body.companyId)
            throw new common_1.BadRequestException('companyId is required in body');
        if (!body.name || !body.startDate || !body.endDate) {
            throw new common_1.BadRequestException('name, startDate, and endDate are required');
        }
        return this.fyService.createFinancialYear(tid, body.companyId, body);
    }
    async closeFinancialYear(tenantId, body) {
        const tid = tenantId || '11111111-1111-1111-1111-111111111111';
        if (!body.companyId)
            throw new common_1.BadRequestException('companyId is required in body');
        return this.fyService.closeFinancialYearAndTransferBalances(tid, body.companyId, body);
    }
    async switchFinancialYear(tenantId, body) {
        const tid = tenantId || '11111111-1111-1111-1111-111111111111';
        if (!body.companyId || !body.fyId)
            throw new common_1.BadRequestException('companyId and fyId are required');
        return this.fyService.setCurrentFinancialYear(tid, body.companyId, body.fyId);
    }
};
exports.FinancialYearController = FinancialYearController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all financial years for company' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinancialYearController.prototype, "getFinancialYears", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current active financial year' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinancialYearController.prototype, "getCurrentFinancialYear", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new financial year (requires current active F.Y. to be closed)' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialYearController.prototype, "createFinancialYear", null);
__decorate([
    (0, common_1.Post)('close'),
    (0, swagger_1.ApiOperation)({ summary: 'Close open financial year and transfer balance sheet closing balances as opening balances for new year' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialYearController.prototype, "closeFinancialYear", null);
__decorate([
    (0, common_1.Post)('switch'),
    (0, swagger_1.ApiOperation)({ summary: 'Switch current active financial year' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialYearController.prototype, "switchFinancialYear", null);
exports.FinancialYearController = FinancialYearController = __decorate([
    (0, swagger_1.ApiTags)('Financial Years'),
    (0, common_1.Controller)('accounting/financial-years'),
    __metadata("design:paramtypes", [financial_year_service_1.FinancialYearService])
], FinancialYearController);
//# sourceMappingURL=financial-year.controller.js.map