import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

import { AuthModule } from './modules/auth/auth.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MastersModule } from './modules/masters/masters.module';
import { ProcureToPayModule } from './modules/procure-to-pay/procure-to-pay.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuditModule } from './modules/audit/audit.module';
import { SalesModule } from './modules/sales/sales.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
const dbUrl = config.get<string>('DATABASE_URL');
console.log('DB host:', dbUrl ? new URL(dbUrl).host : 'DATABASE_URL missing');
        return {
          type: 'postgres' as const,

          url: config.get<string>('DATABASE_URL'),

          autoLoadEntities: true,

          // Auto-creates missing tables in development.
          // Always false in production unless explicitly forced via DB_SYNCHRONIZE=true.
          synchronize:
            config.get<string>('DB_SYNCHRONIZE', isProduction ? 'false' : 'true') === 'true',

          logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        };
      },

      inject: [ConfigService],
    }),

    AuthModule,
    TenancyModule,
    RbacModule,
    SettingsModule,
    MastersModule,
    ProcureToPayModule,
    SalesModule,
    AccountingModule,
    InventoryModule,
    AuditModule,
    ManufacturingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}