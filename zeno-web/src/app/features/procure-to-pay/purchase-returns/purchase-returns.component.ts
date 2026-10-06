import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';

@Component({
  selector: 'app-purchase-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- PAGE HEADER -->
        <div class="page-header">
          <h1>Purchase Returns (Debit Notes)</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Purchase Return
            </button>
          </div>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-replay"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">TOTAL DEBIT NOTES</span>
              <span class="kpi-value">{{ returns.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon orange"><i class="pi pi-box"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">RETURNED UNITS</span>
              <span class="kpi-value">{{ totalRestockedUnits }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-percentage"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">TAX REVERSED</span>
              <span class="kpi-value">₹{{ totalTaxReversal | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-dollar"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">TOTAL RETURN VALUE</span>
              <span class="kpi-value">₹{{ totalReturnValue | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search Debit Note #, vendor, or invoice..."
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Return Date</th>
                <th>Vendor (Creditor)</th>
                <th>Against Invoice</th>
                <th>Godown</th>
                <th>Reason</th>
                <th>Taxable</th>
                <th>Tax Reversed</th>
                <th>Grand Total</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredReturns.length === 0) {
                <tr>
                  <td colspan="10" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No purchase returns recorded yet. Click "Create Purchase Return" to issue a debit note.
                  </td>
                </tr>
              }
              @for (pr of filteredReturns; track pr.id) {
                <tr (click)="viewReturn(pr)" style="cursor: pointer;">
                  <td class="font-mono font-bold" style="color: #991b1b">{{ pr.voucherNo }}</td>
                  <td>{{ pr.returnDate }}</td>
                  <td class="font-bold">{{ pr.vendorLedger?.name }}</td>
                  <td>
                    @if (pr.purchaseInvoice) {
                      <span class="badge-pill badge-info font-mono">{{ pr.purchaseInvoice?.voucherNo }}</span>
                    } @else {
                      <span class="text-muted">Direct Return</span>
                    }
                  </td>
                  <td>
                    <span class="badge-pill badge-godown">
                      <i class="pi pi-warehouse"></i> {{ pr.godown?.name || 'Main Warehouse' }}
                    </span>
                  </td>
                  <td>{{ pr.reason || 'Damaged' }}</td>
                  <td class="font-mono">₹{{ (+pr.subtotal).toFixed(2) }}</td>
                  <td class="font-mono text-amber">₹{{ (+pr.taxTotal).toFixed(2) }}</td>
                  <td class="font-mono font-bold text-red">₹{{ (+pr.grandTotal).toFixed(2) }}</td>
                  <td class="text-right">
                    <div class="action-buttons" (click)="$event.stopPropagation()">
                      <button class="btn-view-pill" title="View Debit Note Voucher" (click)="viewReturn(pr)">
                        <i class="pi pi-eye"></i> View
                      </button>
                      <button class="action-btn" title="Print Debit Note" (click)="viewReturn(pr)">
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
        <!-- CREATE PURCHASE RETURN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>New Purchase Return (Debit Note)</h1>
            <span class="badge-pill" style="background: #fee2e2; color: #991b1b;">Stock OUT &amp; Ledger Debit</span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-danger" (click)="submitCreateReturn()" [disabled]="submitting || returnForm.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Debit Note...
              } @else {
                <i class="pi pi-check"></i> Post Purchase Return
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

          <!-- HEADER INPUTS -->
          <div class="form-grid-3">
            <div class="form-group">
              <label>Return Date *</label>
              <input type="date" [(ngModel)]="returnForm.returnDate" required />
            </div>

            <div class="form-group">
              <label>Vendor (Sundry Creditor) *</label>
              <select [(ngModel)]="returnForm.vendorLedgerId" (change)="onVendorChange()" required>
                <option value="">-- Select Vendor --</option>
                @for (v of vendors; track v.id) {
                  <option [value]="v.id">{{ v.name }} ({{ v.gstin || 'Unregistered' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Dispatch Godown (Warehouse) *</label>
              <select [(ngModel)]="returnForm.godownId" required>
                @for (g of tenant.godowns(); track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Main' }})</option>
                }
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 14px;">
            <div class="form-group">
              <label>Link Purchase Invoice (Optional)</label>
              <select [(ngModel)]="returnForm.purchaseInvoiceId" (change)="onInvoiceSelect()">
                <option value="">-- Direct Return (No specific bill) --</option>
                @for (inv of vendorInvoices; track inv.id) {
                  <option [value]="inv.id">
                    {{ inv.voucherNo }} (Bill: {{ inv.vendorBillNo || 'N/A' }} | Date: {{ inv.invoiceDate }} | Total: ₹{{ inv.grandTotal }})
                  </option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Reason for Return</label>
              <select [(ngModel)]="returnForm.reason">
                <option value="Damaged Goods / Packaging Defect">Damaged Goods / Packaging Defect</option>
                <option value="Quality Specifications Mismatch">Quality Specifications Mismatch</option>
                <option value="Excess Quantity Supplied">Excess Quantity Supplied</option>
                <option value="Rate or Discount Discrepancy">Rate or Discount Discrepancy</option>
                <option value="Expired / Past Shelf Life">Expired / Past Shelf Life</option>
                <option value="Other / Commercial Terms">Other / Commercial Terms</option>
              </select>
            </div>
          </div>

          <!-- LINE ITEMS TABLE -->
          <div class="line-items-section">
            <div class="section-title">
              <span>Items to Return</span>
              <button class="btn-secondary add-line-btn" (click)="addLine()">
                <i class="pi pi-plus"></i> Add Item Line
              </button>
            </div>

            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th style="width: 35%;">Item / Product *</th>
                  <th style="width: 10%;">Unit</th>
                  <th style="width: 15%;">Return Qty *</th>
                  <th style="width: 15%;">Rate (₹) *</th>
                  <th style="width: 10%;">GST %</th>
                  <th style="width: 15%;">Total Debit (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @if (returnForm.items.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center" style="padding: 24px; color: var(--surface-500);">
                      No items to return. Select a Purchase Invoice or click "Add Item Line" above.
                    </td>
                  </tr>
                }
                @for (line of returnForm.items; track $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="line.itemId" (change)="onItemSelect(line)" style="width: 100%;">
                        <option value="">-- Select Item --</option>
                        @for (it of itemsList; track it.id) {
                          <option [value]="it.id">{{ it.name }} (SKU: {{ it.sku || 'N/A' }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <span class="unit-badge">{{ line.unitCode || 'NOS' }}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.returnedQty"
                        (input)="calculateLine(line)"
                        min="1"
                        style="width: 100%;"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.rate"
                        (input)="calculateLine(line)"
                        min="0"
                        style="width: 100%;"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.gstRate"
                        (input)="calculateLine(line)"
                        style="width: 100%;"
                      />
                    </td>
                    <td class="font-mono font-bold text-red">
                      ₹{{ line.totalAmount || 0 }}
                    </td>
                    <td class="text-right">
                      @if (returnForm.items.length > 1) {
                        <button class="remove-line-btn" (click)="removeLine($index)">
                          <i class="pi pi-trash"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- TOTALS & SUMMARY -->
          <div class="totals-grid">
            <div class="reversal-info-panel">
              <div class="reversal-header">
                <i class="pi pi-info-circle"></i>
                <strong>Accounting &amp; Inventory Impact</strong>
              </div>
              <ul class="reversal-list">
                <li>Inventory will be <strong>decremented (Stock OUT)</strong> from selected Godown.</li>
                <li>Vendor account will be <strong>debited</strong>, reducing outstanding payable.</li>
                <li>Input Tax Credit (ITC) will be <strong>reversed automatically</strong>.</li>
              </ul>
            </div>

            <div class="totals-panel">
              <div class="total-row">
                <span>Taxable Return Value:</span>
                <span class="font-mono">₹{{ returnSubtotal.toFixed(2) }}</span>
              </div>
              <div class="total-row">
                <span>Reversed GST Tax:</span>
                <span class="font-mono text-amber">₹{{ returnTaxTotal.toFixed(2) }}</span>
              </div>
              <div class="total-row grand-total text-red">
                <span>Total Debit Note Amount:</span>
                <span class="font-mono">₹{{ returnGrandTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-danger" (click)="submitCreateReturn()" [disabled]="submitting || returnForm.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Debit Note...
              } @else {
                <i class="pi pi-check"></i> Post Purchase Return
              }
            </button>
          </div>
        </div>
      } @else if (viewMode === 'view' && viewingReturn) {
        <!-- VIEW PURCHASE RETURN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Debit Note: {{ viewingReturn.voucherNo }}</h1>
            <span class="badge-pill" style="background: #fee2e2; color: #991b1b;">
              <i class="pi pi-replay"></i> RETURN POSTED
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Debit Note
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="invoice-box">
            <!-- REVERSAL BANNER -->
            <div class="reversal-banner">
              <i class="pi pi-check-circle" style="font-size: 1.25rem;"></i>
              <div>
                <strong>Debit Note Posted:</strong>
                Inventory stock was deducted from warehouse, and accounts payable to {{ viewingReturn.vendorLedger?.name }} was reduced by ₹{{ (+viewingReturn.grandTotal).toFixed(2) }}.
              </div>
            </div>

            <div class="invoice-header">
              <div>
                <h2 style="color: #991b1b; margin: 0 0 4px 0;">DEBIT NOTE</h2>
                <div class="font-mono"><strong>Debit Note #: </strong>{{ viewingReturn.voucherNo }}</div>
                <div><strong>Date: </strong>{{ viewingReturn.returnDate }}</div>
                <div><strong>Reference Invoice: </strong>{{ viewingReturn.purchaseInvoice?.voucherNo || 'Direct Return' }}</div>
                <div><strong>Reason: </strong>{{ viewingReturn.reason || 'Goods Return' }}</div>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0 0 4px 0;">{{ tenant.currentCompany()?.legalName }}</h3>
                <div>{{ tenant.currentCompany()?.tradeName }}</div>
                <div>GSTIN: <span class="font-mono">{{ tenant.currentCompany()?.gstin || 'N/A' }}</span></div>
                <div>Branch: {{ viewingReturn.branch?.branchName || 'Main HO' }}</div>
              </div>
            </div>

            <div class="vendor-box">
              <div class="vendor-grid">
                <div>
                  <span class="label-muted">Issued To (Vendor)</span>
                  <div class="font-bold" style="font-size: 1.05rem;">{{ viewingReturn.vendorLedger?.name }}</div>
                  <div>GSTIN: <span class="font-mono">{{ viewingReturn.vendorLedger?.gstin || 'Unregistered' }}</span></div>
                </div>
                <div style="text-align: right;">
                  <span class="label-muted">Tax & Accounting Reversal</span>
                  <div>Tax Subtotal: <span class="font-mono">₹{{ (+viewingReturn.subtotal).toFixed(2) }}</span></div>
                  <div>Reversed Tax: <span class="font-mono">₹{{ (+viewingReturn.taxTotal).toFixed(2) }}</span></div>
                </div>
              </div>
            </div>

            <!-- ITEMS TABLE -->
            <div style="font-weight: 700; font-size: 0.9375rem; color: var(--surface-800); margin-top: 8px;">
              Returned Items Specification
            </div>
            <table class="zeno-table print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th class="text-right">Returned Qty</th>
                  <th class="text-right">Unit Rate</th>
                  <th class="text-right">Taxable</th>
                  <th class="text-right">GST Total</th>
                  <th class="text-right">Total Debit Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (it of viewingReturn.items; track it.id; let idx = $index) {
                  <tr>
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="font-bold">{{ it.item?.name }}</div>
                      <div class="font-xs" style="color: var(--surface-500)">SKU: {{ it.item?.sku || 'N/A' }}</div>
                    </td>
                    <td class="text-right font-mono font-bold text-red">{{ it.returnedQty }}</td>
                    <td class="text-right font-mono">₹{{ (+it.rate).toFixed(2) }}</td>
                    <td class="text-right font-mono">₹{{ (+it.taxableAmount).toFixed(2) }}</td>
                    <td class="text-right font-mono text-amber">
                      ₹{{ ((+it.cgstAmount || 0) + (+it.sgstAmount || 0) + (+it.igstAmount || 0)).toFixed(2) }}
                    </td>
                    <td class="text-right font-mono font-bold text-red">₹{{ (+it.totalAmount).toFixed(2) }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="print-totals">
              <div><strong>Taxable Subtotal: </strong>₹{{ (+viewingReturn.subtotal).toFixed(2) }}</div>
              <div><strong>Reversed GST Tax: </strong>₹{{ (+viewingReturn.taxTotal).toFixed(2) }}</div>
              <div class="print-grand" style="color: #991b1b;">
                <strong>Debit Note Total: </strong>₹{{ (+viewingReturn.grandTotal).toFixed(2) }}
              </div>
            </div>
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
    .filter-card { padding: 16px; }
    .filter-group { position: relative; max-width: 400px; .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); } input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: var(--radius-sm); font-size: 0.875rem; } }
    .badge-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
    .badge-info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-godown { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .btn-view-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600; background: var(--surface-100); border: 1px solid var(--surface-300); cursor: pointer; &:hover { background: var(--surface-200); } }
    .action-buttons { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
    .action-btn { width: 32px; height: 32px; border: 1px solid var(--surface-200); background: var(--surface-0); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--surface-600); &:hover { background: var(--surface-100); } }
    .btn-danger { background: #dc2626; color: #fff; border: none; padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; &:hover { background: #b91c1c; } }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); } input, select, textarea { border: 1px solid var(--surface-300); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.875rem; } }
    .line-items-section { margin: 20px 0; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; background: var(--surface-50); .section-title { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; font-weight: 700; margin-bottom: 12px; } .line-table { background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); input, select { border: 1px solid var(--surface-200); padding: 6px 8px; border-radius: 4px; } .unit-badge { display: inline-block; padding: 4px 8px; background: var(--surface-100); border-radius: 4px; font-size: 0.75rem; font-weight: 600; } } .add-line-btn { font-size: 0.8125rem; padding: 6px 12px; } .remove-line-btn { background: none; border: none; color: var(--danger); cursor: pointer; } }
    .totals-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .reversal-info-panel { background: #fff5f5; border: 1px solid #fed7d7; border-radius: var(--radius-sm); padding: 16px; font-size: 0.8125rem; color: #742a2a; .reversal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 700; } .reversal-list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; } }
    .totals-panel { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.875rem; &.grand-total { border-top: 2px solid var(--surface-300); margin-top: 8px; padding-top: 10px; font-size: 1.125rem; font-weight: 700; } } }
    .invoice-box { display: flex; flex-direction: column; gap: 20px; }
    .reversal-banner { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.875rem; background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; }
    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--surface-200); padding-bottom: 16px; }
    .vendor-box { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; }
    .vendor-grid { display: flex; justify-content: space-between; align-items: flex-start; }
    .label-muted { display: block; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: var(--surface-500); margin-bottom: 2px; }
    .print-totals { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 16px; font-size: 0.9375rem; .print-grand { font-size: 1.25rem; border-top: 2px solid var(--surface-300); padding-top: 6px; } }
    .text-red { color: #dc2626 !important; }
    .text-purple { color: #9333ea !important; }
    .text-amber { color: #d97706 !important; }
  `],
})
export class PurchaseReturnsComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  returns: any[] = [];
  vendors: any[] = [];
  itemsList: any[] = [];
  vendorInvoices: any[] = [];
  searchQuery = '';

  submitting = false;
  createError = '';
  viewingReturn: any = null;

  returnForm: any = {
    returnDate: new Date().toISOString().split('T')[0],
    vendorLedgerId: '',
    purchaseInvoiceId: '',
    godownId: '',
    reason: 'Damaged Goods / Packaging Defect',
    items: [],
  };

  returnSubtotal = 0;
  returnTaxTotal = 0;
  returnGrandTotal = 0;

  get filteredReturns(): any[] {
    if (!this.searchQuery) return this.returns;
    const q = this.searchQuery.toLowerCase();
    return this.returns.filter(
      (r) =>
        r.voucherNo?.toLowerCase().includes(q) ||
        r.vendorLedger?.name?.toLowerCase().includes(q) ||
        r.purchaseInvoice?.voucherNo?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q),
    );
  }

  get totalReturnValue(): number {
    return this.returns.reduce((sum, r) => sum + (+r.grandTotal || 0), 0);
  }

  get totalTaxReversal(): number {
    return this.returns.reduce((sum, r) => sum + (+r.taxTotal || 0), 0);
  }

  get totalRestockedUnits(): number {
    return this.returns.reduce((sum, r) => sum + (r.items?.reduce((s: number, i: any) => s + Number(i.quantity || i.returnedQty || 0), 0) || 0), 0);
  }

  constructor(
    private p2p: P2pService,
    public tenant: TenantService,
    private masters: MastersService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadReturns();
        this.loadMasters();
        this.checkQueryInvoice();
      },
    });
  }

  checkQueryInvoice() {
    this.route.queryParams.subscribe((params) => {
      const invId = params['invoiceId'];
      if (invId) {
        this.openCreateModal();
        this.p2p.getPurchaseInvoiceById(invId).subscribe({
          next: (inv) => {
            if (inv) {
              this.returnForm.vendorLedgerId = inv.vendorLedgerId;
              this.returnForm.purchaseInvoiceId = inv.id;
              this.populateItemsFromInvoiceData(inv);
            }
          },
        });
      }
    });
  }

  loadReturns() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.p2p.getPurchaseReturns(compId).subscribe({
      next: (res) => (this.returns = res || []),
    });
  }

  loadMasters() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    this.masters.getLedgers(compId, true).subscribe({
      next: (v) => (this.vendors = v || []),
    });

    this.masters.getItems(compId).subscribe({
      next: (it) => (this.itemsList = it || []),
    });
  }

  openCreateModal() {
    this.returnForm = {
      returnDate: new Date().toISOString().split('T')[0],
      vendorLedgerId: this.vendors[0]?.id || '',
      purchaseInvoiceId: '',
      godownId: this.tenant.currentGodown()?.id || (this.tenant.godowns()[0]?.id || ''),
      reason: 'Damaged Goods / Packaging Defect',
      items: [
        {
          itemId: this.itemsList[0]?.id || '',
          unitId: this.itemsList[0]?.unitId || '',
          unitCode: this.itemsList[0]?.unit?.code || 'NOS',
          returnedQty: 1,
          rate: Number(this.itemsList[0]?.purchaseRate || 100),
          gstRate: Number(this.itemsList[0]?.gstRate || 18),
          totalAmount: 0,
        },
      ],
    };

    if (this.returnForm.vendorLedgerId) {
      this.onVendorChange();
    }
    this.calculateLine(this.returnForm.items[0]);
    this.createError = '';
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.viewingReturn = null;
    this.createError = '';
    this.loadReturns();
  }

  onVendorChange() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId || !this.returnForm.vendorLedgerId) return;

    this.p2p.getPurchaseInvoices(compId).subscribe({
      next: (invoices) => {
        this.vendorInvoices = (invoices || []).filter(
          (inv) => inv.vendorLedgerId === this.returnForm.vendorLedgerId,
        );
      },
    });
  }

  onInvoiceSelect() {
    if (this.returnForm.purchaseInvoiceId) {
      this.pullInvoiceItems();
    }
  }

  pullInvoiceItems() {
    this.p2p.getPurchaseInvoiceById(this.returnForm.purchaseInvoiceId).subscribe({
      next: (inv) => {
        if (inv) {
          this.populateItemsFromInvoiceData(inv);
        }
      },
    });
  }

  populateItemsFromInvoiceData(inv: any) {
    if (inv.godownId) {
      this.returnForm.godownId = inv.godownId;
    }
    if (inv.items && inv.items.length > 0) {
      this.returnForm.items = inv.items.map((it: any) => ({
        itemId: it.itemId,
        unitId: it.unitId,
        unitCode: it.unit?.code || 'NOS',
        returnedQty: Number(it.receivedQty || 1),
        rate: Number(it.rate || 0),
        gstRate: Number(it.gstRate || 18),
        totalAmount: 0,
      }));
      this.returnForm.items.forEach((line: any) => this.calculateLine(line));
    }
  }

  addLine() {
    this.returnForm.items.push({
      itemId: '',
      unitId: '',
      unitCode: 'NOS',
      returnedQty: 1,
      rate: 0,
      gstRate: 18,
      totalAmount: 0,
    });
  }

  removeLine(index: number) {
    this.returnForm.items.splice(index, 1);
    this.recalculateTotals();
  }

  onItemSelect(line: any) {
    const it = this.itemsList.find((i) => i.id === line.itemId);
    if (it) {
      line.unitId = it.unitId;
      line.unitCode = it.unit?.code || 'NOS';
      line.rate = Number(it.purchaseRate || 0);
      line.gstRate = Number(it.gstRate || 18);
      this.calculateLine(line);
    }
  }

  calculateLine(line: any) {
    const qty = Number(line.returnedQty || 0);
    const rate = Number(line.rate || 0);
    const gstRate = Number(line.gstRate || 0);

    const taxable = qty * rate;
    const tax = (taxable * gstRate) / 100;
    line.totalAmount = Number((taxable + tax).toFixed(2));
    this.recalculateTotals();
  }

  recalculateTotals() {
    let sub = 0;
    let tax = 0;
    for (const l of this.returnForm.items) {
      const q = Number(l.returnedQty || 0);
      const r = Number(l.rate || 0);
      const g = Number(l.gstRate || 0);
      const taxable = q * r;
      sub += taxable;
      tax += (taxable * g) / 100;
    }
    this.returnSubtotal = sub;
    this.returnTaxTotal = tax;
    this.returnGrandTotal = sub + tax;
  }

  submitCreateReturn() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.tenant.currentBranch()?.id;

    if (!this.returnForm.vendorLedgerId) {
      this.createError = 'Please select a vendor';
      return;
    }
    if (!this.returnForm.godownId) {
      this.createError = 'Please select a warehouse godown for stock-out dispatch';
      return;
    }
    if (this.returnForm.items.length === 0) {
      this.createError = 'Please add at least one line item to return';
      return;
    }

    this.submitting = true;
    this.createError = '';

    const vendor = this.vendors.find((v) => v.id === this.returnForm.vendorLedgerId);
    const isInterstate = vendor?.stateCode && vendor.stateCode !== '27';

    const payload = {
      companyId: compId,
      branchId,
      godownId: this.returnForm.godownId,
      vendorLedgerId: this.returnForm.vendorLedgerId,
      purchaseInvoiceId: this.returnForm.purchaseInvoiceId || null,
      returnDate: this.returnForm.returnDate,
      reason: this.returnForm.reason,
      items: this.returnForm.items.map((i: any) => {
        const taxable = Number(i.returnedQty) * Number(i.rate);
        const tax = (taxable * Number(i.gstRate)) / 100;
        return {
          itemId: i.itemId,
          variantId: null,
          returnedQty: Number(i.returnedQty),
          rate: Number(i.rate),
          taxableAmount: taxable,
          cgstAmount: isInterstate ? 0 : tax / 2,
          sgstAmount: isInterstate ? 0 : tax / 2,
          igstAmount: isInterstate ? tax : 0,
        };
      }),
    };

    this.p2p.createPurchaseReturn(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadReturns();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to create purchase return';
      },
    });
  }

  viewReturn(pr: any) {
    this.viewingReturn = pr;
    this.viewMode = 'view';
  }
}
