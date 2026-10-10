import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';

@Component({
  selector: 'app-customer-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent],
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

        <!-- TOOLBAR & TABLE CARD -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search customer receipts..."
              />
            </div>

            <div class="toolbar-filters">
              <select class="form-select" [(ngModel)]="selectedMode">
                <option value="">All Payment Modes</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
              </select>

              <button class="btn-export" (click)="exportReceipts()" [disabled]="filteredReceipts.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>
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
                } @else if (filteredReceipts.length === 0) {
                  <tr>
                    <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                      No customer receipts found.
                    </td>
                  </tr>
                }
                @for (rec of filteredReceipts; track rec.id) {
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
              <zeno-searchable-select
                [options]="customers"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Select Customer..."
                [(ngModel)]="newRec.customerLedgerId"
                (selectChange)="onCustomerSelected()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Deposit Into (Bank / Cash Account)</label>
              <zeno-searchable-select
                [options]="bankLedgers"
                labelKey="name"
                valueKey="id"
                placeholder="Select Bank / Cash Account..."
                [(ngModel)]="newRec.paymentLedgerId"
              ></zeno-searchable-select>
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
              <input type="number" step="0.01" [(ngModel)]="newRec.amount" (input)="onAmountChanged()" />
            </div>

            <div class="form-group">
              <label>Ref / UTR / Cheque Number</label>
              <input type="text" [(ngModel)]="newRec.referenceNo" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label>Remarks / Notes</label>
              <input type="text" [(ngModel)]="newRec.notes" />
            </div>
          </div>

          <!-- INVOICE ALLOCATION SECTION -->
          <div class="line-items-section">
            <div class="section-title-wrap">
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
              <div class="table-responsive">
                <table class="zeno-table line-table">
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
                          />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
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
            <div class="table-responsive">
              <table class="zeno-table line-table">
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
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './customer-receipts.component.scss'
})
export class CustomerReceiptsComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  receipts: any[] = [];
  customers: any[] = [];
  bankLedgers: any[] = [];
  unpaidInvoices: any[] = [];
  loading = false;
  submitting = false;
  searchQuery: string = '';
  selectedMode: string = '';

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

  get filteredReceipts(): any[] {
    let list = this.receipts || [];
    if (this.selectedMode) {
      list = list.filter((r: any) => (r.paymentMode || '').toUpperCase() === this.selectedMode.toUpperCase());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter((r: any) =>
        (r.voucherNo && r.voucherNo.toLowerCase().includes(q)) ||
        (r.customerLedger?.name && r.customerLedger.name.toLowerCase().includes(q)) ||
        (r.paymentLedger?.name && r.paymentLedger.name.toLowerCase().includes(q)) ||
        (r.referenceNo && r.referenceNo.toLowerCase().includes(q))
      );
    }
    return list;
  }

  exportReceipts() {
    const list = this.filteredReceipts;
    if (!list || list.length === 0) return;
    const headers = ['Receipt No', 'Date', 'Customer', 'Deposit Account', 'Mode', 'Ref No', 'Amount', 'Remarks'];
    const rows = list.map((r: any) => [
      r.voucherNo || '',
      r.receiptDate || '',
      r.customerLedger?.name || '',
      r.paymentLedger?.name || '',
      r.paymentMode || '',
      r.referenceNo || '',
      r.amount || 0,
      r.remarks || ''
    ]);
    exportToCsv('Customer_Receipts', headers, rows);
    this.toast.success('Customer receipts exported successfully!', 'Export Complete');
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
