"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    const corsOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:4200', 'http://127.0.0.1:4200'];
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Tenant-Id,X-Company-Id,X-Branch-Id',
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Zeno Books ERP API')
        .setDescription('Multi-Tenant SaaS Accounting, Inventory, Sales, Purchase & BOM Assembly API.\n' +
        'Includes double-entry general ledger engine, transactional stock ledger, and gap-safe voucher numbering.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addTag('Authentication & Identity')
        .addTag('Tenancy & Hierarchy')
        .addTag('RBAC & User Permissions')
        .addTag('Settings & Feature Toggles')
        .addTag('Masters (Ledgers, Items, Units)')
        .addTag('Procure-to-Pay (PO, GRN, Purchase Invoice, Return, Payment)')
        .addTag('Accounting & Ledgers')
        .addTag('Inventory & Stock Ledger')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Zeno Books API Documentation',
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`==========================================================`);
    logger.log(`🚀 Zeno Books REST API is running on http://localhost:${port}/api/v1`);
    logger.log(`📖 Swagger API Docs available at http://localhost:${port}/api/docs`);
    logger.log(`==========================================================`);
}
bootstrap().catch((err) => {
    console.error('CRITICAL BOOTSTRAP ERROR:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map