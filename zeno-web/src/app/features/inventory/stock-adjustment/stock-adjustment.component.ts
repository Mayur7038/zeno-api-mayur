import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ApiService } from '../../../core/services/api.service';

interface AdjustmentLineItem {
  itemId: string;
  variantId?: string | null;
  adjustmentType: 'INCREASE' | 'DECREASE';
  qty: number;
  unitRate: number;
  totalAmount: number;
  reason?: string;
  availableStock?: number;
}

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      @if (viewMode === 'list') {
        <div class="page-header">
          <div>
            <h1>Stock Adjustment</h1>
            <p class="subtitle">Correct inventory discrepancies for shrinkage, damages, scrap, or surplus</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Stock Adjustment
            </button>
          </div>
        </div>

        <!-- KPI METRICS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-sliders-h"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Adjustments</span>
              <span class="kpi-value">{{ adjustments.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-box"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Units Adjusted</span>
              <span class="kpi-value">{{ totalUnitsAdjusted | number:'1.0-3' }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-dollar"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Net Valuation Impact</span>
              <span class="kpi-value">₹{{ totalValuationImpact | number:'1.2-2' }}</span>
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
                placeholder="Search by voucher #, warehouse, reason..."
                [(ngModel)]="searchQuery"
                (input)="filterAdjustments()"
              />
            </div>
            <div class="toolbar-filters">
              <select [(ngModel)]="reasonFilter" (change)="filterAdjustments()" class="form-control" style="width: 170px;">
                <option value="ALL">All Reasons</option>
                <option value="DAMAGE">Damage</option>
                <option value="SHRINKAGE">Shrinkage / Loss</option>
                <option value="EXPIRATION">Expired Goods</option>
                <option value="SCRAP">Scrap</option>
                <option value="FOUND_SURPLUS">Found Surplus</option>
                <option value="CORRECTION">Audit Correction</option>
              </select>
              <select [(ngModel)]="statusFilter" (change)="filterAdjustments()" class="form-control" style="width: 150px;">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <!-- TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Warehouse</th>
                <th>Primary Reason</th>
                <th class="text-right">Items Count</th>
                <th class="text-right">Total Qty</th>
                <th class="text-right">Total Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center py-5">
                    <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-600);"></i>
                    <p class="mt-2 text-muted">Loading adjustments...</p>
                  </td>
                </tr>
              } @else if (filteredAdjustments.length === 0) {
                <tr>
                  <td colspan="9" class="text-center py-5 text-muted">
                    <i class="pi pi-folder-open" style="font-size: 2rem; color: var(--surface-400);"></i>
                    <p class="mt-2">No adjustments recorded. Click <strong>New Stock Adjustment</strong> to create one.</p>
                  </td>
                </tr>
              } @else {
                @for (a of filteredAdjustments; track a.id) {
                  <tr>
                    <td>
                      <span class="badge-voucher" (click)="viewDetails(a)">{{ a.voucherNo }}</span>
                    </td>
                    <td>{{ a.adjustmentDate }}</td>
                    <td>
                      <div class="warehouse-pill">
                        <i class="pi pi-warehouse"></i>
                        <span>{{ a.godown?.name || 'Main Godown' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="reason-pill">{{ a.reason }}</span>
                    </td>
                    <td class="text-right font-medium">{{ a.items?.length || 0 }}</td>
                    <td class="text-right font-semibold">{{ a.totalQty | number:'1.0-3' }}</td>
                    <td class="text-right font-semibold text-primary">₹{{ a.totalAmount | number:'1.2-2' }}</td>
                    <td>
                      <span class="status-badge" [class.status-completed]="a.status === 'COMPLETED'" [class.status-cancelled]="a.status === 'CANCELLED'">
                        {{ a.status }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-buttons">
                        <button class="btn-icon" (click)="viewDetails(a)" title="View Details">
                          <i class="pi pi-eye"></i>
                        </button>
                        @if (a.status === 'COMPLETED') {
                          <button class="btn-icon text-danger" (click)="cancelAdjustment(a)" title="Cancel & Reverse">
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
        <!-- CREATE ADJUSTMENT PAGE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="viewMode = 'list'">
              <i class="pi pi-arrow-left"></i>
            </button>
            <div>
              <h1>New Stock Adjustment</h1>
              <p class="subtitle">Record inventory adjustments for damages, scrap, audit differences, or surplus</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="viewMode = 'list'">Cancel</button>
            <button class="btn-primary" (click)="saveAdjustment()" [disabled]="submitting">
              <i class="pi pi-check"></i> {{ submitting ? 'Saving...' : 'Post Stock Adjustment' }}
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
          <!-- ADJUSTMENT HEADER CARD -->
          <div class="zeno-card mb-4">
            <h3 class="card-section-title">Adjustment Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Adjustment Date <span class="required">*</span></label>
                <input type="date" [(ngModel)]="formData.adjustmentDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>Warehouse / Godown <span class="required">*</span></label>
                <select [(ngModel)]="formData.godownId" (change)="onGodownChange()" class="form-control">
                  <option value="">Select Warehouse</option>
                  @for (g of godowns; track g.id) {
                    <option [value]="g.id">{{ g.name }} ({{ g.code }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Adjustment Reason <span class="required">*</span></label>
                <select [(ngModel)]="formData.reason" class="form-control">
                  <option value="CORRECTION">Audit Correction / Discrepancy</option>
                  <option value="DAMAGE">Damaged Goods</option>
                  <option value="SHRINKAGE">Shrinkage / Loss / Theft</option>
                  <option value="EXPIRATION">Expired Stock</option>
                  <option value="SCRAP">Written Off to Scrap</option>
                  <option value="FOUND_SURPLUS">Found Surplus</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div class="form-group">
                <label>Voucher / Document No</label>
                <input type="text" [(ngModel)]="formData.voucherNo" placeholder="Auto-generated if blank" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Narration / Remarks</label>
                <textarea [(ngModel)]="formData.notes" rows="2" placeholder="Provide notes or authorization references..." class="form-control"></textarea>
              </div>
            </div>
          </div>

          <!-- LINE ITEMS -->
          <div class="zeno-card">
            <div class="items-header">
              <h3 class="card-section-title mb-0">Items to Adjust</h3>
              <button class="btn-sm btn-secondary" (click)="addLineItem()">
                <i class="pi pi-plus"></i> Add Line
              </button>
            </div>

            <table class="zeno-table line-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="width: 280px;">Item / Product <span class="required">*</span></th>
                  <th style="width: 140px;">Direction <span class="required">*</span></th>
                  <th style="width: 120px;">Available Stock</th>
                  <th style="width: 130px;" class="text-right">Qty <span class="required">*</span></th>
                  <th style="width: 130px;" class="text-right">Rate (₹)</th>
                  <th style="width: 140px;" class="text-right">Amount (₹)</th>
                  <th style="width: 180px;">Reason / Note</th>
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
                      <select [(ngModel)]="line.adjustmentType" class="form-control direction-select" [class.type-in]="line.adjustmentType === 'INCREASE'" [class.type-out]="line.adjustmentType === 'DECREASE'">
                        <option value="INCREASE">+ INCREASE (In)</option>
                        <option value="DECREASE">- DECREASE (Out)</option>
                      </select>
                    </td>
                    <td>
                      <span class="stock-pill" [class.low-stock]="line.adjustmentType === 'DECREASE' && (line.availableStock || 0) < line.qty">
                        {{ (line.availableStock || 0) | number:'1.0-3' }}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.001"
                        step="1"
                        [(ngModel)]="line.qty"
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
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="line.reason"
                        placeholder="Line note..."
                        class="form-control"
                      />
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
            <div class="adjustment-totals-bar">
              <div class="totals-left">
                <span>Total Lines: <strong>{{ formData.items.length }}</strong></span>
              </div>
              <div class="totals-right">
                <div class="total-block">
                  <span class="label">Total Adjusted Qty:</span>
                  <span class="value">{{ calculateTotalQty() | number:'1.0-3' }}</span>
                </div>
                <div class="total-block highlight">
                  <span class="label">Total Amount:</span>
                  <span class="value">₹{{ calculateTotalAmount() | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- DETAIL MODAL -->
      @if (selectedAdjustment) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Adjustment Details - {{ selectedAdjustment.voucherNo }}</h3>
              <button class="btn-close" (click)="selectedAdjustment = null">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div><span class="label">Date:</span> <strong>{{ selectedAdjustment.adjustmentDate }}</strong></div>
                <div><span class="label">Warehouse:</span> <strong>{{ selectedAdjustment.godown?.name }}</strong></div>
                <div><span class="label">Reason:</span> <span class="reason-pill">{{ selectedAdjustment.reason }}</span></div>
                <div><span class="label">Status:</span> <span class="status-badge" [class.status-completed]="selectedAdjustment.status === 'COMPLETED'">{{ selectedAdjustment.status }}</span></div>
                @if (selectedAdjustment.notes) {
                  <div class="full-width"><span class="label">Notes:</span> {{ selectedAdjustment.notes }}</div>
                }
              </div>

              <h4 class="mt-4 mb-2 font-semibold">Adjusted Items</h4>
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (it of selectedAdjustment.items; track it.id) {
                    <tr>
                      <td>{{ it.item?.name }} ({{ it.item?.sku }})</td>
                      <td>
                        <span class="direction-badge" [class.type-in]="it.adjustmentType === 'INCREASE'" [class.type-out]="it.adjustmentType === 'DECREASE'">
                          {{ it.adjustmentType }}
                        </span>
                      </td>
                      <td class="text-right font-medium">{{ it.qty | number:'1.0-3' }} {{ it.item?.unit?.code }}</td>
                      <td class="text-right">₹{{ it.unitRate | number:'1.2-4' }}</td>
                      <td class="text-right font-semibold">₹{{ it.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedAdjustment = null">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventory-page { padding: 0; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { font-size: 1.5rem; font-weight: 700; color: var(--surface-900); margin: 0; }
      .subtitle { font-size: 0.875rem; color: var(--surface-500); margin: 4px 0 0 0; }
    }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
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
      &:hover { background: var(--surface-100); }
    }
    .header-actions { display: flex; gap: 10px; }
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
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--surface-500); }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--surface-900); }
    .zeno-card {
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-section-title { font-size: 1.05rem; font-weight: 700; color: var(--surface-800); margin: 0 0 16px 0; }
    .table-toolbar { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .toolbar-search {
      position: relative;
      flex: 1;
      max-width: 460px;
      .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); }
      input { width: 100%; padding: 9px 12px 9px 36px; border: 1px solid var(--surface-300); border-radius: var(--radius-sm); font-size: 0.875rem; outline: none; }
    }
    .toolbar-filters { display: flex; gap: 10px; }
    .zeno-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      th { background: var(--surface-50); padding: 10px 14px; font-weight: 600; color: var(--surface-600); border-bottom: 1px solid var(--surface-200); text-align: left; }
      td { padding: 12px 14px; border-bottom: 1px solid var(--surface-100); color: var(--surface-800); }
      tr:hover td { background: var(--surface-50); }
    }
    .badge-voucher { font-weight: 700; color: var(--primary-700); cursor: pointer; &:hover { text-decoration: underline; } }
    .warehouse-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .reason-pill {
      display: inline-block;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
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
    .direction-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      &.type-in { background: #dcfce7; color: #15803d; }
      &.type-out { background: #fee2e2; color: #b91c1c; }
    }
    .direction-select {
      font-weight: 600;
      &.type-in { color: #15803d; }
      &.type-out { color: #b91c1c; }
    }
    .action-buttons { display: flex; justify-content: flex-end; gap: 6px; }
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
    .btn-sm { padding: 6px 12px; font-size: 0.8125rem; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
      &.full-width { grid-column: 1 / -1; }
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
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .stock-pill {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      &.low-stock { background: #fee2e2; color: #b91c1c; }
    }
    .adjustment-totals-bar {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .totals-right { display: flex; gap: 24px; align-items: center; }
    .total-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      .label { font-size: 0.75rem; color: var(--surface-500); font-weight: 600; }
      .value { font-size: 1.125rem; font-weight: 700; color: var(--surface-800); }
      &.highlight .value { color: var(--primary-600); font-size: 1.25rem; }
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
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-dialog {
      background: #ffffff; border-radius: var(--radius-md); width: 90%; max-width: 750px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .modal-header {
      padding: 16px 20px; border-bottom: 1px solid var(--surface-200); display: flex; justify-content: space-between; align-items: center;
      h3 { margin: 0; font-size: 1.125rem; }
    }
    .modal-body { padding: 20px; overflow-y: auto; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid var(--surface-200); display: flex; justify-content: flex-end; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.875rem; .label { color: var(--surface-500); margin-right: 6px; } }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-muted { color: var(--surface-500); }
    .text-primary { color: var(--primary-600); }
  `],
})
export class StockAdjustmentComponent implements OnInit {
  viewMode: 'list' | 'create' = 'list';
  adjustments: any[] = [];
  filteredAdjustments: any[] = [];
  godowns: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  searchQuery = '';
  reasonFilter = 'ALL';
  statusFilter = 'ALL';
  errorMessage = '';
  selectedAdjustment: any = null;

  totalUnitsAdjusted = 0;
  totalValuationImpact = 0;

  formData = {
    adjustmentDate: new Date().toISOString().split('T')[0],
    godownId: '',
    reason: 'CORRECTION',
    voucherNo: '',
    notes: '',
    items: [] as AdjustmentLineItem[],
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
    this.inventoryService.getAdjustments(comp.id).subscribe({
      next: (res: any[]) => {
        this.adjustments = res;
        this.filterAdjustments();
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

  filterAdjustments() {
    let list = this.adjustments;
    if (this.statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === this.statusFilter);
    }
    if (this.reasonFilter !== 'ALL') {
      list = list.filter((a) => a.reason === this.reasonFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.voucherNo?.toLowerCase().includes(q) ||
          a.godown?.name?.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q),
      );
    }
    this.filteredAdjustments = list;

    this.totalUnitsAdjusted = this.adjustments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((acc, curr) => acc + Number(curr.totalQty || 0), 0);
    this.totalValuationImpact = this.adjustments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  }

  openCreatePage() {
    this.formData = {
      adjustmentDate: new Date().toISOString().split('T')[0],
      godownId: this.tenantService.currentGodown()?.id || (this.godowns[0]?.id || ''),
      reason: 'CORRECTION',
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
      adjustmentType: 'INCREASE',
      qty: 1,
      unitRate: 0,
      totalAmount: 0,
      availableStock: 0,
      reason: '',
    });
  }

  removeLineItem(index: number) {
    this.formData.items.splice(index, 1);
  }

  onGodownChange() {
    for (const line of this.formData.items) {
      if (line.itemId) {
        this.checkStock(line);
      }
    }
  }

  onItemSelect(line: AdjustmentLineItem) {
    const it = this.itemsList.find((i) => i.id === line.itemId);
    if (it) {
      line.unitRate = Number(it.purchaseRate || it.saleRate || 0);
      this.recalcLine(line);
      this.checkStock(line);
    }
  }

  checkStock(line: AdjustmentLineItem) {
    const comp = this.tenantService.currentCompany();
    if (!comp || !this.formData.godownId || !line.itemId) return;

    this.inventoryService
      .getItemBalance(comp.id, this.formData.godownId, line.itemId)
      .subscribe({
        next: (res) => {
          line.availableStock = Number(res.currentBalance || 0);
        },
      });
  }

  recalcLine(line: AdjustmentLineItem) {
    const qty = Number(line.qty || 0);
    const rate = Number(line.unitRate || 0);
    line.totalAmount = Number((qty * rate).toFixed(2));
  }

  calculateTotalQty(): number {
    return this.formData.items.reduce((acc, curr) => acc + Number(curr.qty || 0), 0);
  }

  calculateTotalAmount(): number {
    return this.formData.items.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  }

  saveAdjustment() {
    this.errorMessage = '';
    if (!this.formData.godownId) {
      this.errorMessage = 'Please select a warehouse.';
      return;
    }
    if (this.formData.items.length === 0) {
      this.errorMessage = 'Please add at least one item line to adjust.';
      return;
    }

    for (const it of this.formData.items) {
      if (!it.itemId) {
        this.errorMessage = 'Please select a product for each line.';
        return;
      }
      if (Number(it.qty) <= 0) {
        this.errorMessage = 'Adjustment quantity must be greater than zero.';
        return;
      }
      if (it.adjustmentType === 'DECREASE' && (it.availableStock || 0) < Number(it.qty)) {
        this.errorMessage = `Cannot decrease more stock than currently available (${it.availableStock} available).`;
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

    this.inventoryService.createAdjustment(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to post stock adjustment.';
      },
    });
  }

  viewDetails(a: any) {
    this.selectedAdjustment = a;
  }

  cancelAdjustment(a: any) {
    if (!confirm(`Are you sure you want to cancel adjustment ${a.voucherNo}? Stock changes will be reversed.`)) {
      return;
    }

    this.inventoryService.cancelAdjustment(a.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel adjustment');
      },
    });
  }
}
