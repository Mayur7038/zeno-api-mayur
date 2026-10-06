import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private auditRepo;
    constructor(auditRepo: Repository<AuditLog>);
    logAction(params: {
        tenantId?: string;
        userId?: string;
        entityName: string;
        recordId?: string;
        action: string;
        oldValues?: any;
        newValues?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog>;
    getLogs(tenantId: string, entityName?: string): Promise<AuditLog[]>;
}
