import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(params: {
    tenantId?: string;
    userId?: string;
    entityName: string;
    recordId?: string;
    action: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const entry = this.auditRepo.create(params);
    return this.auditRepo.save(entry);
  }

  async getLogs(tenantId: string, entityName?: string) {
    const where: any = { tenantId };
    if (entityName) where.entityName = entityName;
    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
