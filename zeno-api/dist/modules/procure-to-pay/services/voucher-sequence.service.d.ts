import { DataSource, EntityManager } from 'typeorm';
import { VoucherType } from '../../../common/enums';
export declare class VoucherSequenceService {
    private dataSource;
    constructor(dataSource: DataSource);
    getNextVoucherNumber(manager: EntityManager, tenantId: string, companyId: string, branchId: string, voucherType: VoucherType, financialYear?: string): Promise<string>;
    private getDefaultPrefix;
}
