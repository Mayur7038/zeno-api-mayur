import { VoucherType } from '../../../common/enums';
export declare class VoucherSequence {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    voucherType: VoucherType;
    financialYear: string;
    prefix: string;
    suffix: string;
    currentNumber: number;
    paddingDigits: number;
    updatedAt: Date;
}
