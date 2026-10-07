import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-vendor-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Vendor Payments & Disbursements</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-credit-card"></i> Make Payment
            </button>
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Payment Date</th>
                <th>Vendor</th>
                <th>Payment Mode</th>
                <th>Reference #</th>
                <th>Discount Taken</th>
                <th>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              @if (payments.length === 0) {
                <tr>
                  <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No vendor payments recorded yet. Click "Make Payment" to disburse and settle bills.
                  </td>
                </tr>
              }
              @for (p of payments; track p.id) {
                <tr>
                  <td class="font-mono font-bold" style="color: var(--primary-700)">{{ p.voucherNo }}</td>
                  <td>{{ p.paymentDate }}</td>
                  <td class="font-bold">{{ p.vendorLedger?.name }}</td>
                  <td>
                    <span class="badge-pill" style="background: #f1f5f9; color: #334155;">
                      <i class="pi pi-wallet"></i> {{ p.paymentModeLedger?.name }}
                    </span>
                  </td>
                  <td class="font-mono">{{ p.referenceChequeNo || '—' }}</td>
                  <td class="font-mono text-emerald">₹{{ p.totalDiscountReceived || 0 }}</td>
                  <td class="font-mono font-bold" style="font-size: 1rem; color: #047857;">₹{{ p.totalAmountPaid }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE PAYMENT FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Disburse Vendor Payment &amp; Settle Invoices</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitPayment()" [disabled]="submitting || totalAllocated <= 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Payment...
              } @else {
                <i class="pi pi-check"></i> Post Payment (₹{{ totalAllocated.toFixed(2) }})
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          @if (createError) {
            <div class="alert alert-error" style="margin-bottom: 16px;">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ createError }}</span>
            </div>
          }

          <div class="form-grid-3">
            <div class="form-group">
              <label>Payment Date *</label>
              <input type="date" [(ngModel)]="form.paymentDate" required />
            </div>

            <div class="form-group">
              <label>Vendor *</label>
              <select [(ngModel)]="form.vendorLedgerId" (change)="onVendorChange()" required>
                <option value="">-- Select Vendor --</option>
                @for (v of vendors; track v.id) {
                  <option [value]="v.id">{{ v.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Payment Mode (Cash/Bank) *</label>
              <select [(ngModel)]="form.paymentModeLedgerId" required>
                @for (m of paymentModes; track m.id) {
                  <option [value]="m.id">{{ m.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 14px;">
            <div class="form-group">
              <label>Reference / Cheque / UTR #</label>
              <input type="text" [(ngModel)]="form.referenceChequeNo" placeholder="e.g. NEFT-99482910" />
            </div>
            <div class="form-group">
              <label>Payment Narration</label>
              <input type="text" [(ngModel)]="form.notes" placeholder="e.g. Full settlement against Invoice" />
            </div>
          </div>

          <!-- UNPAID INVOICES ALLOCATION TABLE -->
          <div class="allocation-section">
            <div class="section-title">
              <span>Select &amp; Allocate Outstanding Bills</span>
              <span class="outstanding-total font-mono">Total Outstanding: ₹{{ totalPendingBalance.toFixed(2) }}</span>
            </div>

            @if (pendingBills.length === 0) {
              <div style="padding: 24px; text-align: center; color: var(--surface-500); background: #ffffff; border-radius: 4px;">
                No unpaid bills found for this vendor.
              </div>
            } @else {
              <table class="zeno-table line-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Bill Amount</th>
                    <th>Balance Due</th>
                    <th>Pay Amount (₹)</th>
                    <th>Discount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of pendingBills; track b.id) {
                    <tr>
                      <td class="font-mono font-bold">{{ b.voucherNo }}</td>
                      <td>{{ b.invoiceDate }}</td>
                      <td class="font-mono">₹{{ b.grandTotal }}</td>
                      <td class="font-mono font-bold" style="color: #b91c1c;">₹{{ b.pendingBalance }}</td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="b.allocatedAmount"
                          (input)="recalculateAllocations()"
                          min="0"
                          [max]="b.pendingBalance"
                          style="width: 140px;"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="b.discountAmount"
                          (input)="recalculateAllocations()"
                          min="0"
                          style="width: 110px;"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- SUMMARY -->
          <div class="totals-summary-box font-mono">
            <div>Amount to Pay: <strong>₹{{ totalAllocated.toFixed(2) }}</strong></div>
            <div>Discount Taken: <strong>₹{{ totalDiscount.toFixed(2) }}</strong></div>
            <div style="font-size: 1.125rem; color: #047857;">Total Settled: <strong>₹{{ (totalAllocated + totalDiscount).toFixed(2) }}</strong></div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitPayment()" [disabled]="submitting || totalAllocated <= 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Payment...
              } @else {
                <i class="pi pi-check"></i> Post Payment (₹{{ totalAllocated.toFixed(2) }})
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .p2p-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
      .header-actions { display: flex; gap: 10px; }
    }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .btn-back {
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      border-radius: var(--radius-sm);
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: var(--surface-200); color: var(--surface-900); }
    }
    .form-page-card { padding: 24px; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); } input, select { border: 1px solid var(--surface-300); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.875rem; } }
    .allocation-section { margin: 20px 0; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; background: var(--surface-50); .section-title { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; font-weight: 700; margin-bottom: 12px; } .outstanding-total { color: #b91c1c; font-weight: 700; font-size: 0.875rem; } .line-table { background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); input { border: 1px solid var(--surface-200); padding: 6px 8px; border-radius: 4px; } } }
    .totals-summary-box { background: #f8fafc; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; display: flex; justify-content: space-around; align-items: center; }
    .badge-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
    .text-emerald { color: #059669; font-weight: 600; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.72rem; color: var(--surface-500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); margin-top: 2px; }
  `],
})
export class VendorPaymentsComponent implements OnInit {
  viewMode: 'list' | 'create' = 'list';
  payments: any[] = [];
  vendors: any[] = [];
  paymentModes: any[] = [];
  pendingBills: any[] = [];

  submitting = false;
  createError = '';

  get totalDisbursed(): number {
    return this.payments.reduce((sum, p) => sum + Number(p.totalAmountPaid || 0), 0);
  }

  get totalDiscountReceived(): number {
    return this.payments.reduce((sum, p) => sum + Number(p.totalDiscountReceived || 0), 0);
  }

  get uniqueVendorsCount(): number {
    const vIds = new Set(this.payments.map(p => p.vendorLedgerId));
    return vIds.size;
  }

  totalPendingBalance = 0;
  totalAllocated = 0;
  totalDiscount = 0;

  form: any = {
    paymentDate: new Date().toISOString().split('T')[0],
    vendorLedgerId: '',
    paymentModeLedgerId: '',
    referenceChequeNo: '',
    notes: '',
  };

  constructor(
    private p2p: P2pService,
    public tenant: TenantService,
    private masters: MastersService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadPayments();
        this.loadMasters();
        this.checkQueryParams();
      },
    });
  }

  loadPayments() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.p2p.getVendorPayments(compId).subscribe({
      next: (res) => (this.payments = res),
    });
  }

  loadMasters() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    this.masters.getLedgers(compId, true).subscribe({ next: (v) => (this.vendors = v) });

    this.masters.getLedgers(compId).subscribe({
      next: (all) => {
        this.paymentModes = all.filter((l) =>
          ['Cash-in-Hand', 'Bank Accounts', 'Cash', 'Bank'].some((grp) =>
            l.ledgerGroup?.name?.toLowerCase().includes(grp.toLowerCase()),
          ),
        );
        if (this.paymentModes.length === 0) {
          this.paymentModes = all;
        }
      },
    });
  }

  checkQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if (params['vendorId']) {
        this.openCreateModal();
        this.form.vendorLedgerId = params['vendorId'];
        this.onVendorChange(params['invoiceId'], Number(params['amount'] || 0));
      }
    });
  }

  openCreateModal() {
    this.form = {
      paymentDate: new Date().toISOString().split('T')[0],
      vendorLedgerId: this.vendors[0]?.id || '',
      paymentModeLedgerId: this.paymentModes[0]?.id || '',
      referenceChequeNo: '',
      notes: '',
    };
    this.pendingBills = [];
    this.createError = '';
    this.viewMode = 'create';
    if (this.form.vendorLedgerId) {
      this.onVendorChange();
    }
  }

  backToList() {
    this.viewMode = 'list';
    this.createError = '';
    this.loadPayments();
  }

  onVendorChange(targetInvoiceId?: string, targetAmount?: number) {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId || !this.form.vendorLedgerId) return;

    this.p2p.getVendorPendingInvoices(this.form.vendorLedgerId, compId).subscribe({
      next: (bills) => {
        this.pendingBills = bills.map((b) => {
          const balance = Number(b.grandTotal) - Number(b.paidAmount || 0);
          const isTarget = targetInvoiceId && b.id === targetInvoiceId;
          return {
            id: b.id,
            voucherNo: b.voucherNo,
            invoiceDate: b.invoiceDate,
            grandTotal: b.grandTotal,
            pendingBalance: balance,
            allocatedAmount: isTarget ? targetAmount || balance : 0,
            discountAmount: 0,
          };
        });

        this.totalPendingBalance = this.pendingBills.reduce((s, b) => s + b.pendingBalance, 0);
        this.recalculateAllocations();
      },
    });
  }

  recalculateAllocations() {
    let alloc = 0;
    let disc = 0;
    for (const b of this.pendingBills) {
      alloc += Number(b.allocatedAmount || 0);
      disc += Number(b.discountAmount || 0);
    }
    this.totalAllocated = alloc;
    this.totalDiscount = disc;
  }

  submitPayment() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.tenant.currentBranch()?.id;

    if (!this.form.paymentModeLedgerId) {
      this.createError = 'Please select a Cash or Bank payment account';
      return;
    }

    const allocations = this.pendingBills
      .filter((b) => Number(b.allocatedAmount) > 0 || Number(b.discountAmount) > 0)
      .map((b) => ({
        purchaseInvoiceId: b.id,
        allocatedAmount: Number(b.allocatedAmount || 0),
        discountAmount: Number(b.discountAmount || 0),
      }));

    if (allocations.length === 0) {
      this.createError = 'Please allocate payment amount to at least one bill';
      return;
    }

    this.submitting = true;
    this.createError = '';

    const payload = {
      companyId: compId,
      branchId,
      vendorLedgerId: this.form.vendorLedgerId,
      paymentModeLedgerId: this.form.paymentModeLedgerId,
      paymentDate: this.form.paymentDate,
      referenceChequeNo: this.form.referenceChequeNo,
      notes: this.form.notes,
      totalAmountPaid: this.totalAllocated,
      totalDiscountReceived: this.totalDiscount,
      allocations,
    };

    this.p2p.createVendorPayment(payload).subscribe({
      next: (vp: any) => {
        this.submitting = false;
        this.toast.success(
          `Vendor Payment ${vp?.voucherNo || ''} recorded successfully! Total Paid: ₹${Number(this.totalAllocated || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Disbursement Complete',
        );
        this.viewMode = 'list';
        this.loadPayments();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to record payment';
        this.toast.error(this.createError, 'Payment Failed');
      },
    });
  }
}
