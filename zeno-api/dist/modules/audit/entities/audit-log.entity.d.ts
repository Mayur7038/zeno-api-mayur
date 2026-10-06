export declare class AuditLog {
    id: string;
    tenantId: string;
    userId: string;
    entityName: string;
    recordId: string;
    action: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
