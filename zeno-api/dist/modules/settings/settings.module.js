"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const company_settings_entity_1 = require("./entities/company-settings.entity");
const feature_toggle_entity_1 = require("./entities/feature-toggle.entity");
const tax_master_entity_1 = require("./entities/tax-master.entity");
const settings_service_1 = require("./services/settings.service");
const settings_controller_1 = require("./controllers/settings.controller");
let SettingsModule = class SettingsModule {
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([company_settings_entity_1.CompanySettings, feature_toggle_entity_1.FeatureToggle, tax_master_entity_1.TaxMaster])],
        controllers: [settings_controller_1.SettingsController],
        providers: [settings_service_1.SettingsService],
        exports: [settings_service_1.SettingsService, typeorm_1.TypeOrmModule],
    })
], SettingsModule);
//# sourceMappingURL=settings.module.js.map