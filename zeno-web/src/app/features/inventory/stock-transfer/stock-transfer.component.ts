import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ApiService } from '../../../core/services/api.service';

interface TransferLineItem {
  itemId: string;
  variantId?: string | null;
  transferQty: number;
  unitRate: number;
  totalAmount: number;
  notes?: string;
  availableStock?: number;
}

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      @if (viewMode === 'list') {
        <div class="page-header">
          <div>
            <h1>Stock Transfer</h1>
            <p class="subtitle">Inter-warehouse and godown inventory movements with gap-safe voucher audit</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Stock Transfer
            </button>
          </div>
        </div>

        <!-- KPI METRICS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-arrows-h"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Transfers</span>
              <span class="kpi-value">{{ transfers.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-box"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Units Moved</span>
              <span class="kpi-value">{{ totalUnitsMoved | number:'1.0-2' }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-dollar"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Transfer Valuation</span>
              <span class="kpi-value">₹{{ totalTransferValue | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- TOOLBAR & FILTERS -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                placeholder="Search by voucher #, warehouse, or item..."
                [(ngModel)]="searchQuery"
                (input)="filterTransfers()"
              />
            </div>
            <div class="toolbar-filters">
              <select [(ngModel)]="statusFilter" (change)="filterTransfers()" class="form-control" style="width: 160px;">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <!-- TRANSFERS TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Source Warehouse</th>
                <th>Destination Warehouse</th>
                <th class="text-right">Items Count</th>
                <th class="text-right">Total Qty</th>
                <th class="text-right">Total Value</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center py-5">
                    <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-600);"></i>
                    <p class="mt-2 text-muted">Loading stock transfers...</p>
                  </td>
                </tr>
              } @else if (filteredTransfers.length === 0) {
                <tr>
                  <td colspan="9" class="text-center py-5 text-muted">
                    <i class="pi pi-folder-open" style="font-size: 2rem; color: var(--surface-400);"></i>
                    <p class="mt-2">No stock transfers found. Click <strong>New Stock Transfer</strong> to create one.</p>
                  </td>
                </tr>
              } @else {
                @for (t of filteredTransfers; track t.id) {
                  <tr>
                    <td>
                      <span class="badge-voucher" (click)="viewDetails(t)">{{ t.voucherNo }}</span>
                    </td>
                    <td>{{ t.transferDate }}</td>
                    <td>
                      <div class="godown-pill source">
                        <i class="pi pi-sign-out"></i>
                        <span>{{ t.sourceGodown?.name || 'Main Warehouse' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="godown-pill dest">
                        <i class="pi pi-sign-in"></i>
                        <span>{{ t.destinationGodown?.name || 'Target Warehouse' }}</span>
                      </div>
                    </td>
                    <td class="text-right font-medium">{{ t.items?.length || 0 }}</td>
                    <td class="text-right font-semibold">{{ t.totalQty | number:'1.0-3' }}</td>
                    <td class="text-right font-semibold text-primary">₹{{ t.totalAmount | number:'1.2-2' }}</td>
                    <td>
                      <span class="status-badge" [class.status-completed]="t.status === 'COMPLETED'" [class.status-cancelled]="t.status === 'CANCELLED'">
                        {{ t.status }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-buttons">
                        <button class="btn-icon" (click)="viewDetails(t)" title="View Details">
                          <i class="pi pi-eye"></i>
                        </button>
                        @if (t.status === 'COMPLETED') {
                          <button class="btn-icon text-danger" (click)="cancelTransfer(t)" title="Cancel & Revert Stock">
                            <i class="pi pi-times-circle"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else {
        <!-- CREATE TRANSFER PAGE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="viewMode = 'list'">
              <i class="pi pi-arrow-left"></i>
            </button>
            <div>
              <h1>New Stock Transfer</h1>
              <p class="subtitle">Transfer physical stock between godowns with real-time stock balance verification</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="viewMode = 'list'">Cancel</button>
            <button class="btn-primary" (click)="saveTransfer()" [disabled]="submitting">
              <i class="pi pi-check"></i> {{ submitting ? 'Transferring...' : 'Post Stock Transfer' }}
            </button>
          </div>
        </div>

        @if (errorMessage) {
          <div class="alert-danger mb-4">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <div class="form-container">
          <!-- TRANSFER HEADER CARD -->
          <div class="zeno-card mb-4">
            <h3 class="card-section-title">Transfer Header</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Transfer Date <span class="required">*</span></label>
                <input type="date" [(ngModel)]="formData.transferDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>Source Warehouse (From) <span class="required">*</span></label>
                <select [(ngModel)]="formData.sourceGodownId" (change)="onSourceGodownChange()" class="form-control">
                  <option value="">Select Source Warehouse</option>
                  @for (g of godowns; track g.id) {
                    <option [value]="g.id">{{ g.name }} ({{ g.code }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Destination Warehouse (To) <span class="required">*</span></label>
                <select [(ngModel)]="formData.destinationGodownId" class="form-control">
                  <option value="">Select Destination Warehouse</option>
                  @for (g of godowns; track g.id) {
                    <option [value]="g.id" [disabled]="g.id === formData.sourceGodownId">{{ g.name }} ({{ g.code }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Voucher / Reference No (Optional)</label>
                <input type="text" [(ngModel)]="formData.voucherNo" placeholder="Auto-generated if blank" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Transfer Remarks / Vehicle / Narration</label>
                <textarea [(ngModel)]="formData.notes" rows="2" placeholder="e.g. Internal stock relocation, van transfer..." class="form-control"></textarea>
              </div>
            </div>
          </div>

          <!-- LINE ITEMS CARD -->
          <div class="zeno-card">
            <div class="items-header">
              <h3 class="card-section-title mb-0">Items to Transfer</h3>
              <button class="btn-sm btn-secondary" (click)="addLineItem()">
                <i class="pi pi-plus"></i> Add Item
              </button>
            </div>

            <table class="zeno-table line-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="width: 320px;">Product / Item <span class="required">*</span></th>
                  <th style="width: 140px;">Available Stock</th>
                  <th style="width: 130px;" class="text-right">Transfer Qty <span class="required">*</span></th>
                  <th style="width: 140px;" class="text-right">Unit Rate (₹)</th>
                  <th style="width: 150px;" class="text-right">Amount (₹)</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (line of formData.items; track $index) {
                  <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                      <select [(ngModel)]="line.itemId" (change)="onItemSelect(line)" class="form-control">
                        <option value="">-- Choose Product --</option>
                        @for (it of itemsList; track it.id) {
                          <option [value]="it.id">{{ it.name }} ({{ it.sku || 'No SKU' }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <span class="stock-pill" [class.low-stock]="(line.availableStock || 0) < line.transferQty">
                        {{ (line.availableStock || 0) | number:'1.0-3' }}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.001"
                        step="1"
                        [(ngModel)]="line.transferQty"
                        (input)="recalcLine(line)"
                        class="form-control text-right"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        [(ngModel)]="line.unitRate"
                        (input)="recalcLine(line)"
                        class="form-control text-right"
                      />
                    </td>
                    <td class="text-right font-semibold">
                      ₹{{ line.totalAmount | number:'1.2-2' }}
                    </td>
                    <td class="text-center">
                      <button class="btn-icon text-danger" (click)="removeLineItem($index)" title="Remove Line">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- SUMMARY BAR -->
            <div class="transfer-totals-bar">
              <div class="totals-left">
                <span>Total Items: <strong>{{ formData.items.length }}</strong></span>
              </div>
              <div class="totals-right">
                <div class="total-block">
                  <span class="label">Total Quantity:</span>
                  <span class="value">{{ calculateTotalQty() | number:'1.0-3' }}</span>
                </div>
                <div class="total-block highlight">
                  <span class="label">Total Valuation:</span>
                  <span class="value">₹{{ calculateTotalAmount() | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- DETAIL MODAL -->
      @if (selectedTransfer) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Stock Transfer Details - {{ selectedTransfer.voucherNo }}</h3>
              <button class="btn-close" (click)="selectedTransfer = null">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div><span class="label">Transfer Date:</span> <strong>{{ selectedTransfer.transferDate }}</strong></div>
                <div><span class="label">Status:</span> <span class="status-badge" [class.status-completed]="selectedTransfer.status === 'COMPLETED'">{{ selectedTransfer.status }}</span></div>
                <div><span class="label">Source:</span> <strong>{{ selectedTransfer.sourceGodown?.name }}</strong></div>
                <div><span class="label">Destination:</span> <strong>{{ selectedTransfer.destinationGodown?.name }}</strong></div>
                @if (selectedTransfer.notes) {
                  <div class="full-width"><span class="label">Remarks:</span> {{ selectedTransfer.notes }}</div>
                }
              </div>

              <h4 class="mt-4 mb-2 font-semibold">Transferred Items</h4>
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (it of selectedTransfer.items; track it.id) {
                    <tr>
                      <td>{{ it.item?.name }} ({{ it.item?.sku }})</td>
                      <td class="text-right font-medium">{{ it.transferQty | number:'1.0-3' }} {{ it.item?.unit?.code }}</td>
                      <td class="text-right">₹{{ it.unitRate | number:'1.2-4' }}</td>
                      <td class="text-right font-semibold">₹{{ it.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedTransfer = null">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventory-page {
      padding: 0;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--surface-900);
        margin: 0;
      }
      .subtitle {
        font-size: 0.875rem;
        color: var(--surface-500);
        margin: 4px 0 0 0;
      }
    }
    .header-back-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-back {
      background: #ffffff;
      border: 1px solid var(--surface-300);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--surface-700);
      &:hover {
        background: var(--surface-100);
      }
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      &.blue { background: #eff6ff; color: #2563eb; }
      &.green { background: #f0fdf4; color: #16a34a; }
      &.purple { background: #faf5ff; color: #9333ea; }
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--surface-500);
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--surface-900);
    }
    .zeno-card {
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--surface-800);
      margin: 0 0 16px 0;
    }
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .toolbar-search {
      position: relative;
      flex: 1;
      max-width: 460px;
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--surface-400);
      }
      input {
        width: 100%;
        padding: 9px 12px 9px 36px;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        outline: none;
        &:focus { border-color: var(--primary-500); }
      }
    }
    .zeno-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      th {
        background: var(--surface-50);
        padding: 10px 14px;
        font-weight: 600;
        color: var(--surface-600);
        border-bottom: 1px solid var(--surface-200);
        text-align: left;
      }
      td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--surface-100);
        color: var(--surface-800);
      }
      tr:hover td {
        background: var(--surface-50);
      }
    }
    .badge-voucher {
      font-weight: 700;
      color: var(--primary-700);
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }
    .godown-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      &.source { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
      &.dest { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      &.status-completed { background: #dcfce7; color: #166534; }
      &.status-cancelled { background: #fee2e2; color: #991b1b; }
    }
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-icon {
      background: none;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      width: 32px;
      height: 32px;
      cursor: pointer;
      color: var(--surface-600);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      &:hover { background: var(--surface-100); }
      &.text-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    }
    .btn-primary {
      background: var(--primary-600);
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      &:hover { background: var(--primary-700); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-secondary {
      background: #ffffff;
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      padding: 9px 18px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      &:hover { background: var(--surface-100); }
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8125rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--surface-700);
      }
      &.full-width {
        grid-column: 1 / -1;
      }
    }
    .form-control {
      padding: 8px 12px;
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      outline: none;
      &:focus { border-color: var(--primary-500); }
    }
    .required { color: #dc2626; }
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .stock-pill {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      &.low-stock {
        background: #fee2e2;
        color: #b91c1c;
      }
    }
    .transfer-totals-bar {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .totals-right {
      display: flex;
      gap: 24px;
      align-items: center;
    }
    .total-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      .label {
        font-size: 0.75rem;
        color: var(--surface-500);
        font-weight: 600;
      }
      .value {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--surface-800);
      }
      &.highlight .value {
        color: var(--primary-600);
        font-size: 1.25rem;
      }
    }
    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-md);
      width: 90%;
      max-width: 750px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--surface-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; font-size: 1.125rem; }
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--surface-200);
      display: flex;
      justify-content: flex-end;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 0.875rem;
      .label { color: var(--surface-500); margin-right: 6px; }
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-muted { color: var(--surface-500); }
    .text-primary { color: var(--primary-600); }
  `],
})
export class StockTransferComponent implements OnInit {
  viewMode: 'list' | 'create' = 'list';
  transfers: any[] = [];
  filteredTransfers: any[] = [];
  godowns: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  statusFilter = 'ALL';
  errorMessage = '';
  selectedTransfer: any = null;

  totalUnitsMoved = 0;
  totalTransferValue = 0;

  formData = {
    transferDate: new Date().toISOString().split('T')[0],
    sourceGodownId: '',
    destinationGodownId: '',
    voucherNo: '',
    notes: '',
    items: [] as TransferLineItem[],
  };

  constructor(
    private inventoryService: InventoryService,
    private mastersService: MastersService,
    private tenantService: TenantService,
    private api: ApiService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.loading = true;
    this.inventoryService.getTransfers(comp.id).subscribe({
      next: (res: any[]) => {
        this.transfers = res;
        this.filterTransfers();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    this.api.get<any[]>('/tenancy/godowns').subscribe({
      next: (res: any[]) => {
        this.godowns = res?.length ? res : this.tenantService.godowns();
      },
    });

    this.mastersService.getItems(comp.id).subscribe({
      next: (res: any[]) => {
        this.itemsList = res;
      },
    });
  }

  filterTransfers() {
    let list = this.transfers;
    if (this.statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.voucherNo?.toLowerCase().includes(q) ||
          t.sourceGodown?.name?.toLowerCase().includes(q) ||
          t.destinationGodown?.name?.toLowerCase().includes(q),
      );
    }
    this.filteredTransfers = list;

    this.totalUnitsMoved = this.transfers
      .filter((t) => t.status === 'COMPLETED')
      .reduce((acc, curr) => acc + Number(curr.totalQty || 0), 0);
    this.totalTransferValue = this.transfers
      .filter((t) => t.status === 'COMPLETED')
      .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  }

  openCreatePage() {
    this.formData = {
      transferDate: new Date().toISOString().split('T')[0],
      sourceGodownId: this.tenantService.currentGodown()?.id || (this.godowns[0]?.id || ''),
      destinationGodownId: '',
      voucherNo: '',
      notes: '',
      items: [],
    };
    this.errorMessage = '';
    this.addLineItem();
    this.viewMode = 'create';
  }

  addLineItem() {
    this.formData.items.push({
      itemId: '',
      transferQty: 1,
      unitRate: 0,
      totalAmount: 0,
      availableStock: 0,
    });
  }

  removeLineItem(index: number) {
    this.formData.items.splice(index, 1);
  }

  onSourceGodownChange() {
    // Refresh stock for each line item
    for (const line of this.formData.items) {
      if (line.itemId) {
        this.checkStock(line);
      }
    }
  }

  onItemSelect(line: TransferLineItem) {
    const it = this.itemsList.find((i) => i.id === line.itemId);
    if (it) {
      line.unitRate = Number(it.purchaseRate || it.saleRate || 0);
      this.recalcLine(line);
      this.checkStock(line);
    }
  }

  checkStock(line: TransferLineItem) {
    const comp = this.tenantService.currentCompany();
    if (!comp || !this.formData.sourceGodownId || !line.itemId) return;

    this.inventoryService
      .getItemBalance(comp.id, this.formData.sourceGodownId, line.itemId)
      .subscribe({
        next: (res) => {
          line.availableStock = Number(res.currentBalance || 0);
        },
      });
  }

  recalcLine(line: TransferLineItem) {
    const qty = Number(line.transferQty || 0);
    const rate = Number(line.unitRate || 0);
    line.totalAmount = Number((qty * rate).toFixed(2));
  }

  calculateTotalQty(): number {
    return this.formData.items.reduce((acc, curr) => acc + Number(curr.transferQty || 0), 0);
  }

  calculateTotalAmount(): number {
    return this.formData.items.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  }

  saveTransfer() {
    this.errorMessage = '';
    if (!this.formData.sourceGodownId) {
      this.errorMessage = 'Please select a source warehouse.';
      return;
    }
    if (!this.formData.destinationGodownId) {
      this.errorMessage = 'Please select a destination warehouse.';
      return;
    }
    if (this.formData.sourceGodownId === this.formData.destinationGodownId) {
      this.errorMessage = 'Source and destination warehouses cannot be the same.';
      return;
    }
    if (this.formData.items.length === 0) {
      this.errorMessage = 'Please add at least one item to transfer.';
      return;
    }

    for (const it of this.formData.items) {
      if (!it.itemId) {
        this.errorMessage = 'Please choose a product for each line.';
        return;
      }
      if (Number(it.transferQty) <= 0) {
        this.errorMessage = 'Transfer quantity must be greater than zero.';
        return;
      }
      if ((it.availableStock || 0) < Number(it.transferQty)) {
        this.errorMessage = `Transfer quantity exceeds available stock for selected product (${it.availableStock} available).`;
        return;
      }
    }

    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.submitting = true;
    const payload = {
      ...this.formData,
      companyId: comp.id,
      status: 'COMPLETED',
    };

    this.inventoryService.createTransfer(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to save stock transfer.';
      },
    });
  }

  viewDetails(t: any) {
    this.selectedTransfer = t;
  }

  cancelTransfer(t: any) {
    if (!confirm(`Are you sure you want to cancel transfer ${t.voucherNo}? Stock will be reversed.`)) {
      return;
    }

    this.inventoryService.cancelTransfer(t.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel stock transfer');
      },
    });
  }
}
