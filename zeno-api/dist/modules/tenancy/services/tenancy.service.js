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
exports.TenancyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../entities/company.entity");
const branch_entity_1 = require("../entities/branch.entity");
const godown_entity_1 = require("../entities/godown.entity");
const rack_bin_entity_1 = require("../entities/rack-bin.entity");
let TenancyService = class TenancyService {
    companyRepo;
    branchRepo;
    godownRepo;
    rackBinRepo;
    constructor(companyRepo, branchRepo, godownRepo, rackBinRepo) {
        this.companyRepo = companyRepo;
        this.branchRepo = branchRepo;
        this.godownRepo = godownRepo;
        this.rackBinRepo = rackBinRepo;
    }
    async getCompanies(tenantId) {
        return this.companyRepo.find({
            where: { tenantId },
            relations: ['branches'],
        });
    }
    async getBranches(tenantId, companyId) {
        const where = { tenantId };
        if (companyId)
            where.companyId = companyId;
        return this.branchRepo.find({ where, relations: ['godowns'] });
    }
    async updateCompany(tenantId, companyId, data) {
        const company = await this.companyRepo.findOne({
            where: { tenantId, id: companyId },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        Object.assign(company, data);
        return this.companyRepo.save(company);
    }
    async getGodowns(tenantId, branchId) {
        const where = { tenantId };
        if (branchId)
            where.branchId = branchId;
        return this.godownRepo.find({ where, relations: ['branch', 'racksBins'], order: { createdAt: 'ASC' } });
    }
    async getRacksBins(tenantId, godownId) {
        return this.rackBinRepo.find({ where: { tenantId, godownId } });
    }
    async createBranch(tenantId, data) {
        const branch = this.branchRepo.create({ ...data, tenantId });
        return this.branchRepo.save(branch);
    }
    async createGodown(tenantId, data) {
        const godown = this.godownRepo.create({ ...data, tenantId });
        return this.godownRepo.save(godown);
    }
    async updateGodown(tenantId, godownId, data) {
        const godown = await this.godownRepo.findOne({
            where: { tenantId, id: godownId },
        });
        if (!godown) {
            throw new Error('Warehouse not found');
        }
        Object.assign(godown, data);
        return this.godownRepo.save(godown);
    }
    async deleteGodown(tenantId, godownId) {
        const godown = await this.godownRepo.findOne({
            where: { tenantId, id: godownId },
        });
        if (!godown) {
            throw new Error('Warehouse not found');
        }
        return this.godownRepo.remove(godown);
    }
    async createRackBin(tenantId, data) {
        const rackBin = this.rackBinRepo.create({ ...data, tenantId });
        return this.rackBinRepo.save(rackBin);
    }
};
exports.TenancyService = TenancyService;
exports.TenancyService = TenancyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(1, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(2, (0, typeorm_1.InjectRepository)(godown_entity_1.Godown)),
    __param(3, (0, typeorm_1.InjectRepository)(rack_bin_entity_1.RackBin)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TenancyService);
//# sourceMappingURL=tenancy.service.js.map