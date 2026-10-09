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
  selector: 'app-delivery-challans',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Delivery Challans</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Delivery Challan
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
                (input)="loadChallans()"
                placeholder="Search delivery challans..."
              />
            </div>

            <div class="toolbar-filters">
              <select
                class="form-select"
                [(ngModel)]="selectedStatus"
                (change)="filterStatus(selectedStatus)"
              >
                <option value="">All Challans</option>
                <option value="PENDING">Pending Invoicing</option>
                <option value="PARTIALLY_INVOICED">Part-Invoiced</option>
                <option value="CLEARED">Cleared</option>
              </select>

              <button class="btn-export" (click)="exportChallans()" [disabled]="challans.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <!-- CHALLANS TABLE -->
          <table class="zeno-table">
              <thead>
              <tr>
                <th>Challan No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Godown</th>
                <th>Vehicle #</th>
                <th>Items Count</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    <i class="pi pi-spin pi-spinner"></i> Loading delivery challans...
                  </td>
                </tr>
              } @else if (challans.length === 0) {
                <tr>
                  <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    No delivery challans recorded. Create a dispatch to deduct stock.
                  </td>
                </tr>
              } @else {
                @for (dc of challans; track dc.id) {
                  <tr (click)="viewChallan(dc.id)" style="cursor: pointer;">
                    <td class="font-bold" style="color: var(--primary-700)">{{ dc.voucherNo }}</td>
                    <td>{{ dc.challanDate }}</td>
                    <td>
                      <div class="font-bold">{{ dc.customerLedger?.name }}</div>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ dc.customerLedger?.gstin || 'Unregistered' }}</div>
                    </td>
                    <td>{{ dc.godown?.name || 'Main Godown' }}</td>
                    <td>{{ dc.vehicleNo || '-' }}</td>
                    <td>{{ dc.items?.length || 0 }} items</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(dc.status)">{{ formatStatus(dc.status) }}</span>
                    </td>
                    <td class="text-right" (click)="$event.stopPropagation()">
                      <button class="btn-icon" title="View Details" (click)="viewChallan(dc.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE DELIVERY CHALLAN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Record Delivery Challan (Stock OUT)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitChallan()" [disabled]="submitting || !isValidChallan()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Dispatching Stock...
              } @else {
                <i class="pi pi-check"></i> Post Dispatch &amp; Deduct Stock
              }
            </button>
          </div>
        </div>

        <div class="form-page-no-card">
          <!-- TOP SECTION: CUSTOMER & METADATA (MAX 4 FIELDS) -->
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer</label>
              <zeno-searchable-select
                [options]="customers"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Select Customer..."
                [(ngModel)]="newDc.customerLedgerId"
                (selectChange)="onCustomerSelected()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Dispatch Godown / Warehouse</label>
              <select [(ngModel)]="newDc.godownId">
                <option value="">Select Warehouse...</option>
                @for (g of godowns; track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Primary' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Challan Date</label>
              <input type="date" [(ngModel)]="newDc.challanDate" />
            </div>

            <div class="form-group">
              <label>Vehicle No</label>
              <input type="text" [(ngModel)]="newDc.vehicleNo" placeholder="Vehicle no..." />
            </div>
          </div>

          @if (newDc.customerLedgerId) {
            <div class="pull-orders-box" style="margin-bottom: 16px;">
              <div class="pull-orders-info">
                <i class="pi pi-link"></i>
                <span>Pull pending dispatch items from approved Sales Orders</span>
              </div>
              <button class="btn-sm btn-outline" type="button" (click)="pullPendingOrders()" [disabled]="loadingPendingOrders">
                @if (loadingPendingOrders) {
                  <i class="pi pi-spin pi-spinner"></i> Loading...
                } @else {
                  <i class="pi pi-download"></i> Load Pending SO Lines
                }
              </button>
            </div>
          }

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
                    <th style="min-width: 200px;">Product / Item</th>
                    <th style="width: 100px;" class="text-center">Dispatch Qty</th>
                    <th style="width: 75px;" class="text-center">Unit</th>
                    <th style="width: 110px;" class="text-right">Unit Rate (₹)</th>
                    <th style="min-width: 150px;">Remarks / SO Ref</th>
                    <th style="width: 120px;" class="text-right">Total (₹)</th>
                    <th style="width: 70px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (newDc.items.length === 0 || (newDc.items.length === 1 && !newDc.items[0].itemId)) {
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added yet. Use the Fast Item Entry Bar above to add items to this delivery challan.
                      </td>
                    </tr>
                  } @else {
                    @for (row of newDc.items; track $index; let i = $index) {
                      @if (row.itemId) {
                        <tr>
                          <td class="excel-row-num text-center">{{ i + 1 }}</td>
                          <td>
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(row.itemId) }}</span>
                          </td>
                          <td class="text-center font-mono font-bold">
                            {{ row.dispatchedQty }}
                          </td>
                          <td class="text-center">
                            <span class="unit-badge">{{ getUnitCode(row) }}</span>
                          </td>
                          <td class="text-right font-mono">
                            ₹{{ row.rate | number:'1.2-2' }}
                          </td>
                          <td>
                            <span style="padding: 2px 6px; font-size: 0.8125rem;">{{ row.remarks || '-' }}</span>
                          </td>
                          <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                            ₹{{ (row.dispatchedQty * row.rate) | number:'1.2-2' }}
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
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY & TOTALS FOOTER SECTION -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Delivery / Dispatch Notes</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter driver details or dispatch notes..."
                [(ngModel)]="newDc.remarks"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line grand-total">
                <span>Total Dispatched Value:</span>
                <strong>₹{{ getChallanTotal() | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedChallan) {
        <!-- VIEW DELIVERY CHALLAN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Challan #{{ selectedChallan.voucherNo }}</h1>
            <span class="badge" [ngClass]="getStatusBadge(selectedChallan.status)">
              {{ formatStatus(selectedChallan.status) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Challan
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Customer</span>
              <strong>{{ selectedChallan.customerLedger?.name }}</strong>
              <p>{{ selectedChallan.dispatchAddress || 'Customer registered address' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Dispatch Details</span>
              <p><strong>Date:</strong> {{ selectedChallan.challanDate }}</p>
              <p><strong>Godown:</strong> {{ selectedChallan.godown?.name }}</p>
            </div>
            <div class="info-block">
              <span class="label">Transport Logistics</span>
              <p><strong>Vehicle:</strong> {{ selectedChallan.vehicleNo || 'Not specified' }}</p>
              <p><strong>Contact:</strong> {{ selectedChallan.driverContact || 'N/A' }}</p>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: var(--surface-700)">Dispatched Line Items</h4>
          <div class="table-responsive">
            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Dispatched Qty</th>
                  <th>Invoiced Qty</th>
                  <th>Pending to Invoice</th>
                  <th>Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of selectedChallan.items; track item.id) {
                  <tr>
                    <td>
                      <strong>{{ item.item?.name }}</strong>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ item.item?.sku }}</div>
                    </td>
                    <td class="font-bold">{{ item.dispatchedQty }} {{ item.unit?.code || 'NOS' }}</td>
                    <td class="text-success font-bold">{{ item.invoicedQty }}</td>
                    <td class="font-bold" [class.text-orange]="(item.dispatchedQty - item.invoicedQty) > 0">
                      {{ item.dispatchedQty - item.invoicedQty }}
                    </td>
                    <td>₹{{ item.rate | number:'1.2-2' }}</td>
                    <td class="text-right font-bold">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
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
    .zeno-table {
      width: 100%;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      text-align: left;
      font-size: 0.875rem;

      th {
        background-color: var(--surface-100) !important;
        padding: 12px 16px;
        color: var(--surface-700) !important;
        font-weight: 700;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border-bottom: 1px solid var(--surface-300) !important;
        border-right: 1px solid var(--surface-200) !important;
        white-space: nowrap !important;
        &:last-child { border-right: none !important; }
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--surface-200) !important;
        border-right: 1px solid var(--surface-200) !important;
        color: var(--surface-800);
        vertical-align: middle;
        white-space: nowrap !important;
        &:last-child { border-right: none !important; }
      }

      tr:last-child td { border-bottom: none !important; }
      tr:hover td { background: rgba(248, 250, 252, 0.7); }
    }

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
    .badge-part-invoiced { background: #E0E7FF; color: #4338CA; }
    .badge-cleared { background: #DCFCE7; color: #15803D; }

    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600); color: var(--primary-600); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .pull-orders-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .pull-orders-info { display: flex; align-items: center; gap: 8px; color: #1E40AF; font-size: 0.85rem; }

    .line-items-section {
      margin: 20px 0;
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-md);
      padding: 20px;
      background: var(--surface-0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

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

      .line-table {
        background: #ffffff;
        width: 100%;
        border-collapse: separate !important;
        border-spacing: 0 !important;

        th {
          background-color: var(--surface-100) !important;
          color: var(--surface-700) !important;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 12px 14px;
          border-bottom: 1px solid var(--surface-300) !important;
          border-right: 1px solid var(--surface-200) !important;
          &:last-child { border-right: none !important; }
        }

        td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--surface-200) !important;
          border-right: 1px solid var(--surface-200) !important;
          vertical-align: middle;
          &:last-child { border-right: none !important; }

          input, select {
            width: 100%;
            height: 36px;
            padding: 6px 10px;
            border: 1px solid var(--surface-300) !important;
            border-radius: 6px !important;
          }
        }

        tr:last-child td {
          border-bottom: none !important;
        }

        tr:hover td {
          background-color: rgba(248, 250, 252, 0.7);
        }
      }
    }

    .stock-alert-note { margin-top: 16px; background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 10px 14px; border-radius: 8px; font-size: 0.825rem; display: flex; align-items: center; gap: 8px; }

    .detail-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .info-block { background: var(--surface-50); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-200); }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; display: block; margin-bottom: 4px; }
    .text-orange { color: #EA580C; }
    .text-success { color: #16A34A; }
  `]
})
export class DeliveryChallansComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  challans: any[] = [];
  customers: any[] = [];
  godowns: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  loadingPendingOrders = false;

  searchQuery = '';
  selectedStatus = '';
  selectedChallan: any = null;

  Number = Number;

  newDc: any = {
    customerLedgerId: '',
    godownId: '',
    challanDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driverContact: '',
    dispatchAddress: '',
    soIds: [] as string[],
    items: [
      { itemId: '', dispatchedQty: 1, rate: 0, remarks: '', soItemId: null }
    ]
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadChallans();
    this.loadMasters();
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get pendingCount(): number {
    return this.challans.filter(c => c.status === 'PENDING').length;
  }

  get clearedCount(): number {
    return this.challans.filter(c => c.status === 'CLEARED').length;
  }

  loadChallans() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getDeliveryChallans(this.companyId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => {
        this.challans = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getChallanTotal(): number {
    return (this.newDc?.items || []).reduce((sum: number, r: any) => sum + (Number(r.dispatchedQty || 0) * Number(r.rate || 0)), 0);
  }

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.itemsList.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
  }

  loadMasters() {
    if (!this.companyId) return;
    this.mastersService.getLedgers(this.companyId, false, true).subscribe((data) => {
      this.customers = data || [];
    });
    this.mastersService.getItems(this.companyId).subscribe((data) => {
      this.itemsList = data || [];
    });
    const defaultGodowns = this.tenantService.godowns();
    if (defaultGodowns && defaultGodowns.length > 0) {
      this.godowns = defaultGodowns;
    } else {
      this.godowns = [
        { id: this.tenantService.currentGodown()?.id || 'main-godown', name: 'Main Godown', code: 'MAIN' }
      ];
    }
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadChallans();
  }

  openCreateModal() {
    this.newDc = {
      customerLedgerId: '',
      godownId: this.godowns[0]?.id || '',
      challanDate: new Date().toISOString().split('T')[0],
      vehicleNo: '',
      driverContact: '',
      dispatchAddress: '',
      soIds: [],
      items: [
        { itemId: '', dispatchedQty: 1, rate: 0, remarks: '', soItemId: null }
      ]
    };
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedChallan = null;
    this.loadChallans();
  }

  onCustomerSelected() {
    const cust = this.customers.find(c => c.id === this.newDc.customerLedgerId);
    if (cust) {
      this.newDc.dispatchAddress = cust.addressLine1 || '';
    }
  }

  addItemRow() {
    this.newDc.items.push({
      itemId: '',
      dispatchedQty: 1,
      rate: 0,
      remarks: '',
      soItemId: null
    });
  }

  editingItemData: { item: any, index: number } | null = null;

  getUnitCode(row: any): string {
    if (row.unitCode) return row.unitCode;
    if (row.itemId) {
      const it = this.itemsList.find(i => i.id === row.itemId);
      const uVal = it?.unitCode || it?.unit;
      return typeof uVal === 'object' ? (uVal.code || uVal.name || 'Pcs') : (uVal || 'Pcs');
    }
    return 'Pcs';
  }

  onFastItemAdded(itemData: any) {
    if (this.newDc.items.length === 1 && !this.newDc.items[0].itemId) {
      this.newDc.items = [];
    }
    this.newDc.items.push({
      itemId: itemData.itemId,
      dispatchedQty: itemData.qty,
      rate: itemData.rate,
      remarks: '',
      soItemId: null
    });
    this.recalculateTotals();
  }

  editItemRow(index: number) {
    const row = this.newDc.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.dispatchedQty,
          rate: row.rate,
          discount: 0,
          gstRate: 0
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      if (this.newDc.items[idx]) {
        this.newDc.items[idx].itemId = itemData.itemId;
        this.newDc.items[idx].dispatchedQty = itemData.qty;
        this.newDc.items[idx].rate = itemData.rate;
      }
      this.editingItemData = null;
      this.recalculateTotals();
    }
  }

  removeItemRow(index: number) {
    if (this.editingItemData?.index === index) {
      this.editingItemData = null;
    }
    this.newDc.items.splice(index, 1);
    this.recalculateTotals();
  }

  onItemSelect(row: any) {
    const it = this.itemsList.find(i => i.id === row.itemId);
    if (it) {
      row.rate = Number(it.saleRate || 0);
    }
  }

  pullPendingOrders() {
    if (!this.newDc.customerLedgerId) return;
    this.loadingPendingOrders = true;
    this.salesService.getCustomerPendingOrders(this.newDc.customerLedgerId, this.companyId).subscribe({
      next: (orders) => {
        this.loadingPendingOrders = false;
        if (!orders || orders.length === 0) {
          alert('No pending sales orders found for this customer.');
          return;
        }

        const lines: any[] = [];
        const soIds: string[] = [];

        for (const order of orders) {
          soIds.push(order.id);
          for (const item of order.items || []) {
            const pendingQty = Number(item.orderedQty || 0) - Number(item.dispatchedQty || 0);
            if (pendingQty > 0) {
              lines.push({
                itemId: item.itemId,
                dispatchedQty: pendingQty,
                rate: Number(item.rate || 0),
                remarks: `From Order #${order.voucherNo}`,
                soItemId: item.id
              });
            }
          }
        }

        if (lines.length > 0) {
          this.newDc.items = lines;
          this.newDc.soIds = soIds;
        } else {
          alert('All items in open orders have already been dispatched.');
        }
      },
      error: () => {
        this.loadingPendingOrders = false;
      }
    });
  }

  recalculateTotals() {
    // triggers UI update for line totals
  }

  isValidChallan(): boolean {
    return (
      !!this.newDc.customerLedgerId &&
      !!this.newDc.godownId &&
      this.newDc.items.length > 0 &&
      this.newDc.items.every((i: any) => !!i.itemId && Number(i.dispatchedQty) > 0)
    );
  }

  submitChallan() {
    if (!this.isValidChallan()) return;
    this.submitting = true;
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newDc
    };

    this.salesService.createDeliveryChallan(payload).subscribe({
      next: (created: any) => {
        this.submitting = false;
        this.toast.success(
          `Delivery Challan ${created?.challanNo || ''} created successfully!`,
          'Challan Created',
        );
        this.viewMode = 'list';
        this.loadChallans();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to create delivery challan';
        this.toast.error(msg, 'Creation Failed');
        alert(msg);
      }
    });
  }

  viewChallan(id: string) {
    this.salesService.getDeliveryChallanById(id).subscribe({
      next: (dc) => {
        this.selectedChallan = dc;
        this.viewMode = 'view';
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIALLY_INVOICED': return 'badge-part-invoiced';
      case 'CLEARED': return 'badge-cleared';
      default: return '';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || '';
  }

  exportChallans() {
    if (!this.challans || this.challans.length === 0) return;
    const headers = ['Challan No', 'Date', 'Customer', 'Godown', 'Vehicle No', 'Items Count', 'Status'];
    const rows = this.challans.map((c) => [
      c.voucherNo || c.challanNo || '',
      c.challanDate || '',
      c.customerLedger?.name || '',
      c.godown?.name || '',
      c.vehicleNo || '',
      c.items?.length || 0,
      c.status || ''
    ]);
    exportToCsv('Delivery_Challans', headers, rows);
    this.toast.success('Delivery challans exported successfully!', 'Export Complete');
  }
}
