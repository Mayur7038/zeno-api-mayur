"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenancyModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tenant_entity_1 = require("./entities/tenant.entity");
const company_entity_1 = require("./entities/company.entity");
const branch_entity_1 = require("./entities/branch.entity");
const godown_entity_1 = require("./entities/godown.entity");
const rack_bin_entity_1 = require("./entities/rack-bin.entity");
const tenancy_service_1 = require("./services/tenancy.service");
const tenant_seeder_service_1 = require("./services/tenant-seeder.service");
const tenancy_controller_1 = require("./controllers/tenancy.controller");
let TenancyModule = class TenancyModule {
};
exports.TenancyModule = TenancyModule;
exports.TenancyModule = TenancyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tenant_entity_1.Tenant, company_entity_1.Company, branch_entity_1.Branch, godown_entity_1.Godown, rack_bin_entity_1.RackBin]),
        ],
        controllers: [tenancy_controller_1.TenancyController],
        providers: [tenancy_service_1.TenancyService, tenant_seeder_service_1.TenantSeederService],
        exports: [tenancy_service_1.TenancyService, tenant_seeder_service_1.TenantSeederService, typeorm_1.TypeOrmModule],
    })
], TenancyModule);
//# sourceMappingURL=tenancy.module.js.map