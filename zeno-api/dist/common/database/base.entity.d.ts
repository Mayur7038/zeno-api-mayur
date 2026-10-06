export declare abstract class BaseTenantEntity {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    version: number;
}
