import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Sales Orders</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Sales Order
            </button>
          </div>
        </div>

        <!-- FILTER & TOOLBAR -->
        <div class="zeno-card">
          <div class="filter-card">
            <div class="filter-group">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="loadOrders()"
              />
            </div>

            <div class="filter-actions">
              <select
                class="filter-select"
                [(ngModel)]="selectedStatus"
                (change)="filterStatus(selectedStatus)"
              >
                <option value="">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_DISPATCHED">Part-Dispatched</option>
                <option value="CLEARED">Cleared</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button class="btn-export" (click)="exportOrders()" [disabled]="orders.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <!-- ORDERS TABLE -->
          <div class="table-responsive">
            <table class="zeno-table">
              <thead>
              <tr>
                <th>Voucher No</th>
                <th>Order Date</th>
                <th>Customer</th>
                <th>Delivery Due</th>
                <th>Taxable</th>
                <th>Tax Total</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    <i class="pi pi-spin pi-spinner"></i> Loading sales orders...
                  </td>
                </tr>
              } @else if (orders.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    No sales orders found matching your criteria.
                  </td>
                </tr>
              } @else {
                @for (so of orders; track so.id) {
                  <tr (click)="viewOrder(so.id)" style="cursor: pointer;">
                    <td class="font-bold" style="color: var(--primary-700)">{{ so.voucherNo }}</td>
                    <td>{{ so.orderDate }}</td>
                    <td>
                      <div class="font-bold">{{ so.customerLedger?.name }}</div>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ so.customerLedger?.gstin || 'Unregistered' }}</div>
                    </td>
                    <td>{{ so.deliveryDueDate || '-' }}</td>
                    <td>₹{{ so.taxableTotal | number:'1.2-2' }}</td>
                    <td>₹{{ (Number(so.cgstTotal || 0) + Number(so.sgstTotal || 0) + Number(so.igstTotal || 0)) | number:'1.2-2' }}</td>
                    <td class="font-bold">₹{{ so.grandTotal | number:'1.2-2' }}</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(so.status)">{{ formatStatus(so.status) }}</span>
                    </td>
                    <td class="text-right" (click)="$event.stopPropagation()">
                      <button class="btn-icon" title="View Details" (click)="viewOrder(so.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                      @if (so.status === 'PENDING' || so.status === 'PARTIALLY_DISPATCHED') {
                        <button class="btn-icon text-primary" title="Edit Order" (click)="editOrder(so.id)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button class="btn-icon text-danger" title="Cancel Order" (click)="cancelOrder(so.id)">
                          <i class="pi pi-times-circle"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE SALES ORDER FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>New Sales Order</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitOrder()" [disabled]="submitting || !isValidOrder()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Generating Order...
              } @else {
                <i class="pi pi-check"></i> Save Sales Order
              }
            </button>
          </div>
        </div>

        <div class="form-page-no-card">
          <!-- TOP SECTION: CUSTOMER & METADATA -->
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer / Debtor</label>
              <zeno-searchable-select
                [options]="customers"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Search Customer (Name or GSTIN)..."
                [(ngModel)]="newOrder.customerLedgerId"
                (selectChange)="onCustomerSelected()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Order Date</label>
              <input type="date" [(ngModel)]="newOrder.orderDate" />
            </div>

            <div class="form-group">
              <label>Delivery Due Date</label>
              <input type="date" [(ngModel)]="newOrder.deliveryDueDate" />
            </div>

            <div class="form-group">
              <label>Payment Terms</label>
              <select [(ngModel)]="newOrder.paymentTerms">
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>
          </div>

          <!-- LINE ITEMS TABLE -->
          <div class="line-items-section">
            <!-- FAST ITEM ENTRY BAR -->
            <zeno-item-fast-entry
              [itemsList]="items"
              [showDiscount]="true"
              [showGst]="true"
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
                  @if (newOrder.items.length === 0) {
                    <tr>
                      <td colspan="9" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added yet. Use the Fast Item Entry Bar above to add items to this order.
                      </td>
                    </tr>
                  } @else {
                    @for (row of newOrder.items; track $index; let i = $index) {
                      <tr>
                        <td class="excel-row-num">{{ i + 1 }}</td>
                        <td>
                          @if (row.itemId) {
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(row.itemId) }}</span>
                          } @else {
                            <zeno-searchable-select
                              [options]="items"
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
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">₹{{ row.unitPrice | number:'1.2-2' }}</span>
                          } @else {
                            <input
                              type="number"
                              step="any"
                              [(ngModel)]="row.unitPrice"
                              (input)="recalculateTotals()"
                            />
                          }
                        </td>
                        <td class="text-right">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">₹{{ row.discountAmount | number:'1.2-2' }}</span>
                          } @else {
                            <input
                              type="number"
                              step="any"
                              [(ngModel)]="row.discountAmount"
                              (input)="recalculateTotals()"
                            />
                          }
                        </td>
                        <td class="text-center">
                          @if (row.itemId) {
                            <span class="font-mono" style="padding: 2px 6px; display: inline-block;">{{ row.taxRate }}%</span>
                          } @else {
                            <select [(ngModel)]="row.taxRate" (change)="recalculateTotals()">
                              <option [value]="0">0%</option>
                              <option [value]="5">5%</option>
                              <option [value]="12">12%</option>
                              <option [value]="18">18%</option>
                              <option [value]="28">28%</option>
                            </select>
                          }
                        </td>
                        <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                          ₹{{ (Math.max(0, (row.orderedQty * row.unitPrice) - row.discountAmount)) | number:'1.2-2' }}
                        </td>
                        <td class="text-center">
                          <button type="button" class="btn-icon text-primary" (click)="editItemRow(i)" title="Edit line item">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button type="button" class="btn-icon text-danger" (click)="removeItemRow(i)" title="Delete line item">
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

          <!-- SUMMARY & TOTALS -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Narration / Remarks</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter transaction narration or order notes..."
                [(ngModel)]="newOrder.narration"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line">
                <span>Taxable Subtotal:</span>
                <strong>₹{{ modalTotals.taxableSubtotal | number:'1.2-2' }}</strong>
              </div>
              @if (modalTotals.igstTotal > 0) {
                <div class="summary-line">
                  <span>Integrated GST (IGST):</span>
                  <span>₹{{ modalTotals.igstTotal | number:'1.2-2' }}</span>
                </div>
              } @else {
                <div class="summary-line">
                  <span>Central GST (CGST):</span>
                  <span>₹{{ modalTotals.cgstTotal | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>State GST (SGST):</span>
                  <span>₹{{ modalTotals.sgstTotal | number:'1.2-2' }}</span>
                </div>
              }
              <div class="summary-line grand-total">
                <span>Grand Total:</span>
                <strong>₹{{ modalTotals.grandTotal | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedOrder) {
        <!-- VIEW SALES ORDER DETAIL FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Sales Order #{{ selectedOrder.voucherNo }}</h1>
            <span class="badge" [ngClass]="getStatusBadge(selectedOrder.status)">
              {{ formatStatus(selectedOrder.status) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            @if (selectedOrder.status === 'PENDING' || selectedOrder.status === 'PARTIALLY_DISPATCHED') {
              <button class="btn-secondary" (click)="editOrder(selectedOrder.id)">
                <i class="pi pi-pencil"></i> Edit Order
              </button>
              <button class="btn-danger" style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;" (click)="cancelOrder(selectedOrder.id)">
                <i class="pi pi-times-circle"></i> Cancel Order
              </button>
            }
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Voucher
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Customer</span>
              <strong>{{ selectedOrder.customerLedger?.name }}</strong>
              <p>{{ selectedOrder.customerLedger?.gstin ? 'GSTIN: ' + selectedOrder.customerLedger?.gstin : 'Unregistered Consumer' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Destination / Shipping</span>
              <p>{{ selectedOrder.shippingAddress || 'Primary customer site' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Order Date</span>
              <p>{{ selectedOrder.orderDate }}</p>
            </div>
            <div class="info-block">
              <span class="label">Payment Terms</span>
              <p>{{ selectedOrder.paymentTerms || 'Net 30 Days' }}</p>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: var(--surface-700)">Item Fulfillment Status</h4>
          <div class="table-responsive">
            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Ordered Qty</th>
                  <th>Dispatched Qty</th>
                  <th>Pending Qty</th>
                  <th>Unit Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of selectedOrder.items; track item.id) {
                  <tr>
                    <td>
                      <strong>{{ item.item?.name }}</strong>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ item.item?.sku }}</div>
                    </td>
                    <td>{{ item.orderedQty }} {{ item.unit?.code || 'NOS' }}</td>
                    <td>
                      <span class="text-success font-bold">{{ item.dispatchedQty }}</span>
                    </td>
                    <td>
                      <span [class.text-danger]="(item.orderedQty - item.dispatchedQty) > 0" class="font-bold">
                        {{ item.orderedQty - item.dispatchedQty }}
                      </span>
                    </td>
                    <td>₹{{ item.rate | number:'1.2-2' }}</td>
                    <td class="text-right font-bold">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="totals-summary-card" style="margin-top: 20px;">
            <div class="summary-line">
              <span>Taxable:</span>
              <strong>₹{{ selectedOrder.taxableTotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line">
              <span>Tax:</span>
              <span>₹{{ (Number(selectedOrder.cgstTotal || 0) + Number(selectedOrder.sgstTotal || 0) + Number(selectedOrder.igstTotal || 0)) | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total">
              <span>Grand Total:</span>
              <strong>₹{{ selectedOrder.grandTotal | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page { display: flex; flex-direction: column; gap: 20px; }
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
    .form-page-no-card { margin-bottom: 24px; }
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
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .zeno-card { background: #fff; border: 1px solid var(--surface-300); border-radius: var(--radius-md); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03); margin-bottom: 24px; }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--surface-300) !important;
      border-radius: var(--radius-md) !important;
      background: #ffffff;
    }

    .filter-card { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .filter-group { position: relative; width: 320px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); }
    .filter-group input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .status-tabs { display: flex; gap: 6px; background: var(--surface-100); padding: 4px; border-radius: 8px; }
    .status-tabs button { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; color: var(--surface-600); cursor: pointer; transition: all 0.2s; }
    .status-tabs button.active { background: #fff; color: var(--primary-700); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
    .badge-pending { background: #FEF3C7; color: #D97706; }
    .badge-part-dispatched { background: #E0E7FF; color: #4338CA; }
    .badge-cleared { background: #DCFCE7; color: #15803D; }
    .badge-cancelled { background: #FEE2E2; color: #B91C1C; }

    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600); color: var(--primary-600); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .line-items-section {
      margin: 24px 0;
      border: none;
      padding: 0;
      background: transparent;
      box-shadow: none;

      .section-title-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;

        .section-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--surface-900);
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .table-responsive {
        overflow-x: auto;
        border: 1px solid var(--surface-300) !important;
        border-radius: var(--radius-md) !important;
        background: #ffffff;
      }
    }

    .form-footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-top: 20px;
    }

    .narration-box {
      flex: 1;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .narration-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--surface-700);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .narration-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--surface-300);
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        background: #ffffff;
        min-height: 80px;

        &:focus {
          outline: none;
          border-color: var(--primary-600);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
      }
    }

    .totals-summary-card { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 8px; padding: 16px; width: 340px; margin-top: 0; margin-left: 0; }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 8px; color: var(--surface-700); }
    .summary-line.grand-total { border-top: 2px solid var(--surface-300); padding-top: 10px; font-size: 1.1rem; color: var(--primary-700); }

    .detail-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: var(--surface-50); padding: 16px; border-radius: 8px; }
    .info-block { display: flex; flex-direction: column; gap: 4px; }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; }
    .info-block p { margin: 0; font-size: 0.875rem; color: var(--surface-700); }
    .text-success { color: #16A34A; }
    .text-danger { color: #DC2626; }
  `],
})
export class SalesOrdersComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  orders: any[] = [];
  customers: any[] = [];
  items: any[] = [];
  loading = false;
  submitting = false;

  searchQuery = '';
  selectedStatus = '';
  selectedOrder: any = null;

  Number = Number;
  Math = Math;

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.items.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
  }

  getUnitCode(row: any): string {
    if (!row) return 'Pcs';
    const val = row.unitCode || row.unit;
    if (!val) return 'Pcs';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.code || val.name || val.unitCode || 'Pcs';
    return String(val);
  }

  createDefaultGridRows(count = 1): any[] {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const cust = this.customers.find(c => c.id === this.newOrder?.customerLedgerId);
    const isInter = cust && (compState !== (cust.stateCode || '27'));
    return Array.from({ length: count }, () => ({
      itemId: '',
      orderedQty: 1,
      unitPrice: 0,
      discountAmount: 0,
      taxRate: 18,
      unitCode: 'Pcs',
      isInterstate: !!isInter
    }));
  }

  // New order form model
  newOrder: any = {
    customerLedgerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDueDate: '',
    paymentTerms: 'Net 30 Days',
    billingAddress: '',
    shippingAddress: '',
    narration: '',
    items: []
  };

  modalTotals = {
    taxableSubtotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    grandTotal: 0
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadMasters();
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  get clearedCount(): number {
    return this.orders.filter(o => o.status === 'CLEARED').length;
  }

  get totalPipelineValue(): number {
    return this.orders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  }

  loadOrders() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getSalesOrders(this.companyId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => {
        this.orders = res || [];
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
    this.mastersService.getItems(this.companyId).subscribe((data) => {
      this.items = data || [];
    });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadOrders();
  }

  openCreateModal() {
    this.newOrder = {
      customerLedgerId: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDueDate: '',
      paymentTerms: 'Net 30 Days',
      billingAddress: '',
      shippingAddress: '',
      narration: '',
      items: []
    };
    this.recalculateTotals();
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedOrder = null;
    this.loadOrders();
  }

  onCustomerSelected() {
    const cust = this.customers.find(c => c.id === this.newOrder.customerLedgerId);
    if (cust) {
      this.newOrder.billingAddress = cust.addressLine1 || '';
      this.newOrder.shippingAddress = cust.addressLine1 || '';
      const compState = this.tenantService.currentCompany()?.stateCode || '27';
      const custState = cust.stateCode || '27';
      const isInter = compState !== custState;
      this.newOrder.items.forEach((it: any) => it.isInterstate = isInter);
      this.recalculateTotals();
    }
  }

  addItemRow() {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const cust = this.customers.find(c => c.id === this.newOrder.customerLedgerId);
    const isInter = cust && (compState !== (cust.stateCode || '27'));
    this.newOrder.items.push({
      itemId: '',
      orderedQty: 1,
      unitPrice: 0,
      discountAmount: 0,
      taxRate: 18,
      unitCode: 'Pcs',
      isInterstate: !!isInter
    });
  }

  editingItemData: { item: any, index: number } | null = null;

  onFastItemAdded(itemData: any) {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const cust = this.customers.find(c => c.id === this.newOrder.customerLedgerId);
    const isInter = cust && (compState !== (cust.stateCode || '27'));
    const it = this.items.find(i => i.id === itemData.itemId);
    const uVal = it?.unitCode || it?.unit;
    const uStr = typeof uVal === 'object' ? (uVal.code || uVal.name || 'Pcs') : (uVal || 'Pcs');
    
    let emptyRow = this.newOrder.items.find((r: any) => !r.itemId);
    if (emptyRow) {
      emptyRow.itemId = itemData.itemId;
      emptyRow.orderedQty = itemData.qty;
      emptyRow.unitPrice = itemData.rate;
      emptyRow.discountAmount = itemData.discount;
      emptyRow.taxRate = itemData.gstRate;
      emptyRow.unitCode = uStr;
      emptyRow.isInterstate = !!isInter;
    } else {
      this.newOrder.items.push({
        itemId: itemData.itemId,
        orderedQty: itemData.qty,
        unitPrice: itemData.rate,
        discountAmount: itemData.discount,
        taxRate: itemData.gstRate,
        unitCode: uStr,
        isInterstate: !!isInter
      });
    }
    this.recalculateTotals();
  }

  editItemRow(index: number) {
    const row = this.newOrder.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.orderedQty,
          rate: row.unitPrice,
          discount: row.discountAmount,
          gstRate: row.taxRate
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      if (this.newOrder.items[idx]) {
        this.newOrder.items[idx].itemId = itemData.itemId;
        this.newOrder.items[idx].orderedQty = itemData.qty;
        this.newOrder.items[idx].unitPrice = itemData.rate;
        this.newOrder.items[idx].discountAmount = itemData.discount;
        this.newOrder.items[idx].taxRate = itemData.gstRate;
      }
      this.editingItemData = null;
      this.recalculateTotals();
    }
  }

  removeItemRow(index: number) {
    if (this.editingItemData?.index === index) {
      this.editingItemData = null;
    }
    this.newOrder.items.splice(index, 1);
    this.recalculateTotals();
  }

  onItemSelect(row: any) {
    const it = this.items.find(i => i.id === row.itemId);
    if (it) {
      row.unitPrice = Number(it.saleRate || 0);
      row.taxRate = Number(it.gstRate || 18);
      const uVal = it?.unitCode || it?.unit;
      row.unitCode = typeof uVal === 'object' ? (uVal.code || uVal.name || 'Pcs') : (uVal || 'Pcs');
      this.recalculateTotals();
    }
  }

  recalculateTotals() {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const r of this.newOrder.items) {
      if (!r.itemId) continue;
      const qty = Number(r.orderedQty || 0);
      const rate = Number(r.unitPrice || 0);
      const disc = Number(r.discountAmount || 0);
      const taxable = Math.max(0, qty * rate - disc);
      const taxRate = Number(r.taxRate || 0);

      subtotal += taxable;
      if (r.isInterstate) {
        igst += (taxable * taxRate) / 100;
      } else {
        cgst += (taxable * (taxRate / 2)) / 100;
      }
    }

    this.modalTotals = {
      taxableSubtotal: subtotal,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      grandTotal: subtotal + cgst + sgst + igst
    };
  }

  isValidOrder(): boolean {
    const validItems = this.newOrder.items.filter((i: any) => !!i.itemId && Number(i.orderedQty) > 0);
    return (
      !!this.newOrder.customerLedgerId &&
      validItems.length > 0
    );
  }

  submitOrder() {
    if (!this.isValidOrder()) return;
    this.submitting = true;
    const validItems = this.newOrder.items.filter((i: any) => !!i.itemId && Number(i.orderedQty) > 0);
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newOrder,
      items: validItems
    };

    this.salesService.createSalesOrder(payload).subscribe({
      next: (created: any) => {
        this.submitting = false;
        this.toast.success(
          `Sales Order ${created?.orderNo || ''} created successfully! Total: ₹${Number(this.modalTotals.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Sales Order Created',
        );
        this.viewMode = 'list';
        this.loadOrders();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to create sales order';
        this.toast.error(msg, 'Creation Failed');
        alert(msg);
      }
    });
  }

  viewOrder(id: string) {
    this.salesService.getSalesOrderById(id).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.viewMode = 'view';
      }
    });
  }

  editOrder(id: string) {
    this.salesService.getSalesOrderById(id).subscribe({
      next: (order) => {
        if (!order) return;
        this.selectedOrder = order;
        this.newOrder = {
          customerLedgerId: order.customerLedgerId,
          orderDate: order.orderDate,
          deliveryDueDate: order.deliveryDueDate || '',
          paymentTerms: order.paymentTerms || 'Net 30 Days',
          billingAddress: order.billingAddress || '',
          shippingAddress: order.shippingAddress || '',
          narration: order.narration || '',
          items: (order.items || []).map((it: any) => ({
            itemId: it.itemId,
            orderedQty: it.orderedQty || it.qty || 1,
            unitPrice: it.rate || it.unitPrice || 0,
            discountAmount: it.discountAmount || 0,
            taxRate: it.taxRate || 18,
            unitCode: this.getUnitCode(it)
          }))
        };
        this.recalculateTotals();
        this.viewMode = 'create';
      }
    });
  }

  cancelOrder(id: string) {
    if (confirm('Are you sure you want to cancel this sales order?')) {
      this.salesService.cancelSalesOrder(id).subscribe({
        next: () => {
          this.toast.success('Sales order cancelled successfully.', 'Order Cancelled');
          this.loadOrders();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to cancel sales order.', 'Cancellation Failed');
        }
      });
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIALLY_DISPATCHED': return 'badge-part-dispatched';
      case 'CLEARED': return 'badge-cleared';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || '';
  }

  exportOrders() {
    if (!this.orders || this.orders.length === 0) return;
    const headers = ['Voucher No', 'Order Date', 'Customer', 'Delivery Due Date', 'Taxable Amount', 'Tax Total', 'Grand Total', 'Status'];
    const rows = this.orders.map((o) => [
      o.voucherNo || '',
      o.orderDate || '',
      o.customerLedger?.name || '',
      o.deliveryDueDate || '',
      o.taxableSubtotal || o.taxableAmount || 0,
      o.taxTotal || 0,
      o.grandTotal || 0,
      o.status || '',
    ]);
    exportToCsv('Sales_Orders', headers, rows);
    this.toast.success('Sales orders exported successfully!', 'Export Complete');
  }
}
