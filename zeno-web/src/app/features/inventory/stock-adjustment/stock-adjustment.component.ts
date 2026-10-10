import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';

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
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Stock Adjustment
            </button>
          </div>
        </div>

        <!-- TOOLBAR & FILTERS -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterAdjustments()"
              />
            </div>
            <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
              <select [(ngModel)]="reasonFilter" (change)="filterAdjustments()" class="filter-select" style="min-width: 150px;">
                <option value="ALL">All Reasons</option>
                <option value="DAMAGE">Damage</option>
                <option value="SHRINKAGE">Shrinkage / Loss</option>
                <option value="EXPIRATION">Expired Goods</option>
                <option value="SCRAP">Scrap</option>
                <option value="FOUND_SURPLUS">Found Surplus</option>
                <option value="CORRECTION">Audit Correction</option>
              </select>
              <select [(ngModel)]="statusFilter" (change)="filterAdjustments()" class="filter-select" style="min-width: 140px;">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button class="btn-export" (click)="exportAdjustments()" [disabled]="filteredAdjustments.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
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
                <input type="text" [(ngModel)]="formData.voucherNo" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Narration / Remarks</label>
                <textarea [(ngModel)]="formData.notes" rows="2" class="form-control"></textarea>
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
  styleUrl: './stock-adjustment.component.scss',
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
    private toast: ToastService,
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

  exportAdjustments() {
    if (!this.filteredAdjustments || this.filteredAdjustments.length === 0) return;
    const headers = ['Voucher No', 'Date', 'Warehouse', 'Reason', 'Items Count', 'Total Qty', 'Total Amount', 'Status'];
    const rows = this.filteredAdjustments.map((a) => [
      a.voucherNo || '',
      a.adjustmentDate || '',
      a.godown?.name || '',
      a.reason || '',
      a.items?.length || 0,
      a.totalQty || 0,
      a.totalAmount || 0,
      a.status || ''
    ]);
    exportToCsv('Stock_Adjustments', headers, rows);
    this.toast.success('Stock adjustments exported successfully!', 'Export Complete');
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
      next: (res: any) => {
        this.submitting = false;
        this.toast.success(
          `Stock Adjustment ${res?.voucherNo || ''} posted successfully! Inventory reconciled.`,
          'Adjustment Saved',
        );
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to post stock adjustment.';
        this.toast.error(this.errorMessage, 'Adjustment Failed');
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
        this.toast.success(`Stock Adjustment ${a.voucherNo} cancelled and stock reversed.`, 'Adjustment Cancelled');
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to cancel adjustment';
        this.toast.error(msg, 'Cancellation Failed');
        alert(msg);
      },
    });
  }
}
