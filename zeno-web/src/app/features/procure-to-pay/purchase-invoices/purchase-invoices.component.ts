import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';

@Component({
  selector: 'app-purchase-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Purchase Invoices</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-receipt"></i> Create Purchase Invoice
            </button>
          </div>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-receipt"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">TOTAL INVOICES</span>
              <span class="kpi-value">{{ invoices.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon orange"><i class="pi pi-clock"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">PENDING PAYMENT</span>
              <span class="kpi-value">{{ unpaidInvoicesCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-check"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">PAID INVOICES</span>
              <span class="kpi-value">{{ paidInvoicesCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-dollar"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">TOTAL BILL VALUE</span>
              <span class="kpi-value">₹{{ totalInvoiceValue | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- FILTER CARD -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search Invoice #, vendor bill, or vendor..."
              [(ngModel)]="searchQuery"
              (input)="loadInvoices()"
            />
          </div>

          <div class="status-tabs">
            <button [class.active]="selectedStatus === ''" (click)="filterStatus('')">All Invoices</button>
            <button [class.active]="selectedStatus === 'UNPAID'" (click)="filterStatus('UNPAID')">Unpaid</button>
            <button [class.active]="selectedStatus === 'PARTIALLY_PAID'" (click)="filterStatus('PARTIALLY_PAID')">Partially Paid</button>
            <button [class.active]="selectedStatus === 'PAID'" (click)="filterStatus('PAID')">Paid</button>
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Vendor (Creditor)</th>
                <th>Vendor Bill #</th>
                <th>Taxable</th>
                <th>Tax Total</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (invoices.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No purchase invoices found matching your filters.
                  </td>
                </tr>
              }
              @for (pi of invoices; track pi.id) {
                <tr>
                  <td class="font-mono font-bold" style="color: var(--primary-700)">{{ pi.voucherNo }}</td>
                  <td>{{ pi.invoiceDate }}</td>
                  <td class="font-bold">{{ pi.vendorLedger?.name }}</td>
                  <td class="font-mono">{{ pi.vendorBillNo }}</td>
                  <td class="font-mono">₹{{ pi.taxableTotal }}</td>
                  <td class="font-mono">₹{{ pi.taxTotal }}</td>
                  <td class="font-mono font-bold">₹{{ pi.grandTotal }}</td>
                  <td>
                    <span class="badge-pill" [ngClass]="{
                      'badge-pending': pi.status === 'UNPAID',
                      'badge-partial': pi.status === 'PARTIALLY_PAID',
                      'badge-cleared': pi.status === 'PAID'
                    }">
                      {{ pi.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      @if (pi.status !== 'PAID') {
                        <button class="btn-pay-action" (click)="makePaymentFor(pi)" title="Pay Bill">
                          <i class="pi pi-credit-card"></i> Pay
                        </button>
                      }
                      <button class="action-btn" title="Create Purchase Return / Debit Note" (click)="createReturnFor(pi)">
                        <i class="pi pi-replay"></i>
                      </button>
                      <button class="action-btn" title="View / Print Tax Invoice" (click)="viewInvoice(pi.id)">
                        <i class="pi pi-print"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Record Purchase Invoice</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitCreateInvoice()" [disabled]="submitting || form.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Double-Entry...
              } @else {
                <i class="pi pi-check"></i> Post Purchase Invoice
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

          <div class="form-grid-4">
            <div class="form-group">
              <label>Invoice Date *</label>
              <input type="date" [(ngModel)]="form.invoiceDate" required />
            </div>

            <div class="form-group">
              <label>Vendor (Creditor) *</label>
              <select [(ngModel)]="form.vendorLedgerId" (change)="onVendorChange()" required>
                <option value="">-- Select Vendor --</option>
                @for (v of vendors; track v.id) {
                  <option [value]="v.id">{{ v.name }} (State: {{ v.stateCode || '27' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Vendor Bill # *</label>
              <input type="text" [(ngModel)]="form.vendorBillNo" placeholder="e.g. INV-2026-99" required />
            </div>

            <div class="form-group">
              <label>Vendor Bill Date</label>
              <input type="date" [(ngModel)]="form.vendorBillDate" />
            </div>
          </div>

          <!-- PENDING GRN PULL BAR -->
          @if (form.vendorLedgerId) {
            <div class="po-pull-bar">
              <div class="po-pull-text">
                <i class="pi pi-box"></i> Pull line items from received Goods Receipt Notes (GRN)
              </div>
              <button type="button" class="btn-secondary" (click)="openGrnModal()">
                <i class="pi pi-search"></i> Select Pending GRNs ({{ pendingGrns.length }} available)
              </button>
            </div>
          }

          <!-- INVOICE ITEMS -->
          <div class="line-items-section">
            <div class="section-title">Invoice Bill Items</div>
            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Qty *</th>
                  <th>Rate (₹) *</th>
                  <th>Discount (₹)</th>
                  <th>GST %</th>
                  <th class="text-right">Total (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @if (form.items.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center" style="padding: 24px; color: var(--surface-500);">
                      No items added. Click "Select Pending GRNs" or add direct item line.
                    </td>
                  </tr>
                }
                @for (line of form.items; track $index) {
                  <tr>
                    <td class="font-bold">{{ line.itemName || 'Selected Item' }}</td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.receivedQty"
                        (input)="calculateLine(line)"
                        min="1"
                        style="width: 80px;"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.rate"
                        (input)="calculateLine(line)"
                        style="width: 100px;"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.discountAmount"
                        (input)="calculateLine(line)"
                        style="width: 80px;"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.gstRate"
                        (input)="calculateLine(line)"
                        style="width: 70px;"
                      />
                    </td>
                    <td class="text-right font-mono font-bold">₹{{ line.totalAmount }}</td>
                    <td class="text-right">
                      <button class="remove-line-btn" (click)="removeLine($index)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <button type="button" class="btn-secondary add-line-btn" (click)="addDirectItem()">
              <i class="pi pi-plus"></i> Add Direct Item Line
            </button>
          </div>

          <!-- TOTALS & GST BREAKDOWN -->
          <div class="totals-grid">
            <div class="gst-summary-panel">
              <div class="font-bold" style="margin-bottom: 8px; font-size: 0.875rem;">
                Tax Place of Supply: {{ isInterstate ? 'Inter-State (IGST 100%)' : 'Intra-State (CGST 50% + SGST 50%)' }}
              </div>
              <div class="font-mono text-sm" style="color: var(--surface-600);">
                <div>Taxable Total: ₹{{ invTaxableTotal.toFixed(2) }}</div>
                @if (!isInterstate) {
                  <div>CGST: ₹{{ (invTaxTotal / 2).toFixed(2) }}</div>
                  <div>SGST: ₹{{ (invTaxTotal / 2).toFixed(2) }}</div>
                } @else {
                  <div>IGST: ₹{{ invTaxTotal.toFixed(2) }}</div>
                }
              </div>
            </div>

            <div class="totals-panel font-mono">
              <div class="total-row"><span>Subtotal:</span><span>₹{{ invSubtotal.toFixed(2) }}</span></div>
              <div class="total-row"><span>GST Tax Total:</span><span>₹{{ invTaxTotal.toFixed(2) }}</span></div>
              <div class="total-row grand-total"><span>Grand Total:</span><span>₹{{ invGrandTotal.toFixed(2) }}</span></div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitCreateInvoice()" [disabled]="submitting || form.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Double-Entry...
              } @else {
                <i class="pi pi-check"></i> Post Purchase Invoice
              }
            </button>
          </div>
        </div>
      } @else if (viewMode === 'view' && viewingPi) {
        <!-- VIEW INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Purchase Invoice: {{ viewingPi.voucherNo }}</h1>
            <span class="badge-pill badge-cleared">{{ viewingPi.status }}</span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Invoice
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="invoice-box">
            <div class="invoice-header">
              <div>
                <h2 style="color: var(--primary-700); margin: 0 0 6px 0;">TAX INVOICE</h2>
                <div class="font-mono"><strong>Invoice #: </strong>{{ viewingPi.voucherNo }}</div>
                <div><strong>Invoice Date: </strong>{{ viewingPi.invoiceDate }}</div>
                <div><strong>Vendor Bill #: </strong>{{ viewingPi.vendorBillNo }}</div>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0 0 4px 0;">{{ tenant.currentCompany()?.legalName }}</h3>
                <div>{{ viewingPi.branch?.branchName }}</div>
                <div>GSTIN: {{ tenant.currentCompany()?.gstin || 'N/A' }}</div>
              </div>
            </div>

            <div class="vendor-box">
              <strong>Vendor Details:</strong>
              <div class="font-bold">{{ viewingPi.vendorLedger?.name }}</div>
              <div>GSTIN: {{ viewingPi.vendorLedger?.gstin || 'Unregistered' }}</div>
              <div>State Code: {{ viewingPi.placeOfSupplyStateCode }} ({{ viewingPi.isInterstate ? 'Inter-State' : 'Intra-State' }})</div>
            </div>

            <table class="zeno-table print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (it of viewingPi.items; track it.id; let idx = $index) {
                  <tr>
                    <td>{{ idx + 1 }}</td>
                    <td class="font-bold">{{ it.item?.name }}</td>
                    <td>{{ it.receivedQty }} {{ it.unit?.code }}</td>
                    <td>₹{{ it.rate }}</td>
                    <td>₹{{ it.taxableAmount }}</td>
                    <td>{{ it.gstRate }}%</td>
                    <td class="text-right font-mono font-bold">₹{{ it.totalAmount }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="print-totals">
              <div>Taxable Total: ₹{{ viewingPi.taxableTotal }}</div>
              <div>CGST: ₹{{ viewingPi.cgstTotal }} | SGST: ₹{{ viewingPi.sgstTotal }} | IGST: ₹{{ viewingPi.igstTotal }}</div>
              <div class="print-grand font-bold">Grand Total: ₹{{ viewingPi.grandTotal }}</div>
              <div style="color: #059669;">Paid: ₹{{ viewingPi.paidAmount }} | Status: {{ viewingPi.status }}</div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- SELECT PENDING GRNS DIALOG (UTILITY SELECTOR) -->
    @if (showGrnModal) {
      <div class="modal-backdrop" style="z-index: 1050;">
        <div class="modal-dialog" style="max-width: 760px;">
          <div class="modal-header">
            <h3>Pending GRNs for Selected Vendor</h3>
            <button class="close-btn" (click)="showGrnModal = false">&times;</button>
          </div>
          <div class="modal-body">
            @if (pendingGrns.length === 0) {
              <div style="padding: 32px; text-align: center; color: var(--surface-500);">
                No pending GRNs found for this vendor.
              </div>
            } @else {
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>GRN Voucher</th>
                    <th>Date</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  @for (grn of pendingGrns; track grn.id) {
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          [checked]="selectedGrnIds.includes(grn.id)"
                          (change)="toggleGrnSelect(grn.id)"
                        />
                      </td>
                      <td class="font-mono font-bold">{{ grn.voucherNo }}</td>
                      <td>{{ grn.grnDate }}</td>
                      <td>{{ grn.items?.length }} Items</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showGrnModal = false">Cancel</button>
            <button class="btn-primary" (click)="confirmPullGRNs()" [disabled]="selectedGrnIds.length === 0">
              Pull Selected GRNs ({{ selectedGrnIds.length }})
            </button>
          </div>
        </div>
      </div>
    }
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
    .filter-card { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; .filter-group { position: relative; flex: 1; max-width: 360px; .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); } input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); font-size: 0.875rem; outline: none; } } .status-tabs { display: flex; gap: 6px; button { background: none; border: 1px solid transparent; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; color: var(--surface-600); cursor: pointer; &.active { background-color: var(--primary-50); color: var(--primary-700); border-color: var(--primary-200); } } } }
    .action-buttons { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
    .btn-pay-action { background: #059669; color: #ffffff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; &:hover { background: #047857; } }
    .action-btn { width: 32px; height: 32px; border: 1px solid var(--surface-200); background: var(--surface-0); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--surface-600); }
    .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); } input, select, textarea { border: 1px solid var(--surface-300); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.875rem; } }
    .po-pull-bar { display: flex; align-items: center; justify-content: space-between; background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-sm); padding: 12px 16px; margin: 16px 0; .po-pull-text { font-size: 0.875rem; font-weight: 600; color: var(--primary-800); display: flex; align-items: center; gap: 8px; } }
    .line-items-section { margin: 16px 0; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; background: var(--surface-50); .section-title { font-size: 0.875rem; font-weight: 700; margin-bottom: 12px; } .line-table { background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); } .add-line-btn { margin-top: 12px; font-size: 0.8125rem; padding: 6px 12px; } .remove-line-btn { background: none; border: none; color: var(--danger); cursor: pointer; } }
    .totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .gst-summary-panel { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .totals-panel { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; gap: 8px; .total-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--surface-700); &.grand-total { font-size: 1.125rem; font-weight: 800; color: var(--surface-900); border-top: 2px solid var(--surface-300); padding-top: 8px; margin-top: 4px; } } }
    .badge-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
    .badge-pending { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-partial { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .badge-cleared { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .invoice-box { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--surface-200); padding-bottom: 16px; }
    .vendor-box { background: var(--surface-50); padding: 12px; border-radius: 4px; border-left: 4px solid var(--primary-600); }
    .print-totals { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 16px; }
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
export class PurchaseInvoicesComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  invoices: any[] = [];
  vendors: any[] = [];
  itemsList: any[] = [];
  pendingGrns: any[] = [];
  selectedGrnIds: string[] = [];

  selectedStatus = '';
  searchQuery = '';
  showGrnModal = false;
  submitting = false;

  get unpaidInvoicesCount(): number {
    return this.invoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID').length;
  }

  get paidInvoicesCount(): number {
    return this.invoices.filter(i => i.status === 'PAID').length;
  }

  get totalInvoiceValue(): number {
    return this.invoices.reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
  }
  createError = '';
  viewingPi: any = null;

  isInterstate = false;
  invSubtotal = 0;
  invTaxableTotal = 0;
  invTaxTotal = 0;
  invGrandTotal = 0;

  form: any = {
    invoiceDate: new Date().toISOString().split('T')[0],
    vendorLedgerId: '',
    vendorBillNo: '',
    vendorBillDate: new Date().toISOString().split('T')[0],
    items: [],
  };

  constructor(
    private p2p: P2pService,
    public tenant: TenantService,
    private masters: MastersService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadInvoices();
        this.loadMasters();
      },
    });
  }

  loadInvoices() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.p2p.getPurchaseInvoices(compId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => (this.invoices = res),
    });
  }

  loadMasters() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getLedgers(compId, true).subscribe({ next: (v) => (this.vendors = v) });
    this.masters.getItems(compId).subscribe({ next: (it) => (this.itemsList = it) });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadInvoices();
  }

  openCreateModal() {
    this.form = {
      invoiceDate: new Date().toISOString().split('T')[0],
      vendorLedgerId: this.vendors[0]?.id || '',
      vendorBillNo: '',
      vendorBillDate: new Date().toISOString().split('T')[0],
      items: [],
    };
    this.pendingGrns = [];
    this.selectedGrnIds = [];
    this.createError = '';
    this.viewMode = 'create';
    if (this.form.vendorLedgerId) {
      this.onVendorChange();
    }
  }

  backToList() {
    this.viewMode = 'list';
    this.viewingPi = null;
    this.createError = '';
    this.loadInvoices();
  }

  onVendorChange() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId || !this.form.vendorLedgerId) return;

    const vendor = this.vendors.find((v) => v.id === this.form.vendorLedgerId);
    const compState = this.tenant.currentCompany()?.stateCode || '27';
    const vendState = vendor?.stateCode || '27';
    this.isInterstate = compState !== vendState;

    this.p2p.getVendorPendingGrns(this.form.vendorLedgerId, compId).subscribe({
      next: (grns) => (this.pendingGrns = grns),
    });
  }

  openGrnModal() {
    this.showGrnModal = true;
  }

  toggleGrnSelect(grnId: string) {
    if (this.selectedGrnIds.includes(grnId)) {
      this.selectedGrnIds = this.selectedGrnIds.filter((id) => id !== grnId);
    } else {
      this.selectedGrnIds.push(grnId);
    }
  }

  confirmPullGRNs() {
    const selected = this.pendingGrns.filter((g) => this.selectedGrnIds.includes(g.id));
    this.form.items = [];

    for (const grn of selected) {
      for (const item of grn.items || []) {
        const itemMaster = this.itemsList.find((it) => it.id === item.itemId);
        this.form.items.push({
          grnItemId: item.id,
          itemId: item.itemId,
          itemName: item.item?.name,
          unitId: item.unitId,
          unitCode: item.unit?.code || 'NOS',
          receivedQty: Number(item.receivedQty),
          rate: Number(item.rate),
          discountAmount: 0,
          gstRate: Number(itemMaster?.gstRate || 18),
          taxableAmount: 0,
          totalAmount: 0,
        });
        this.calculateLine(this.form.items[this.form.items.length - 1]);
      }
    }
    this.showGrnModal = false;
  }

  addDirectItem() {
    const first = this.itemsList[0];
    const line = {
      itemId: first?.id || '',
      itemName: first?.name || '',
      unitId: first?.unitId || '',
      unitCode: first?.unit?.code || 'NOS',
      receivedQty: 1,
      rate: Number(first?.purchaseRate || 0),
      discountAmount: 0,
      gstRate: Number(first?.gstRate || 18),
      taxableAmount: 0,
      totalAmount: 0,
    };
    this.form.items.push(line);
    this.calculateLine(line);
  }

  removeLine(index: number) {
    this.form.items.splice(index, 1);
    this.recalculateTotals();
  }

  calculateLine(line: any) {
    const qty = Number(line.receivedQty || 0);
    const rate = Number(line.rate || 0);
    const disc = Number(line.discountAmount || 0);
    const gstRate = Number(line.gstRate || 0);

    const taxable = qty * rate - disc;
    const tax = (taxable * gstRate) / 100;
    line.taxableAmount = Number(taxable.toFixed(2));
    line.totalAmount = Number((taxable + tax).toFixed(2));
    this.recalculateTotals();
  }

  recalculateTotals() {
    let sub = 0;
    let taxable = 0;
    let tax = 0;

    for (const l of this.form.items) {
      const q = Number(l.receivedQty || 0);
      const r = Number(l.rate || 0);
      const d = Number(l.discountAmount || 0);
      const g = Number(l.gstRate || 0);

      const lineTaxable = q * r - d;
      sub += q * r;
      taxable += lineTaxable;
      tax += (lineTaxable * g) / 100;
    }

    this.invSubtotal = sub;
    this.invTaxableTotal = taxable;
    this.invTaxTotal = tax;
    this.invGrandTotal = Math.round(taxable + tax);
  }

  submitCreateInvoice() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.tenant.currentBranch()?.id;
    const godownId = this.tenant.currentGodown()?.id;

    if (!this.form.vendorBillNo) {
      this.createError = 'Please enter vendor bill number';
      return;
    }

    this.submitting = true;
    this.createError = '';

    const payload = {
      companyId: compId,
      branchId,
      godownId,
      purchaseType: 'GOODS',
      vendorLedgerId: this.form.vendorLedgerId,
      vendorBillNo: this.form.vendorBillNo,
      vendorBillDate: this.form.vendorBillDate,
      grnIds: this.selectedGrnIds,
      items: this.form.items.map((i: any) => ({
        grnItemId: i.grnItemId || null,
        itemId: i.itemId,
        unitId: i.unitId,
        receivedQty: i.receivedQty,
        rate: i.rate,
        discountAmount: i.discountAmount || 0,
        gstRate: i.gstRate,
      })),
    };

    this.p2p.createPurchaseInvoice(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadInvoices();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to record invoice';
      },
    });
  }

  makePaymentFor(pi: any) {
    this.router.navigate(['/procure-to-pay/vendor-payments'], {
      queryParams: {
        vendorId: pi.vendorLedgerId,
        invoiceId: pi.id,
        amount: Number(pi.grandTotal) - Number(pi.paidAmount || 0),
      },
    });
  }

  createReturnFor(pi: any) {
    this.router.navigate(['/procure-to-pay/purchase-returns'], {
      queryParams: { invoiceId: pi.id },
    });
  }

  viewInvoice(id: string) {
    this.p2p.getPurchaseInvoiceById(id).subscribe({
      next: (pi) => {
        this.viewingPi = pi;
        this.viewMode = 'view';
      },
    });
  }
}
