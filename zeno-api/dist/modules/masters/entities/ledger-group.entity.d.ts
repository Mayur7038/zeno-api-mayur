import { LedgerGroupNature } from '../../../common/enums';
import { Ledger } from './ledger.entity';
export declare class LedgerGroup {
    id: string;
    tenantId: string;
    companyId: string;
    name: string;
    code: string;
    parentId: string;
    parent: LedgerGroup;
    children: LedgerGroup[];
    nature: LedgerGroupNature;
    isCreditorVendor: boolean;
    isDebtorCustomer: boolean;
    isPredefined: boolean;
    createdAt: Date;
    updatedAt: Date;
    ledgers: Ledger[];
}
