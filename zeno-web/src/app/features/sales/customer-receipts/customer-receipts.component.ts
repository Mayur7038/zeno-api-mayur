import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-customer-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER BAR -->
        <div class="page-header">
          <div>
            <h1>Customer Receipts</h1>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> Record Customer Receipt
            </button>
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Deposit Account (Bank / Cash)</th>
                <th>Mode</th>
                <th>Ref / Cheque #</th>
                <th>Amount Collected</th>
                <th>Invoices Allocated</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; margin-bottom: 8px; display:block;"></i>
                    Loading customer receipts...
                  </td>
                </tr>
              } @else if (receipts.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No customer receipts found.
                  </td>
                </tr>
              }
              @for (rec of receipts; track rec.id) {
                <tr (click)="viewReceipt(rec)" style="cursor: pointer;">
                  <td class="font-mono font-bold" style="color: #16A34A">{{ rec.voucherNo }}</td>
                  <td>{{ rec.receiptDate }}</td>
                  <td>
                    <strong>{{ rec.customerLedger?.name || 'Customer' }}</strong>
                  </td>
                  <td>
                    <strong>{{ rec.paymentLedger?.name || 'Bank Account' }}</strong>
                  </td>
                  <td><span class="mode-badge">{{ rec.paymentMode }}</span></td>
                  <td class="font-mono">{{ rec.referenceNo || '-' }}</td>
                  <td class="font-bold text-success">₹{{ rec.amount | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge badge-cleared">{{ rec.allocations?.length || 0 }} bills</span>
                  </td>
                  <td class="text-right" (click)="$event.stopPropagation()">
                    <button class="btn-icon" title="View Receipt Voucher" (click)="viewReceipt(rec)">
                      <i class="pi pi-eye"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- FULL PAGE CREATE CUSTOMER RECEIPT -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Record Customer Receipt</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitReceipt()" [disabled]="submitting || !isValidReceipt()">
              <i class="pi pi-check"></i> Post Receipt & Update Ledgers
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer (From)</label>
              <select [(ngModel)]="newRec.customerLedgerId" (change)="onCustomerSelected()">
                <option value="">Select Customer...</option>
                @for (cust of customers; track cust.id) {
                  <option [value]="cust.id">{{ cust.name }} ({{ cust.gstin || 'Unregistered' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Deposit Into (Bank / Cash Account)</label>
              <select [(ngModel)]="newRec.paymentLedgerId">
                <option value="">Select Bank / Cash Account...</option>
                @for (acc of bankLedgers; track acc.id) {
                  <option [value]="acc.id">{{ acc.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Receipt Date</label>
              <input type="date" [(ngModel)]="newRec.receiptDate" />
            </div>

            <div class="form-group">
              <label class="required">Payment Mode</label>
              <select [(ngModel)]="newRec.paymentMode">
                <option value="BANK">Bank Transfer / NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="required">Total Amount Collected (₹)</label>
              <input type="number" step="0.01" [(ngModel)]="newRec.amount" (input)="onAmountChanged()" placeholder="0.00" />
            </div>

            <div class="form-group">
              <label>Ref / UTR / Cheque Number</label>
              <input type="text" [(ngModel)]="newRec.referenceNo" placeholder="e.g. UTR-AXIS-882910" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label>Remarks / Notes</label>
              <input type="text" [(ngModel)]="newRec.notes" placeholder="e.g. Advance against project milestone" />
            </div>
          </div>

          <!-- INVOICE ALLOCATION SECTION -->
          <div class="items-section">
            <div class="section-title-row">
              <div>
                <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Bill-by-Bill Invoice Allocations</h3>
                <p style="font-size: 0.78rem; color: var(--surface-500); margin: 2px 0 0 0;">Allocate payment against open invoices</p>
              </div>
              @if (unpaidInvoices.length > 0) {
                <button type="button" class="btn-sm btn-outline" (click)="autoAllocateFIFO()">
                  <i class="pi pi-bolt"></i> Auto-Allocate (FIFO)
                </button>
              }
            </div>

            @if (unpaidInvoices.length === 0) {
              <div class="empty-invoices-notice">
                <i class="pi pi-info-circle"></i>
                <span>{{ newRec.customerLedgerId ? 'No open/unpaid invoices found for this customer. Receipt will be recorded as on-account payment.' : 'Please select a customer to view open invoices.' }}</span>
              </div>
            } @else {
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Total Value</th>
                    <th>Already Paid</th>
                    <th>Balance Due</th>
                    <th style="width: 25%;">Allocate Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of unpaidInvoices; track inv.id; let idx = $index) {
                    <tr>
                      <td class="font-mono font-bold">{{ inv.voucherNo }}</td>
                      <td>{{ inv.invoiceDate }}</td>
                      <td>₹{{ inv.grandTotal | number:'1.2-2' }}</td>
                      <td class="text-success">₹{{ (inv.paidAmount || 0) | number:'1.2-2' }}</td>
                      <td class="font-bold text-danger">
                        ₹{{ (inv.grandTotal - (inv.paidAmount || 0)) | number:'1.2-2' }}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          [(ngModel)]="inv.allocatedNow"
                          (input)="recalculateAllocations()"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- ALLOCATION SUMMARY -->
          <div class="totals-summary-card">
            <div class="summary-line">
              <span>Total Collected:</span>
              <strong>₹{{ (newRec.amount || 0) | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line text-success font-bold">
              <span>Total Allocated:</span>
              <span>₹{{ totalAllocated | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line font-bold" [class.text-danger]="unallocatedAmount > 0">
              <span>Unallocated (On Account):</span>
              <span>₹{{ unallocatedAmount | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedReceipt) {
        <!-- FULL PAGE VIEW CUSTOMER RECEIPT -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Customer Receipt Voucher #{{ selectedReceipt.voucherNo }}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()"><i class="pi pi-print"></i> Print Voucher</button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Customer (Received From)</span>
              <strong>{{ selectedReceipt.customerLedger?.name }}</strong>
              <p style="margin: 4px 0 0 0;">{{ selectedReceipt.customerLedger?.gstin ? 'GSTIN: ' + selectedReceipt.customerLedger?.gstin : 'Unregistered' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Deposit & Method</span>
              <strong>{{ selectedReceipt.paymentLedger?.name }}</strong>
              <p style="margin: 4px 0 0 0;">Mode: {{ selectedReceipt.paymentMode }} | Ref: {{ selectedReceipt.referenceNo || 'None' }}</p>
            </div>
          </div>

          <h4 style="margin: 24px 0 12px; font-size: 0.95rem; color: var(--surface-700)">Allocated Sales Invoices</h4>
          @if (!selectedReceipt.allocations || selectedReceipt.allocations.length === 0) {
            <p style="color: var(--surface-500); font-size: 0.85rem;">Payment received on-account (not allocated to specific invoices).</p>
          } @else {
            <table class="zeno-table" style="border: 1px solid var(--surface-200); border-radius: 8px;">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Invoice Date</th>
                  <th>Invoice Total</th>
                  <th class="text-right">Allocated Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (alloc of selectedReceipt.allocations; track alloc.id) {
                  <tr>
                    <td class="font-mono font-bold">{{ alloc.salesInvoice?.voucherNo }}</td>
                    <td>{{ alloc.salesInvoice?.invoiceDate }}</td>
                    <td>₹{{ alloc.salesInvoice?.grandTotal | number:'1.2-2' }}</td>
                    <td class="text-right font-bold text-success">₹{{ alloc.allocatedAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: var(--radius-sm, 6px); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
    .btn-back:hover { background: var(--surface-200); color: var(--surface-900); }
    .form-page-card { padding: 24px; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .zeno-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; overflow-x: auto; overflow-y: hidden; max-width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
    .zeno-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; white-space: nowrap !important; }
    .zeno-table th { background: var(--surface-50); padding: 12px 18px; color: var(--surface-600); font-weight: 600; border-bottom: 1px solid var(--surface-200); white-space: nowrap !important; }
    .zeno-table td { padding: 13px 18px; border-bottom: 1px solid var(--surface-100); color: var(--surface-800); white-space: nowrap !important; }
    .zeno-table tr:hover td { background: var(--surface-50); }
    .zeno-table th *, .zeno-table td * { white-space: nowrap !important; }

    .mode-badge { background: #E0E7FF; color: #3730A3; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
    .badge-cleared { background: #DCFCE7; color: #15803D; }
    .text-success { color: #16A34A; }
    .text-danger { color: #DC2626; }

    .btn-primary { background: #2563EB; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { background: #1D4ED8; }
    .btn-secondary { background: var(--surface-100); color: var(--surface-700); border: 1px solid var(--surface-300); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600, #2563EB); color: var(--primary-600, #2563EB); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .items-section { margin-top: 20px; }
    .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .empty-invoices-notice { background: #F8FAFC; border: 1px dashed var(--surface-300); padding: 16px; border-radius: 8px; color: var(--surface-500); font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
    .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; }
    .items-table th { background: var(--surface-100); padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: var(--surface-600); }
    .items-table td { padding: 8px 10px; border-bottom: 1px solid var(--surface-200); }
    .items-table input { width: 100%; padding: 6px 8px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.85rem; }

    .totals-summary-card { width: 340px; margin-left: auto; margin-top: 16px; background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 10px; padding: 14px 16px; }
    .summary-line { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: var(--surface-600); }

    .detail-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-block { background: var(--surface-50); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-200); }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; display: block; margin-bottom: 4px; }
  `]
})
export class CustomerReceiptsComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  receipts: any[] = [];
  customers: any[] = [];
  bankLedgers: any[] = [];
  unpaidInvoices: any[] = [];
  loading = false;
  submitting = false;

  selectedReceipt: any = null;

  newRec: any = {
    customerLedgerId: '',
    paymentLedgerId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    paymentMode: 'BANK',
    amount: null,
    referenceNo: '',
    notes: '',
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadReceipts();
    this.loadMasters();

    // Check query params if navigated with ?invoiceId=...
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.openCreatePage();
        this.newRec.customerLedgerId = params['customerId'] || '';
        this.onCustomerSelected(params['invoiceId']);
      }
    });
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get totalInflow(): number {
    return this.receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }

  get uniqueCustomersCount(): number {
    const custIds = new Set(this.receipts.map(r => r.customerLedgerId));
    return custIds.size;
  }

  get totalAllocated(): number {
    return this.unpaidInvoices.reduce((sum, i) => sum + Number(i.allocatedNow || 0), 0);
  }

  get unallocatedAmount(): number {
    return Math.max(0, Number(this.newRec.amount || 0) - this.totalAllocated);
  }

  loadReceipts() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getCustomerReceipts(this.companyId).subscribe({
      next: (res) => {
        this.receipts = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMasters() {
    if (!this.companyId) return;
    this.mastersService.getLedgers(this.companyId, false, true).subscribe((data) => {
      this.customers = data || [];
    });
    this.mastersService.getLedgers(this.companyId).subscribe((data) => {
      // Find bank and cash ledgers
      this.bankLedgers = (data || []).filter((l: any) =>
        l.name.toLowerCase().includes('bank') ||
        l.name.toLowerCase().includes('cash') ||
        l.ledgerGroup?.name?.toLowerCase().includes('bank') ||
        l.ledgerGroup?.name?.toLowerCase().includes('cash')
      );
    });
  }

  openCreatePage() {
    this.newRec = {
      customerLedgerId: '',
      paymentLedgerId: this.bankLedgers[0]?.id || '',
      receiptDate: new Date().toISOString().split('T')[0],
      paymentMode: 'BANK',
      amount: null,
      referenceNo: '',
      notes: '',
    };
    this.unpaidInvoices = [];
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedReceipt = null;
  }

  onCustomerSelected(preselectInvoiceId?: string) {
    if (!this.newRec.customerLedgerId) {
      this.unpaidInvoices = [];
      return;
    }
    this.salesService.getCustomerPendingInvoices(this.newRec.customerLedgerId, this.companyId).subscribe((invs) => {
      this.unpaidInvoices = (invs || []).map((i: any) => {
        const due = Number(i.grandTotal || 0) - Number(i.paidAmount || 0);
        let allocatedNow = 0;
        if (preselectInvoiceId && i.id === preselectInvoiceId) {
          allocatedNow = due;
          this.newRec.amount = due;
        }
        return {
          ...i,
          allocatedNow
        };
      });
    });
  }

  onAmountChanged() {
    // When amount is updated, we can auto-fill if only 1 invoice exists
    if (this.unpaidInvoices.length === 1 && !this.unpaidInvoices[0].allocatedNow) {
      const due = Number(this.unpaidInvoices[0].grandTotal || 0) - Number(this.unpaidInvoices[0].paidAmount || 0);
      this.unpaidInvoices[0].allocatedNow = Math.min(Number(this.newRec.amount || 0), due);
    }
  }

  autoAllocateFIFO() {
    let remaining = Number(this.newRec.amount || 0);
    for (const inv of this.unpaidInvoices) {
      const due = Number(inv.grandTotal || 0) - Number(inv.paidAmount || 0);
      if (remaining <= 0) {
        inv.allocatedNow = 0;
      } else if (remaining >= due) {
        inv.allocatedNow = due;
        remaining -= due;
      } else {
        inv.allocatedNow = remaining;
        remaining = 0;
      }
    }
  }

  recalculateAllocations() {
    // triggers getter update
  }

  isValidReceipt(): boolean {
    return (
      !!this.newRec.customerLedgerId &&
      !!this.newRec.paymentLedgerId &&
      Number(this.newRec.amount) > 0
    );
  }

  submitReceipt() {
    if (!this.isValidReceipt()) return;
    this.submitting = true;

    const allocations = this.unpaidInvoices
      .filter((i: any) => Number(i.allocatedNow) > 0)
      .map((i: any) => ({
        salesInvoiceId: i.id,
        allocatedAmount: Number(i.allocatedNow)
      }));

    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newRec,
      amount: Number(this.newRec.amount),
      allocations
    };

    this.salesService.createCustomerReceipt(payload).subscribe({
      next: (created: any) => {
        this.submitting = false;
        this.toast.success(
          `Customer Receipt ${created?.receiptNo || ''} recorded successfully! Total: ₹${Number(this.newRec.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Receipt Recorded',
        );
        this.backToList();
        this.loadReceipts();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to record customer receipt';
        this.toast.error(msg, 'Recording Failed');
        alert(msg);
      }
    });
  }

  viewReceipt(rec: any) {
    this.selectedReceipt = rec;
    this.viewMode = 'view';
  }
}
