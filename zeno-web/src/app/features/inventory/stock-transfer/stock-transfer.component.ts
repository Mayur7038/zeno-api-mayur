import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';

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
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Stock Transfer
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
                (input)="filterTransfers()"
              />
            </div>
            <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
              <select [(ngModel)]="statusFilter" (change)="filterTransfers()" class="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button class="btn-export" (click)="exportTransfers()" [disabled]="filteredTransfers.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
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
                <input type="text" [(ngModel)]="formData.voucherNo" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Transfer Remarks / Vehicle / Narration</label>
                <textarea [(ngModel)]="formData.notes" rows="2" class="form-control"></textarea>
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
  styleUrl: './stock-transfer.component.scss',
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
    private toast: ToastService,
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

  exportTransfers() {
    if (!this.filteredTransfers || this.filteredTransfers.length === 0) return;
    const headers = ['Voucher No', 'Date', 'Source Warehouse', 'Destination Warehouse', 'Items Count', 'Total Qty', 'Total Value', 'Status'];
    const rows = this.filteredTransfers.map((t) => [
      t.voucherNo || '',
      t.transferDate || '',
      t.sourceGodown?.name || '',
      t.destinationGodown?.name || '',
      t.items?.length || 0,
      t.totalQty || 0,
      t.totalAmount || 0,
      t.status || ''
    ]);
    exportToCsv('Stock_Transfers', headers, rows);
    this.toast.success('Stock transfers exported successfully!', 'Export Complete');
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
      next: (res: any) => {
        this.submitting = false;
        this.toast.success(
          `Stock Transfer ${res?.voucherNo || ''} completed successfully!`,
          'Transfer Saved',
        );
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to save stock transfer.';
        this.toast.error(this.errorMessage, 'Transfer Failed');
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
        this.toast.success(`Stock Transfer ${t.voucherNo} cancelled and stock reversed.`, 'Transfer Cancelled');
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to cancel stock transfer';
        this.toast.error(msg, 'Cancellation Failed');
        alert(msg);
      },
    });
  }
}
