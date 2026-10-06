import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { Godown } from '../../tenancy/entities/godown.entity';
import { SalesInvoice } from './sales-invoice.entity';
import { SalesReturnItem } from './sales-return-item.entity';
export declare class SalesReturn {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    godownId: string;
    godown: Godown;
    salesInvoiceId: string;
    salesInvoice: SalesInvoice;
    voucherNo: string;
    returnDate: string;
    customerLedgerId: string;
    customerLedger: Ledger;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    reason: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    items: SalesReturnItem[];
}
