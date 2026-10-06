import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Company } from './entities/company.entity';
import { Branch } from './entities/branch.entity';
import { Godown } from './entities/godown.entity';
import { RackBin } from './entities/rack-bin.entity';
import { TenancyService } from './services/tenancy.service';
import { TenantSeederService } from './services/tenant-seeder.service';
import { TenancyController } from './controllers/tenancy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Company, Branch, Godown, RackBin]),
  ],
  controllers: [TenancyController],
  providers: [TenancyService, TenantSeederService],
  exports: [TenancyService, TenantSeederService, TypeOrmModule],
})
export class TenancyModule {}
