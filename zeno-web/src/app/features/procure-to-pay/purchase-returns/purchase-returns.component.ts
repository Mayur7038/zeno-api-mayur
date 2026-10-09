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
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-purchase-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- PAGE HEADER -->
        <div class="page-header">
          <h1>Purchase Returns</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Purchase Return
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="filter-actions">
            <select class="filter-select" [(ngModel)]="selectedVendor">
              <option value="">All Vendors</option>
              @for (v of vendors; track v.id) {
                <option [value]="v.id">{{ v.name }}</option>
              }
            </select>

            <button class="btn-export" (click)="exportReturns()" [disabled]="filteredReturns.length === 0" title="Export to CSV">
              <i class="pi pi-download"></i> Export
            </button>
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
            <h1>Purchase Return</h1>
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

        <div class="form-page-no-card">
          @if (createError) {
            <div class="alert alert-error" style="margin-bottom: 16px;">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ createError }}</span>
            </div>
          }

          <!-- TOP SECTION: VENDOR & METADATA (MAX 4 FIELDS) -->
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Vendor (Sundry Creditor)</label>
              <zeno-searchable-select
                [options]="vendors"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="-- Select Vendor --"
                [(ngModel)]="returnForm.vendorLedgerId"
                (selectChange)="onVendorChange()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Return Date</label>
              <input type="date" [(ngModel)]="returnForm.returnDate" required />
            </div>

            <div class="form-group">
              <label class="required">Dispatch Godown (Warehouse)</label>
              <select [(ngModel)]="returnForm.godownId" required>
                @for (g of tenant.godowns(); track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Main' }})</option>
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

          <!-- LINE ITEMS EDITOR -->
          <div class="line-items-section">
            <zeno-item-fast-entry
              [itemsList]="itemsList"
              [showDiscount]="false"
              [showGst]="false"
              [editData]="editingItemData"
              (itemAdded)="onFastItemAdded($event)"
              (itemUpdated)="onFastItemUpdated($event)"
            ></zeno-item-fast-entry>

            <div class="table-responsive">
              <table class="zeno-table line-table">
                <thead>
                  <tr>
                    <th style="width: 36px;" class="text-center">#</th>
                    <th style="min-width: 200px;">Item / Product</th>
                    <th style="width: 80px;" class="text-center">Return Qty</th>
                    <th style="width: 75px;" class="text-center">Unit</th>
                    <th style="width: 110px;" class="text-right">Rate (₹)</th>
                    <th style="width: 85px;" class="text-center">GST %</th>
                    <th style="width: 120px;" class="text-right">Total Debit (₹)</th>
                    <th style="width: 70px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (returnForm.items.length === 0 || (returnForm.items.length === 1 && !returnForm.items[0].itemId)) {
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added to return. Use the Fast Item Entry Bar above to add items.
                      </td>
                    </tr>
                  } @else {
                    @for (line of returnForm.items; track $index) {
                      @if (line.itemId) {
                        <tr>
                          <td class="excel-row-num text-center">{{ $index + 1 }}</td>
                          <td>
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(line.itemId) }}</span>
                          </td>
                          <td class="text-center font-mono font-bold">
                            {{ line.returnedQty }}
                          </td>
                          <td class="text-center">
                            <span class="unit-badge">{{ line.unitCode || 'NOS' }}</span>
                          </td>
                          <td class="text-right font-mono">
                            ₹{{ line.rate | number:'1.2-2' }}
                          </td>
                          <td class="text-center font-mono">
                            {{ line.gstRate }}%
                          </td>
                          <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                            ₹{{ line.totalAmount | number:'1.2-2' }}
                          </td>
                          <td class="text-center">
                            <button type="button" class="btn-icon text-primary" (click)="editItemRow($index)" title="Edit line item">
                              <i class="pi pi-pencil"></i>
                            </button>
                            <button type="button" class="btn-icon text-danger" (click)="removeLine($index)" title="Delete line item">
                              <i class="pi pi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY & TOTALS FOOTER SECTION -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Remarks / Narration</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter return remarks or reason..."
                [(ngModel)]="returnForm.remarks"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line">
                <span>Taxable Return Value:</span>
                <strong>₹{{ returnSubtotal | number:'1.2-2' }}</strong>
              </div>
              <div class="summary-line">
                <span>Reversed GST Tax:</span>
                <span>₹{{ returnTaxTotal | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line grand-total">
                <span>Total Debit Note Amount:</span>
                <strong>₹{{ returnGrandTotal | number:'1.2-2' }}</strong>
              </div>
            </div>
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
                <div><strong>Reason / Remarks: </strong>{{ viewingReturn.reason || 'Goods Return' }}</div>
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
    .add-line-btn {
      background: #ffffff;
      border: 1px dashed #818cf8;
      color: #4338ca;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        background: #eef2ff;
        border-color: #4f46e5;
      }
    }
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
    .line-items-section {
      margin: 20px 0;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 20px;
      background: var(--surface-0);
      box-shadow: var(--shadow-subtle);

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9375rem;
        font-weight: 700;
        margin-bottom: 14px;
      }

      .table-responsive {
        overflow-x: auto;
        border: 1px solid var(--surface-200);
        border-radius: var(--radius-sm);
        background: #ffffff;
      }

      .line-table {
        background: #ffffff;
        width: 100%;
        border-collapse: collapse;

        th {
          background-color: var(--surface-50);
          color: var(--surface-600);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 11px 14px;
          border-bottom: 1px solid var(--surface-200);
        }

        td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--surface-100);
          vertical-align: middle;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background-color: rgba(248, 250, 252, 0.7);
        }

        .unit-badge {
          display: inline-block;
          padding: 3px 8px;
          background: var(--surface-100);
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--surface-700);
        }
      }
    }
    .totals-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
    .remarks-panel {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--surface-700);
      }

      textarea {
        width: 100%;
        min-height: 105px;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        padding: 10px 12px;
        font-size: 0.875rem;
        font-family: inherit;
        color: var(--surface-900);
        background: #ffffff;
        resize: vertical;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &:focus {
          border-color: var(--primary-600);
          box-shadow: 0 0 0 2px var(--primary-100);
        }
      }
    }
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
  selectedVendor = '';

  submitting = false;
  createError = '';
  viewingReturn: any = null;

  returnForm: any = {
    returnDate: new Date().toISOString().split('T')[0],
    vendorLedgerId: '',
    purchaseInvoiceId: '',
    godownId: '',
    reason: 'Damaged Goods / Packaging Defect',
    remarks: '',
    items: [],
  };

  returnSubtotal = 0;
  returnTaxTotal = 0;
  returnGrandTotal = 0;

  get filteredReturns(): any[] {
    let list = this.returns || [];
    if (this.selectedVendor) {
      list = list.filter((r) => r.vendorLedgerId === this.selectedVendor);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.voucherNo?.toLowerCase().includes(q) ||
          r.vendorLedger?.name?.toLowerCase().includes(q) ||
          r.purchaseInvoice?.voucherNo?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q),
      );
    }
    return list;
  }

  exportReturns() {
    const list = this.filteredReturns;
    if (!list || list.length === 0) return;
    const headers = ['Debit Note No', 'Return Date', 'Vendor', 'Against Invoice', 'Godown', 'Reason', 'Taxable', 'Tax Reversed', 'Grand Total'];
    const rows = list.map((pr) => [
      pr.voucherNo || '',
      pr.returnDate || '',
      pr.vendorLedger?.name || '',
      pr.purchaseInvoice?.voucherNo || 'Direct Return',
      pr.godown?.name || '',
      pr.reason || '',
      pr.taxableTotal || 0,
      pr.taxTotal || 0,
      pr.grandTotal || 0
    ]);
    exportToCsv('Purchase_Returns_Debit_Notes', headers, rows);
    this.toast.success('Purchase returns exported successfully!', 'Export Complete');
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
    private toast: ToastService,
    private route: ActivatedRoute,
  ) { }

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
      remarks: '',
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

  editingItemData: { item: any, index: number } | null = null;

  onFastItemAdded(itemData: any) {
    if (this.returnForm.items.length === 1 && !this.returnForm.items[0].itemId) {
      this.returnForm.items = [];
    }
    const line = {
      itemId: itemData.itemId,
      unitId: itemData.itemObj?.unitId || '',
      unitCode: itemData.unit || 'NOS',
      returnedQty: itemData.qty,
      rate: itemData.rate,
      gstRate: itemData.gstRate,
      totalAmount: itemData.amount
    };
    this.returnForm.items.push(line);
    this.calculateLine(line);
  }

  editItemRow(index: number) {
    const row = this.returnForm.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.returnedQty,
          rate: row.rate,
          discount: 0,
          gstRate: row.gstRate
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      const line = this.returnForm.items[idx];
      if (line) {
        line.itemId = itemData.itemId;
        line.unitId = itemData.itemObj?.unitId || line.unitId || '';
        line.unitCode = itemData.unit || line.unitCode || 'NOS';
        line.returnedQty = itemData.qty;
        line.rate = itemData.rate;
        line.gstRate = itemData.gstRate;
        this.calculateLine(line);
      }
      this.editingItemData = null;
    }
  }

  removeLine(index: number) {
    if (this.editingItemData?.index === index) {
      this.editingItemData = null;
    }
    this.returnForm.items.splice(index, 1);
    this.recalculateTotals();
  }

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.itemsList.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
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
    const reasonText = this.returnForm.remarks?.trim()
      ? (this.returnForm.reason
          ? `${this.returnForm.reason} - ${this.returnForm.remarks.trim()}`
          : this.returnForm.remarks.trim())
      : (this.returnForm.reason || 'Goods Return');

    const payload = {
      companyId: compId,
      branchId,
      godownId: this.returnForm.godownId,
      vendorLedgerId: this.returnForm.vendorLedgerId,
      purchaseInvoiceId: this.returnForm.purchaseInvoiceId || null,
      returnDate: this.returnForm.returnDate,
      reason: reasonText,
      remarks: this.returnForm.remarks?.trim() || null,
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
      next: (pr: any) => {
        this.submitting = false;
        this.toast.success(
          `Purchase Return / Debit Note ${pr?.voucherNo || ''} recorded successfully! Total: ₹${Number(this.returnGrandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Debit Note Created',
        );
        this.viewMode = 'list';
        this.loadReturns();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to create purchase return';
        this.toast.error(this.createError, 'Return Failed');
      },
    });
  }

  viewReturn(pr: any) {
    this.viewingReturn = pr;
    this.viewMode = 'view';
  }
}
