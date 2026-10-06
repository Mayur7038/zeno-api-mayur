import { Ledger } from '../../masters/entities/ledger.entity';
import { Branch } from '../../tenancy/entities/branch.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { PurchaseReturnItem } from './purchase-return-item.entity';
export declare class PurchaseReturn {
    id: string;
    tenantId: string;
    companyId: string;
    branchId: string;
    branch: Branch;
    purchaseInvoiceId: string;
    purchaseInvoice: PurchaseInvoice;
    voucherNo: string;
    returnDate: string;
    vendorLedgerId: string;
    vendorLedger: Ledger;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    reason: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    items: PurchaseReturnItem[];
}
