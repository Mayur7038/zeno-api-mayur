import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER BAR -->
        <div class="page-header">
          <h1>Purchase Orders</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Purchase Order
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <!-- TOOLBAR & TABLE CARD -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="loadOrders()"
                placeholder="Search purchase orders..."
              />
            </div>

            <div class="toolbar-filters">
              <select
                class="form-select"
                [(ngModel)]="selectedStatus"
                (change)="filterStatus(selectedStatus)"
              >
                <option value="">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_CLEARED">Partially Cleared</option>
                <option value="CLEARED">Cleared</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button class="btn-export" (click)="exportOrders()" [disabled]="orders.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Order Date</th>
                <th>Vendor</th>
                <th>Branch</th>
                <th>Taxable</th>
                <th>Tax (GST)</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (orders.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No purchase orders found matching your filters.
                  </td>
                </tr>
              }
              @for (po of orders; track po.id) {
                <tr (click)="viewOrder(po.id)" style="cursor: pointer;">
                  <td class="font-mono font-bold" style="color: var(--primary-700)">{{ po.voucherNo }}</td>
                  <td>{{ po.orderDate }}</td>
                  <td class="font-bold">{{ po.vendorLedger?.name }}</td>
                  <td>{{ po.branch?.branchName }}</td>
                  <td class="font-mono">₹{{ po.subtotal }}</td>
                  <td class="font-mono">₹{{ po.taxTotal }}</td>
                  <td class="font-mono font-bold">₹{{ po.grandTotal }}</td>
                  <td>
                    <span class="badge-pill" [ngClass]="{
                      'badge-pending': po.status === 'PENDING',
                      'badge-partial': po.status === 'PARTIALLY_CLEARED',
                      'badge-cleared': po.status === 'CLEARED',
                      'badge-cancelled': po.status === 'CANCELLED'
                    }">
                      @if (po.status === 'CLEARED') {
                        <i class="pi pi-check-circle" style="font-size: 0.75rem;"></i>
                      }
                      {{ po.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons" (click)="$event.stopPropagation()">
                      <button class="btn-view-pill" title="View Order Details & Status" (click)="viewOrder(po.id)">
                        <i class="pi pi-eye"></i> View
                      </button>
                      <button class="action-btn" title="Print PO Voucher" (click)="viewOrder(po.id)">
                        <i class="pi pi-print"></i>
                      </button>
                      @if (po.status === 'PENDING') {
                        <button class="action-btn" title="Edit Order" (click)="editOrder(po.id)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button class="action-btn btn-danger-action" title="Cancel Order" (click)="cancelOrder(po.id)">
                          <i class="pi pi-times"></i>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE PO FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>New Purchase Order</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitCreatePO()" [disabled]="submitting || !isValidOrder()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Generating Order...
              } @else {
                <i class="pi pi-check"></i> Save Purchase Order
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
              <label class="required">Order Date</label>
              <input type="date" [(ngModel)]="form.orderDate" name="orderDate" required />
            </div>

            <div class="form-group">
              <label class="required">Vendor (Sundry Creditor)</label>
              <zeno-searchable-select
                [options]="vendors"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Search Vendor (Name or GSTIN)..."
                [(ngModel)]="form.vendorLedgerId"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Branch</label>
              <select [(ngModel)]="form.branchId" name="branchId" required>
                @for (b of tenant.branches(); track b.id) {
                  <option [value]="b.id">{{ b.branchName }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Expected Delivery Date</label>
              <input type="date" [(ngModel)]="form.expectedDeliveryDate" name="expectedDeliveryDate" />
            </div>
          </div>

          <!-- LINE ITEMS SECTION -->
          <div class="line-items-section">
            <div class="section-title-wrap">
              <div class="section-title">
                <i class="pi pi-receipt"></i> Order Line Items
              </div>
              <button class="add-line-btn" type="button" (click)="addItemRow()">
                <i class="pi pi-plus"></i> Add Blank Line
              </button>
            </div>

            <!-- FAST ITEM ENTRY BAR -->
            <zeno-item-fast-entry
              [itemsList]="itemsList"
              [showDiscount]="true"
              [showGst]="false"
              [isPurchase]="true"
              [editData]="editingItemData"
              (itemAdded)="onFastItemAdded($event)"
              (itemUpdated)="onFastItemUpdated($event)"
            ></zeno-item-fast-entry>

            <div class="table-responsive">
              <table class="zeno-table line-table">
                <thead>
                  <tr>
                    <th style="width: 36px;" class="text-center">#</th>
                    <th style="min-width: 200px;">Product / Item</th>
                    <th style="width: 80px;" class="text-center">Qty</th>
                    <th style="width: 75px;" class="text-center">Unit</th>
                    <th style="width: 110px;">Rate (₹)</th>
                    <th style="width: 100px;">Discount (₹)</th>
                    <th style="width: 85px;">GST %</th>
                    <th class="text-right" style="width: 120px;">Amount (₹)</th>
                    <th class="text-center" style="width: 70px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (form.items.length === 0) {
                    <tr>
                      <td colspan="9" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added yet. Use the Fast Item Entry Bar above to add items to this purchase order.
                      </td>
                    </tr>
                  } @else {
                    @for (row of form.items; track $index; let i = $index) {
                      <tr>
                        <td class="excel-row-num text-center">{{ i + 1 }}</td>
                        <td>
                          @if (row.itemId) {
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(row.itemId) }}</span>
                          } @else {
                            <zeno-searchable-select
                              [options]="itemsList"
                              labelKey="name"
                              valueKey="id"
                              secondaryKey="sku"
                              placeholder="Select Product..."
                              [(ngModel)]="row.itemId"
                              (selectChange)="onItemSelect(row)"
                            ></zeno-searchable-select>
                          }
                        </td>
                        <td class="text-center">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">{{ row.orderedQty }}</span>
                          } @else {
                            <input
                              type="number"
                              min="1"
                              [(ngModel)]="row.orderedQty"
                              (input)="recalculateTotals()"
                              class="text-center"
                            />
                          }
                        </td>
                        <td class="text-center">
                          <span class="unit-badge">{{ getUnitCode(row) }}</span>
                        </td>
                        <td class="text-right">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">₹{{ row.rate | number:'1.2-2' }}</span>
                          } @else {
                            <input
                              type="number"
                              step="any"
                              [(ngModel)]="row.rate"
                              (input)="recalculateTotals()"
                            />
                          }
                        </td>
                        <td class="text-right">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">₹{{ (row.discount || 0) | number:'1.2-2' }}</span>
                          } @else {
                            <input
                              type="number"
                              step="any"
                              [(ngModel)]="row.discount"
                              (input)="recalculateTotals()"
                            />
                          }
                        </td>
                        <td class="text-center">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">{{ row.gstRate }}%</span>
                          } @else {
                            <select [(ngModel)]="row.gstRate" (change)="recalculateTotals()">
                              <option [value]="0">0%</option>
                              <option [value]="5">5%</option>
                              <option [value]="12">12%</option>
                              <option [value]="18">18%</option>
                              <option [value]="28">28%</option>
                            </select>
                          }
                        </td>
                        <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                          ₹{{ (Math.max(0, (row.orderedQty * row.rate) - (row.discount || 0))) | number:'1.2-2' }}
                        </td>
                        <td class="text-center">
                          <button type="button" class="btn-icon text-primary" (click)="editItemRow(i)" title="Edit line item">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button type="button" class="btn-icon text-danger" (click)="removeLine(i)" title="Delete line item">
                            <i class="pi pi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY & TOTALS FOOTER SECTION -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Narration / Remarks</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter transaction narration or purchase order notes..."
                [(ngModel)]="form.notes"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line">
                <span>Taxable Subtotal:</span>
                <strong>₹{{ orderSubtotal | number:'1.2-2' }}</strong>
              </div>
              <div class="summary-line">
                <span>GST Total:</span>
                <span>₹{{ orderTaxTotal | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line grand-total">
                <span>Grand Total:</span>
                <strong>₹{{ orderGrandTotal | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && viewingPo) {
        <!-- VIEW / PRINT PO FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Purchase Order: {{ viewingPo.voucherNo }}</h1>
            <span class="badge-pill" [ngClass]="{
              'badge-pending': viewingPo.status === 'PENDING',
              'badge-partial': viewingPo.status === 'PARTIALLY_CLEARED',
              'badge-cleared': viewingPo.status === 'CLEARED',
              'badge-cancelled': viewingPo.status === 'CANCELLED'
            }">
              @if (viewingPo.status === 'CLEARED') {
                <i class="pi pi-check-circle"></i>
              }
              {{ viewingPo.status }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to Orders</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Voucher
            </button>
          </div>
        </div>

        <div class="zeno-card">
          <div class="invoice-box">
            <!-- STATUS FULFILLMENT BANNER -->
            @if (viewingPo.status === 'CLEARED') {
              <div class="fulfillment-banner banner-cleared">
                <i class="pi pi-check-circle banner-icon"></i>
                <div>
                  <strong>Order 100% Cleared &amp; Fulfilled:</strong>
                  All ordered items under this purchase order have been fully received into warehouse inventory via Goods Receipt Note (GRN).
                </div>
              </div>
            } @else if (viewingPo.status === 'PARTIALLY_CLEARED') {
              <div class="fulfillment-banner banner-partial">
                <i class="pi pi-hourglass banner-icon"></i>
                <div>
                  <strong>Partially Cleared:</strong>
                  Some quantities have been received into inventory. Remaining quantities are awaiting subsequent GRN receipts.
                </div>
              </div>
            } @else if (viewingPo.status === 'PENDING') {
              <div class="fulfillment-banner banner-pending">
                <i class="pi pi-clock banner-icon"></i>
                <div>
                  <strong>Pending Fulfillment:</strong>
                  Purchase Order issued to vendor. No items have been received into warehouse stock yet.
                </div>
              </div>
            }

            <div class="invoice-header">
              <div>
                <h2 style="color: var(--primary-700); margin-bottom: 6px;">PURCHASE ORDER</h2>
                <div class="font-mono"><strong>PO Voucher #: </strong>{{ viewingPo.voucherNo }}</div>
                <div><strong>Order Date: </strong>{{ viewingPo.orderDate }}</div>
                <div><strong>Branch: </strong>{{ viewingPo.branch?.branchName }}</div>
              </div>
              <div style="text-align: right;">
                <h3 style="margin-bottom: 4px;">{{ tenant.currentCompany()?.legalName }}</h3>
                <div>{{ tenant.currentCompany()?.tradeName }}</div>
                <div>GSTIN: <span class="font-mono">{{ tenant.currentCompany()?.gstin || 'N/A' }}</span></div>
                <div>State: Maharashtra (27)</div>
              </div>
            </div>

            <div class="vendor-box">
              <div class="vendor-grid">
                <div>
                  <span class="label-muted">Vendor / Supplier</span>
                  <div class="font-bold" style="font-size: 1.05rem;">{{ viewingPo.vendorLedger?.name }}</div>
                  <div>GSTIN: <span class="font-mono">{{ viewingPo.vendorLedger?.gstin || 'Unregistered' }}</span></div>
                </div>
                <div style="text-align: right;">
                  <span class="label-muted">Place of Supply</span>
                  <div>State Code: <span class="font-mono">{{ viewingPo.vendorLedger?.stateCode || '27' }}</span></div>
                  <div>Fulfillment: <strong>{{ viewingPo.status }}</strong></div>
                </div>
              </div>
            </div>

            <!-- FULFILLMENT LINE ITEMS TABLE -->
            <div style="font-weight: 700; font-size: 0.9375rem; color: var(--surface-800); margin-top: 8px;">
              Ordered Line Items &amp; Delivery Tracking
            </div>
            <table class="zeno-table print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th class="text-right">Ordered</th>
                  <th class="text-right">Received</th>
                  <th class="text-right">Pending</th>
                  <th>Unit</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">GST %</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (it of viewingPo.items; track it.id; let idx = $index) {
                  <tr>
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="font-bold">{{ it.item?.name }}</div>
                      <div class="font-xs" style="color: var(--surface-500)">SKU: {{ it.item?.sku || 'N/A' }}</div>
                    </td>
                    <td class="text-right font-mono font-bold">{{ it.orderedQty }}</td>
                    <td class="text-right font-mono font-bold text-emerald">
                      {{ it.receivedQty || 0 }}
                    </td>
                    <td class="text-right font-mono font-bold">
                      @if ((it.orderedQty - (it.receivedQty || 0)) <= 0) {
                        <span class="text-emerald"><i class="pi pi-check"></i> 0 (Cleared)</span>
                      } @else {
                        <span class="text-amber">{{ it.orderedQty - (it.receivedQty || 0) }}</span>
                      }
                    </td>
                    <td>{{ it.unit?.code }}</td>
                    <td class="text-right font-mono">₹{{ it.rate }}</td>
                    <td class="text-right font-mono">{{ it.gstRate }}%</td>
                    <td class="text-right font-mono font-bold">₹{{ it.totalAmount }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="print-totals">
              <div><strong>Taxable Subtotal: </strong>₹{{ viewingPo.subtotal }}</div>
              <div><strong>Tax Total (GST): </strong>₹{{ viewingPo.taxTotal }}</div>
              <div class="print-grand"><strong>Grand Total: </strong>₹{{ viewingPo.grandTotal }}</div>
            </div>

            @if (viewingPo.notes) {
              <div class="order-notes-box">
                <strong>Notes &amp; Instructions:</strong>
                <p>{{ viewingPo.notes }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .p2p-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: var(--surface-900);
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .header-back-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

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

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }
    }

    .form-page-card {
      padding: 24px;
    }
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

    .filter-card {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .filter-group {
      position: relative;
      flex: 1;
      max-width: 360px;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--surface-400);
      }

      input {
        width: 100%;
        padding: 8px 12px 8px 36px;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;

        &:focus {
          border-color: var(--primary-600);
          outline: none;
        }
      }
    }

    .status-tabs {
      display: flex;
      gap: 4px;
      background: var(--surface-100);
      padding: 4px;
      border-radius: var(--radius-sm);

      button {
        background: transparent;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--surface-600);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          color: var(--surface-900);
        }

        &.active {
          background: #ffffff;
          color: var(--primary-700);
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-pending {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .badge-partial {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-cleared {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-cancelled {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .btn-view-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--primary-100);
        color: var(--primary-800);
      }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;

      .action-btn {
        width: 32px;
        height: 32px;
        border: 1px solid var(--surface-200);
        background: var(--surface-0);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--surface-600);

        &:hover { background: var(--surface-100); color: var(--surface-900); }
        &.btn-danger-action:hover { background: var(--danger-bg); color: var(--danger); }
      }
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .line-items-section {
      margin: 20px 0;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 16px;
      background: var(--surface-0);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: var(--shadow-subtle);

      .section-title {
        font-size: 0.9375rem;
        font-weight: 700;
        margin-bottom: 14px;
        color: var(--surface-900);
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

      .remove-line-btn {
        background: none;
        border: none;
        color: var(--danger);
        cursor: pointer;
      }
    }

    .totals-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;

      .totals-panel {
        background: var(--surface-50);
        border: 1px solid var(--surface-200);
        border-radius: var(--radius-sm);
        padding: 16px;

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 0.875rem;

          &.grand-total {
            border-top: 2px solid var(--surface-300);
            margin-top: 8px;
            padding-top: 10px;
            font-size: 1.125rem;
            font-weight: 700;
            color: var(--primary-700);
          }
        }
      }
    }

    .invoice-box {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid var(--surface-200);
      padding-bottom: 16px;
    }

    .vendor-box {
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .print-table {
      margin-top: 8px;
    }

    .print-totals {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      margin-top: 16px;
      font-size: 0.9375rem;

      .print-grand {
        font-size: 1.25rem;
        color: var(--primary-700);
        border-top: 2px solid var(--surface-300);
        padding-top: 6px;
      }
    }

    /* Fulfillment Banners */
    .fulfillment-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      line-height: 1.4;

      .banner-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      &.banner-cleared {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;

        .banner-icon {
          color: #059669;
        }
      }

      &.banner-partial {
        background: #fffbeb;
        border: 1px solid #fde68a;
        color: #92400e;

        .banner-icon {
          color: #d97706;
        }
      }

      &.banner-pending {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1e40af;

        .banner-icon {
          color: #2563eb;
        }
      }
    }

    .vendor-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .label-muted {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-500);
      margin-bottom: 2px;
    }

    .order-notes-box {
      margin-top: 14px;
      padding: 10px 14px;
      background: var(--surface-50);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--surface-400);
      font-size: 0.8125rem;
      color: var(--surface-700);

      strong {
        display: block;
        margin-bottom: 2px;
      }
    }

    .text-emerald {
      color: #059669 !important;
    }

    .text-amber {
      color: #d97706 !important;
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
  `],
})
export class PurchaseOrdersComponent implements OnInit {
  Math = Math;
  viewMode: 'list' | 'create' | 'view' = 'list';
  orders: any[] = [];
  vendors: any[] = [];
  itemsList: any[] = [];
  selectedStatus = '';
  searchQuery = '';

  submitting = false;
  createError = '';
  viewingPo: any = null;

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'PENDING' || o.status === 'PARTIALLY_CLEARED').length;
  }

  get clearedCount(): number {
    return this.orders.filter(o => o.status === 'CLEARED').length;
  }

  get totalPoValue(): number {
    return this.orders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  }

  form: any = {
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    paymentTerms: 'Net 30 Days',
    vendorLedgerId: '',
    branchId: '',
    notes: '',
    items: [],
  };

  orderSubtotal = 0;
  orderTaxTotal = 0;
  orderGrandTotal = 0;

  constructor(
    private p2p: P2pService,
    public tenant: TenantService,
    private masters: MastersService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadOrders();
        this.loadMasters();
      },
    });
  }

  loadOrders() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.p2p.getPurchaseOrders(compId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => (this.orders = res),
    });
  }

  loadMasters() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    this.masters.getLedgers(compId, true).subscribe({
      next: (v) => (this.vendors = v),
    });

    this.masters.getItems(compId).subscribe({
      next: (it) => (this.itemsList = it),
    });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadOrders();
  }

  openCreateModal() {
    this.form = {
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      paymentTerms: 'Net 30 Days',
      vendorLedgerId: '',
      branchId: this.tenant.currentBranch()?.id || '',
      notes: '',
      items: [],
    };
    this.recalculateTotals();
    this.createError = '';
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.viewingPo = null;
    this.createError = '';
    this.loadOrders();
  }

  addItemRow() {
    this.form.items.push({
      itemId: '',
      unitId: '',
      unitCode: 'NOS',
      orderedQty: 1,
      rate: 0,
      discount: 0,
      gstRate: 18,
      totalAmount: 0,
    });
  }

  editingItemData: { item: any, index: number } | null = null;

  onFastItemAdded(itemData: any) {
    const item = this.itemsList.find(i => i.id === itemData.itemId);
    const uVal = item?.unitCode || item?.unit;
    const uStr = typeof uVal === 'object' ? (uVal.code || uVal.name || 'NOS') : (uVal || 'NOS');

    let emptyRow = this.form.items.find((r: any) => !r.itemId);
    if (emptyRow) {
      emptyRow.itemId = itemData.itemId;
      emptyRow.unitId = itemData.itemObj?.unitId || item?.unitId || '';
      emptyRow.unitCode = uStr;
      emptyRow.orderedQty = itemData.qty;
      emptyRow.rate = itemData.rate;
      emptyRow.discount = itemData.discount || 0;
      emptyRow.gstRate = itemData.gstRate;
    } else {
      this.form.items.push({
        itemId: itemData.itemId,
        unitId: itemData.itemObj?.unitId || item?.unitId || '',
        unitCode: uStr,
        orderedQty: itemData.qty,
        rate: itemData.rate,
        discount: itemData.discount || 0,
        gstRate: itemData.gstRate,
        totalAmount: itemData.amount
      });
    }
    this.recalculateTotals();
  }

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.itemsList.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
  }

  getUnitCode(row: any): string {
    if (row.unitCode) return row.unitCode;
    if (row.itemId) {
      const it = this.itemsList.find(i => i.id === row.itemId);
      const uVal = it?.unitCode || it?.unit;
      return typeof uVal === 'object' ? (uVal.code || uVal.name || 'NOS') : (uVal || 'NOS');
    }
    return 'NOS';
  }

  isValidOrder(): boolean {
    return !!this.form.vendorLedgerId && this.form.items.some((i: any) => i.itemId && i.orderedQty > 0);
  }

  editItemRow(index: number) {
    const row = this.form.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.orderedQty,
          rate: row.rate,
          discount: row.discount || 0,
          gstRate: row.gstRate
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      const line = this.form.items[idx];
      if (line) {
        line.itemId = itemData.itemId;
        line.unitId = itemData.itemObj?.unitId || line.unitId || '';
        line.unitCode = itemData.unit || line.unitCode || 'NOS';
        line.orderedQty = itemData.qty;
        line.rate = itemData.rate;
        line.discount = itemData.discount || 0;
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
    this.form.items.splice(index, 1);
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
    const qty = Number(line.orderedQty || 0);
    const rate = Number(line.rate || 0);
    const discount = Number(line.discount || 0);
    const gstRate = Number(line.gstRate || 0);

    const taxable = Math.max(0, qty * rate - discount);
    const tax = (taxable * gstRate) / 100;
    line.totalAmount = Number((taxable + tax).toFixed(2));
    this.recalculateTotals();
  }

  recalculateTotals() {
    let sub = 0;
    let tax = 0;
    for (const l of this.form.items) {
      const q = Number(l.orderedQty || 0);
      const r = Number(l.rate || 0);
      const d = Number(l.discount || 0);
      const g = Number(l.gstRate || 0);
      const taxable = Math.max(0, q * r - d);
      sub += taxable;
      tax += (taxable * g) / 100;
    }
    this.orderSubtotal = sub;
    this.orderTaxTotal = tax;
    this.orderGrandTotal = sub + tax;
  }

  submitCreatePO() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.form.branchId || this.tenant.currentBranch()?.id;

    if (!this.form.vendorLedgerId) {
      this.createError = 'Please select a vendor';
      return;
    }

    this.submitting = true;
    this.createError = '';

    const payload = {
      companyId: compId,
      branchId,
      vendorLedgerId: this.form.vendorLedgerId,
      orderDate: this.form.orderDate,
      notes: this.form.notes,
      items: this.form.items.map((i: any) => ({
        itemId: i.itemId,
        unitId: i.unitId,
        orderedQty: i.orderedQty,
        rate: i.rate,
        gstRate: i.gstRate,
        isInterstate: false,
      })),
    };

    this.p2p.createPurchaseOrder(payload).subscribe({
      next: (po: any) => {
        this.submitting = false;
        this.toast.success(
          `Purchase Order ${po?.voucherNo || ''} created successfully! Total: ₹${Number(this.orderGrandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'PO Generated',
        );
        this.viewMode = 'list';
        this.loadOrders();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to create PO';
        this.toast.error(this.createError, 'Creation Failed');
      },
    });
  }

  cancelOrder(id: string) {
    if (!confirm('Are you sure you want to cancel this purchase order?')) return;
    this.p2p.cancelPurchaseOrder(id).subscribe({
      next: () => {
        this.toast.success('Purchase Order cancelled successfully.', 'PO Cancelled');
        this.loadOrders();
      },
      error: (err) => {
        const msg = err.error?.message || 'Cannot cancel PO';
        this.toast.error(msg, 'Cancellation Failed');
        alert(msg);
      },
    });
  }

  viewOrder(id: string) {
    this.p2p.getPurchaseOrderById(id).subscribe({
      next: (po) => {
        this.viewingPo = po;
        this.viewMode = 'view';
      },
    });
  }

  editOrder(id: string) {
    this.p2p.getPurchaseOrderById(id).subscribe({
      next: (po) => {
        if (!po) return;
        this.viewingPo = po;
        this.form = {
          vendorId: po.vendorId,
          orderDate: po.orderDate,
          expectedDeliveryDate: po.expectedDeliveryDate || '',
          paymentTerms: po.paymentTerms || 'Net 30 Days',
          shippingAddress: po.shippingAddress || '',
          notes: po.notes || '',
          items: (po.items || []).map((it: any) => ({
            itemId: it.itemId,
            orderedQty: it.orderedQty || it.qty || 1,
            unitPrice: it.rate || it.unitPrice || 0,
            discountAmount: it.discountAmount || 0,
            taxRate: it.taxRate || 18,
            unitCode: it.unitCode || 'Pcs'
          }))
        };
        this.viewMode = 'create';
      },
    });
  }

  exportOrders() {
    if (!this.orders || this.orders.length === 0) return;
    const headers = ['Voucher No', 'Order Date', 'Vendor', 'Items Count', 'Subtotal', 'Tax Total', 'Grand Total', 'Status'];
    const rows = this.orders.map((o) => [
      o.voucherNo || '',
      o.orderDate || '',
      o.vendorLedger?.name || '',
      o.items?.length || 0,
      o.taxableAmount || o.subtotal || 0,
      o.taxTotal || 0,
      o.grandTotal || 0,
      o.status || '',
    ]);
    exportToCsv('Purchase_Orders', headers, rows);
    this.toast.success('Purchase orders exported successfully!', 'Export Complete');
  }
}
