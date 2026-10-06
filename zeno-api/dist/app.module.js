"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const tenant_context_middleware_1 = require("./common/middleware/tenant-context.middleware");
const auth_module_1 = require("./modules/auth/auth.module");
const tenancy_module_1 = require("./modules/tenancy/tenancy.module");
const rbac_module_1 = require("./modules/rbac/rbac.module");
const settings_module_1 = require("./modules/settings/settings.module");
const masters_module_1 = require("./modules/masters/masters.module");
const procure_to_pay_module_1 = require("./modules/procure-to-pay/procure-to-pay.module");
const accounting_module_1 = require("./modules/accounting/accounting.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const audit_module_1 = require("./modules/audit/audit.module");
const sales_module_1 = require("./modules/sales/sales.module");
const manufacturing_module_1 = require("./modules/manufacturing/manufacturing.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_context_middleware_1.TenantContextMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', '127.0.0.1'),
                    port: Number(config.get('DB_PORT', 5433)),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.get('DB_PASSWORD', 'postgres'),
                    database: config.get('DB_NAME', 'zeno_books'),
                    autoLoadEntities: true,
                    synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
                    logging: config.get('DB_LOGGING', 'false') === 'true',
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            tenancy_module_1.TenancyModule,
            rbac_module_1.RbacModule,
            settings_module_1.SettingsModule,
            masters_module_1.MastersModule,
            procure_to_pay_module_1.ProcureToPayModule,
            sales_module_1.SalesModule,
            accounting_module_1.AccountingModule,
            inventory_module_1.InventoryModule,
            audit_module_1.AuditModule,
            manufacturing_module_1.ManufacturingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map