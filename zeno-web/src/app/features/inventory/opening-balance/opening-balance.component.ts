import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';

interface OpeningItemRow {
  itemId: string;
  itemName: string;
  sku: string;
  itemGroupName: string;
  unitCode: string;
  openingQty: number;
  unitRate: number;
  totalValue: number;
  effectiveDate?: string;
  isModified?: boolean;
}

@Component({
  selector: 'app-opening-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <div>
          <h1>Update Opening Stock Balance</h1>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="saveOpeningBalances()" [disabled]="submitting || loading">
            <i class="pi pi-check"></i> {{ submitting ? 'Updating...' : 'Save Opening Balances' }}
          </button>
        </div>
      </div>

      <!-- FILTER & SETTINGS BAR -->
      <div class="zeno-card mb-4">
        <div class="settings-bar">
          <div class="form-group">
            <label>Select Warehouse / Godown <span class="required">*</span></label>
            <select [(ngModel)]="selectedGodownId" (change)="loadOpeningBalances()" class="form-control" style="min-width: 250px;">
              <option value="">-- Choose Warehouse --</option>
              @for (g of godowns; track g.id) {
                <option [value]="g.id">{{ g.name }} ({{ g.code }})</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Effective Date (As On) <span class="required">*</span></label>
            <input
              type="date"
              [(ngModel)]="effectiveDate"
              class="form-control"
              style="width: 180px;"
            />
          </div>

          <div class="kpi-mini-group ml-auto">
            <div class="mini-kpi">
              <span class="label">Configured Items</span>
              <span class="val">{{ configuredCount }} / {{ items.length }}</span>
            </div>
            <div class="mini-kpi">
              <span class="label">Total Opening Qty</span>
              <span class="val">{{ totalQty | number:'1.0-3' }}</span>
            </div>
            <div class="mini-kpi highlight">
              <span class="label">Opening Valuation</span>
              <span class="val">₹{{ totalValuation | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      @if (saveSuccessMessage) {
        <div class="alert-success mb-4">
          <i class="pi pi-check-circle"></i>
          <span>{{ saveSuccessMessage }}</span>
        </div>
      }

      @if (errorMessage) {
        <div class="alert-danger mb-4">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ errorMessage }}</span>
        </div>
      }

      <!-- INVENTORY GRID -->
      <div class="zeno-card">
        <div class="table-toolbar">
          <div class="toolbar-search">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="filterItems()"
            />
          </div>
          <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="groupFilter" (change)="filterItems()" class="filter-select" style="min-width: 170px;">
              <option value="ALL">All Stock Groups</option>
              @for (grp of stockGroups; track grp) {
                <option [value]="grp">{{ grp }}</option>
              }
            </select>
            <select [(ngModel)]="configuredOnly" (change)="filterItems()" class="filter-select" style="min-width: 160px;">
              <option value="ALL">All Products</option>
              <option value="WITH_STOCK">With Opening Stock</option>
              <option value="ZERO_STOCK">Zero Opening Stock</option>
            </select>
            <button class="btn-export" (click)="exportOpeningBalances()" [disabled]="filteredItems.length === 0" title="Export to CSV">
              <i class="pi pi-download"></i> Export
            </button>
          </div>
        </div>

        <table class="zeno-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Product / SKU</th>
              <th style="width: 180px;">Stock Group</th>
              <th style="width: 80px;">Unit</th>
              <th class="text-right" style="width: 180px;">Opening Quantity</th>
              <th class="text-right" style="width: 180px;">Valuation Rate (₹)</th>
              <th class="text-right" style="width: 200px;">Total Opening Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="7" class="text-center py-5">
                  <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-600);"></i>
                  <p class="mt-2 text-muted">Loading opening stock balances...</p>
                </td>
              </tr>
            } @else if (!selectedGodownId) {
              <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="pi pi-warehouse" style="font-size: 2rem; color: var(--surface-400);"></i>
                  <p class="mt-2">Please select a warehouse from above to view and update opening stock.</p>
                </td>
              </tr>
            } @else if (filteredItems.length === 0) {
              <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="pi pi-folder-open" style="font-size: 2rem; color: var(--surface-400);"></i>
                  <p class="mt-2">No matching items found for the selected filter.</p>
                </td>
              </tr>
            } @else {
              @for (item of filteredItems; track item.itemId; let idx = $index) {
                <tr [class.modified-row]="item.isModified">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <div class="item-name-block">
                      <span class="font-semibold">{{ item.itemName }}</span>
                      <span class="item-sku">{{ item.sku || 'No SKU' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="group-pill">{{ item.itemGroupName }}</span>
                  </td>
                  <td>
                    <span class="unit-pill">{{ item.unitCode }}</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      [(ngModel)]="item.openingQty"
                      (input)="onLineChange(item)"
                      class="form-control text-right"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      [(ngModel)]="item.unitRate"
                      (input)="onLineChange(item)"
                      class="form-control text-right"
                    />
                  </td>
                  <td class="text-right font-bold" [class.text-primary]="item.totalValue > 0">
                    ₹{{ item.totalValue | number:'1.2-2' }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <!-- FOOTER SUMMARY -->
        <div class="opening-totals-bar">
          <div class="totals-left">
            <span>Showing <strong>{{ filteredItems.length }}</strong> of <strong>{{ items.length }}</strong> items</span>
          </div>
          <div class="totals-right">
            <div class="total-block">
              <span class="label">Total Opening Units:</span>
              <span class="value">{{ totalQty | number:'1.0-3' }}</span>
            </div>
            <div class="total-block highlight">
              <span class="label">Total Opening Value:</span>
              <span class="value">₹{{ totalValuation | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './opening-balance.component.scss',
})
export class OpeningBalanceComponent implements OnInit {
  godowns: any[] = [];
  selectedGodownId = '';
  effectiveDate = '2026-04-01'; // Default beginning of Indian FY or current year

  items: OpeningItemRow[] = [];
  filteredItems: OpeningItemRow[] = [];
  stockGroups: string[] = [];

  loading = false;
  submitting = false;
  searchQuery = '';
  groupFilter = 'ALL';
  configuredOnly = 'ALL';
  errorMessage = '';
  saveSuccessMessage = '';

  configuredCount = 0;
  totalQty = 0;
  totalValuation = 0;

  constructor(
    private inventoryService: InventoryService,
    private mastersService: MastersService,
    private tenantService: TenantService,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/tenancy/godowns').subscribe({
      next: (res: any[]) => {
        this.godowns = res?.length ? res : this.tenantService.godowns();
        if (this.godowns.length > 0) {
          const current = this.tenantService.currentGodown();
          this.selectedGodownId = current?.id || this.godowns[0].id;
          this.loadOpeningBalances();
        }
      },
    });
  }

  loadOpeningBalances() {
    if (!this.selectedGodownId) {
      this.items = [];
      this.filteredItems = [];
      return;
    }

    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.loading = true;
    this.errorMessage = '';
    this.saveSuccessMessage = '';

    this.inventoryService.getOpeningBalances(comp.id, this.selectedGodownId).subscribe({
      next: (res) => {
        this.items = res.map((r: any) => ({
          itemId: r.itemId,
          itemName: r.itemName,
          sku: r.sku,
          itemGroupName: r.itemGroupName || 'General',
          unitCode: r.unitCode || 'NOS',
          openingQty: Number(r.openingQty || 0),
          unitRate: Number(r.unitRate || 0),
          totalValue: Number(r.totalValue || 0),
          effectiveDate: r.effectiveDate,
          isModified: false,
        }));

        // Set effective date from first record if exists
        const withDate = this.items.find((i) => i.effectiveDate);
        if (withDate && withDate.effectiveDate) {
          this.effectiveDate = withDate.effectiveDate;
        }

        // Distinct stock groups
        this.stockGroups = Array.from(new Set(this.items.map((i) => i.itemGroupName)));

        this.filterItems();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load opening balances';
      },
    });
  }

  filterItems() {
    let list = this.items;

    if (this.groupFilter !== 'ALL') {
      list = list.filter((i) => i.itemGroupName === this.groupFilter);
    }

    if (this.configuredOnly === 'WITH_STOCK') {
      list = list.filter((i) => i.openingQty > 0);
    } else if (this.configuredOnly === 'ZERO_STOCK') {
      list = list.filter((i) => i.openingQty === 0);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.itemGroupName.toLowerCase().includes(q),
      );
    }

    this.filteredItems = list;
    this.recalcTotals();
  }

  onLineChange(item: OpeningItemRow) {
    const qty = Number(item.openingQty || 0);
    const rate = Number(item.unitRate || 0);
    item.totalValue = Number((qty * rate).toFixed(2));
    item.isModified = true;
    this.recalcTotals();
  }

  recalcTotals() {
    this.configuredCount = this.items.filter((i) => i.openingQty > 0).length;
    this.totalQty = this.items.reduce((acc, curr) => acc + Number(curr.openingQty || 0), 0);
    this.totalValuation = this.items.reduce((acc, curr) => acc + Number(curr.totalValue || 0), 0);
  }

  saveOpeningBalances() {
    if (!this.selectedGodownId) {
      alert('Please select a warehouse');
      return;
    }
    if (!this.effectiveDate) {
      alert('Please set an effective date');
      return;
    }

    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.submitting = true;
    this.errorMessage = '';
    this.saveSuccessMessage = '';

    const payload = {
      companyId: comp.id,
      godownId: this.selectedGodownId,
      effectiveDate: this.effectiveDate,
      items: this.items.map((it) => ({
        itemId: it.itemId,
        openingQty: Number(it.openingQty || 0),
        unitRate: Number(it.unitRate || 0),
      })),
    };

    this.inventoryService.updateOpeningBalances(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.saveSuccessMessage = 'Opening balances updated and committed to stock ledger successfully!';
        this.toast.success(
          `Opening balances saved! ${this.configuredCount} products updated with total valuation ₹${Number(this.totalValuation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'Opening Balances Saved',
        );
        this.loadOpeningBalances();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to save opening balances';
        this.toast.error(this.errorMessage, 'Save Failed');
      },
    });
  }

  exportOpeningBalances() {
    if (!this.filteredItems || this.filteredItems.length === 0) return;
    const headers = ['Product Name', 'SKU', 'Stock Group', 'Unit', 'Opening Qty', 'Unit Rate', 'Total Value'];
    const rows = this.filteredItems.map((item) => [
      item.itemName || '',
      item.sku || '',
      item.itemGroupName || '',
      item.unitCode || '',
      item.openingQty || 0,
      item.unitRate || 0,
      item.totalValue || 0
    ]);
    exportToCsv('Opening_Stock_Balances', headers, rows);
    this.toast.success('Opening stock balances exported successfully!', 'Export Complete');
  }
}
