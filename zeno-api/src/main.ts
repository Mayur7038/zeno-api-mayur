import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for logo uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI
    }),
  );

  // 2. CORS
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:4200', 'http://127.0.0.1:4200'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Tenant-Id,X-Company-Id,X-Branch-Id',
  });

  // 3. Global Prefix & Validation
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 4. Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Zeno Books ERP API')
    .setDescription(
      'Multi-Tenant SaaS Accounting, Inventory, Sales, Purchase & BOM Assembly API.\n' +
        'Includes double-entry general ledger engine, transactional stock ledger, and gap-safe voucher numbering.',
    )
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
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
