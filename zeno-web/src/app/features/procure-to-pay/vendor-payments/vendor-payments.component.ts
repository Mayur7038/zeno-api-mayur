import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';

@Component({
  selector: 'app-vendor-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Vendor Payments</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-credit-card"></i> Make Payment
            </button>
          </div>
        </div>

        <!-- FILTER CARD -->
        <!-- TOOLBAR & TABLE CARD -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search vendor payments..."
              />
            </div>

            <div class="toolbar-filters">
              <select class="form-select" [(ngModel)]="selectedVendor">
                <option value="">All Vendors</option>
                @for (v of vendors; track v.id) {
                  <option [value]="v.id">{{ v.name }}</option>
                }
              </select>

              <button class="btn-export" (click)="exportPayments()" [disabled]="filteredPayments.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>
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
              @if (filteredPayments.length === 0) {
                <tr>
                  <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No vendor payments recorded yet. Click "Make Payment" to disburse and settle bills.
                  </td>
                </tr>
              }
              @for (p of filteredPayments; track p.id) {
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

          <div class="form-grid">
            <div class="form-group">
              <label class="required">Vendor (To)</label>
              <zeno-searchable-select
                [options]="vendors"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Select Vendor..."
                [(ngModel)]="form.vendorLedgerId"
                (selectChange)="onVendorChange()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Paid From (Bank / Cash Account)</label>
              <zeno-searchable-select
                [options]="paymentModes"
                labelKey="name"
                valueKey="id"
                placeholder="Select Bank / Cash Account..."
                [(ngModel)]="form.paymentModeLedgerId"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Payment Date</label>
              <input type="date" [(ngModel)]="form.paymentDate" />
            </div>

            <div class="form-group">
              <label class="required">Payment Mode</label>
              <select [(ngModel)]="form.paymentType">
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
              <label class="required">Total Amount Paid (₹)</label>
              <input type="number" step="0.01" [(ngModel)]="form.totalAmount" (input)="onAmountChanged()" />
            </div>

            <div class="form-group">
              <label>Ref / UTR / Cheque Number</label>
              <input type="text" [(ngModel)]="form.referenceChequeNo" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label>Remarks / Narration</label>
              <input type="text" [(ngModel)]="form.notes" />
            </div>
          </div>

          <!-- BILL-BY-BILL INVOICE ALLOCATION SECTION -->
          <div class="line-items-section">
            <div class="section-title-wrap">
              <div>
                <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Bill-by-Bill Invoice Allocations</h3>
                <p style="font-size: 0.78rem; color: var(--surface-500); margin: 2px 0 0 0;">Allocate payment against open vendor bills</p>
              </div>
              @if (pendingBills.length > 0) {
                <button type="button" class="btn-sm btn-outline" (click)="autoAllocateFIFO()">
                  <i class="pi pi-bolt"></i> Auto-Allocate (FIFO)
                </button>
              }
            </div>

            @if (pendingBills.length === 0) {
              <div class="empty-invoices-notice">
                <i class="pi pi-info-circle"></i>
                <span>{{ form.vendorLedgerId ? 'No unpaid bills found for this vendor. Payment will be recorded as on-account payment.' : 'Please select a vendor to view open bills.' }}</span>
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
                      <th style="width: 20%;">Pay Amount (₹)</th>
                      <th style="width: 15%;">Discount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (b of pendingBills; track b.id) {
                      <tr>
                        <td class="font-mono font-bold">{{ b.voucherNo }}</td>
                        <td>{{ b.invoiceDate }}</td>
                        <td>₹{{ (b.grandTotal || 0) | number:'1.2-2' }}</td>
                        <td class="text-success font-mono">₹{{ ((b.grandTotal || 0) - (b.pendingBalance || 0)) | number:'1.2-2' }}</td>
                        <td class="font-bold text-danger">₹{{ (b.pendingBalance || 0) | number:'1.2-2' }}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            [(ngModel)]="b.allocatedAmount"
                            (input)="recalculateAllocations()"
                            min="0"
                            [max]="b.pendingBalance"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            [(ngModel)]="b.discountAmount"
                            (input)="recalculateAllocations()"
                            min="0"
                          />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- SUMMARY & TOTALS -->
          <div class="totals-summary-card">
            <div class="summary-line">
              <span>Total Paid:</span>
              <strong>₹{{ (totalAllocated || 0) | number:'1.2-2' }}</strong>
            </div>
            @if (totalDiscount > 0) {
              <div class="summary-line text-success">
                <span>Discount Taken:</span>
                <strong>₹{{ (totalDiscount || 0) | number:'1.2-2' }}</strong>
              </div>
            }
            <div class="summary-line grand-total">
              <span>Total Settled:</span>
              <strong>₹{{ ((totalAllocated || 0) + (totalDiscount || 0)) | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './vendor-payments.component.scss',
})
export class VendorPaymentsComponent implements OnInit {
  viewMode: 'list' | 'create' = 'list';
  payments: any[] = [];
  vendors: any[] = [];
  paymentModes: any[] = [];
  pendingBills: any[] = [];

  submitting = false;
  createError = '';
  searchQuery = '';
  selectedVendor = '';

  get filteredPayments(): any[] {
    let list = this.payments || [];
    if (this.selectedVendor) {
      list = list.filter((p: any) => p.vendorLedgerId === this.selectedVendor);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter((p: any) =>
        (p.voucherNo && p.voucherNo.toLowerCase().includes(q)) ||
        (p.vendorLedger?.name && p.vendorLedger.name.toLowerCase().includes(q)) ||
        (p.referenceChequeNo && p.referenceChequeNo.toLowerCase().includes(q))
      );
    }
    return list;
  }

  exportPayments() {
    const list = this.filteredPayments;
    if (!list || list.length === 0) return;
    const headers = ['Voucher No', 'Payment Date', 'Vendor', 'Payment Mode', 'Reference No', 'Discount Taken', 'Amount Paid'];
    const rows = list.map((p) => [
      p.voucherNo || '',
      p.paymentDate || '',
      p.vendorLedger?.name || '',
      p.paymentModeLedger?.name || '',
      p.referenceChequeNo || '',
      p.totalDiscountReceived || 0,
      p.totalAmountPaid || 0
    ]);
    exportToCsv('Vendor_Payments', headers, rows);
    this.toast.success('Vendor payments exported successfully!', 'Export Complete');
  }

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
    paymentType: 'BANK',
    totalAmount: 0,
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
      paymentType: 'BANK',
      totalAmount: 0,
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

  onAmountChanged() {
    let unallocated = Number(this.form.totalAmount || 0);
    for (const b of this.pendingBills) {
      if (unallocated > 0) {
        const take = Math.min(unallocated, b.pendingBalance);
        b.allocatedAmount = take;
        unallocated -= take;
      } else {
        b.allocatedAmount = 0;
      }
    }
    this.recalculateAllocations();
  }

  autoAllocateFIFO() {
    let remaining = Number(this.form.totalAmount || 0);
    if (remaining <= 0) {
      remaining = this.totalPendingBalance;
      this.form.totalAmount = remaining;
    }
    for (const b of this.pendingBills) {
      if (remaining > 0) {
        const alloc = Math.min(remaining, b.pendingBalance);
        b.allocatedAmount = alloc;
        remaining -= alloc;
      } else {
        b.allocatedAmount = 0;
      }
    }
    this.recalculateAllocations();
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
