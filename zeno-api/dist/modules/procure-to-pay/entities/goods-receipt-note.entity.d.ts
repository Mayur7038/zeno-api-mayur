import { GrnStatus } from '../../../common/enums';
import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { GrnItem } from './grn-item.entity';
import { GrnPoMapping } from './grn-po-mapping.entity';
export declare class GoodsReceiptNote {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    godownId: string;
    godown: Godown;
    voucherNo: string;
    grnDate: string;
    vendorLedgerId: string;
    vendorLedger: Ledger;
    status: GrnStatus;
    notes: string;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    items: GrnItem[];
    poMappings: GrnPoMapping[];
}
