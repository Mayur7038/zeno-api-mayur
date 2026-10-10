import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';

interface PriceListLineItem {
  id?: string;
  itemId: string;
  itemName?: string;
  sku?: string;
  purchasePrice: number;
  standardRate: number;
  pricingMode: 'MARKUP' | 'MARKDOWN' | 'DIRECT';
  adjustmentPercentage: number;
  customRate: number;
  discountPercentage?: number;
  minSellingPrice?: number;
  notes?: string;
}

@Component({
  selector: 'app-price-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      @if (viewMode === 'list') {
        <div class="page-header">
          <div>
            <h1>Price Lists & Rule Engine</h1>
          </div>
          <div class="header-actions">
            <button class="tab-btn tab-simulator" [class.active]="selectedTab === 'SIMULATOR'" (click)="setTab(selectedTab === 'SIMULATOR' ? 'ALL' : 'SIMULATOR')">
              <i class="pi pi-calculator"></i> {{ selectedTab === 'SIMULATOR' ? 'Back to Rules' : 'Price Simulator' }}
            </button>
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Price List
            </button>
          </div>
        </div>

        @if (selectedTab !== 'SIMULATOR') {
          <!-- TABLE TOOLBAR -->
          <div class="zeno-card">
            <div class="table-toolbar">
              <div class="toolbar-search">
                <i class="pi pi-search search-icon"></i>
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="filterPriceLists()"
                  placeholder="Search price lists..."
                />
              </div>
              <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
                <select [(ngModel)]="selectedTab" (change)="setTab(selectedTab)" class="filter-select" style="min-width: 190px;">
                  <option value="ALL">All Dimensions ({{ priceLists.length }})</option>
                  <option value="STOCK_GROUP_WISE">Stock Group Wise ({{ groupRulesCount }})</option>
                  <option value="CUSTOMER_WISE">Customer Wise ({{ customerRulesCount }})</option>
                  <option value="PRODUCT_WISE">Product Wise ({{ productRulesCount }})</option>
                </select>
                <select [(ngModel)]="activeFilter" (change)="filterPriceLists()" class="filter-select" style="min-width: 140px;">
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <button class="btn-export" (click)="exportPriceLists()" [disabled]="filteredPriceLists.length === 0" title="Export to CSV">
                  <i class="pi pi-download"></i> Export
                </button>
              </div>
            </div>

            <!-- PRICE LISTS TABLE -->
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Price List Name</th>
                  <th>Dimension</th>
                  <th>Effective From</th>
                  <th class="text-right">Items Count</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading) {
                  <tr>
                    <td colspan="6" class="text-center py-5">
                      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-600);"></i>
                      <p class="mt-2 text-muted">Loading price lists...</p>
                    </td>
                  </tr>
                } @else if (filteredPriceLists.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                      <i class="pi pi-folder-open" style="font-size: 2rem; color: var(--surface-400);"></i>
                      <p class="mt-2">No price lists found for this criteria. Click <strong>New Price List</strong> to create one.</p>
                    </td>
                  </tr>
                } @else {
                  @for (pl of filteredPriceLists; track pl.id) {
                    <tr>
                      <td>
                        <span class="font-semibold text-primary clickable" (click)="openEditPage(pl)">
                          {{ pl.name }}
                        </span>
                      </td>
                      <td>
                        <span class="dimension-badge" [class.badge-group]="pl.pricingType === 'STOCK_GROUP_WISE'" [class.badge-customer]="pl.pricingType === 'CUSTOMER_WISE'" [class.badge-product]="pl.pricingType === 'PRODUCT_WISE'">
                          {{ formatDimension(pl.pricingType) }}
                        </span>
                      </td>
                      <td>{{ pl.effectiveFrom }}</td>
                      <td class="text-right font-medium">{{ pl.items?.length || 0 }}</td>
                      <td>
                        <span class="status-badge" [class.status-active]="pl.isActive" [class.status-inactive]="!pl.isActive">
                          {{ pl.isActive ? 'ACTIVE' : 'INACTIVE' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <div class="action-buttons">
                          <button class="btn-icon" (click)="openEditPage(pl)" title="Edit Price List">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button class="btn-icon text-danger" (click)="deletePriceList(pl)" title="Delete Price List">
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        } @else {
          <!-- PRICE LOOKUP SIMULATOR -->
          <div class="zeno-card">
            <div class="simulator-header">
              <h3><i class="pi pi-calculator"></i> Real-time Effective Price Resolution Simulator</h3>
            </div>

            <div class="form-grid mb-4">
              <div class="form-group">
                <label>Select Product / Item <span class="required">*</span></label>
                <select [(ngModel)]="simItemId" (change)="runSimulation()" class="form-control">
                  <option value="">-- Choose Product --</option>
                  @for (it of itemsList; track it.id) {
                    <option [value]="it.id">{{ it.name }} (Base: ₹{{ it.saleRate }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Select Customer (Optional)</label>
                <select [(ngModel)]="simCustomerId" (change)="runSimulation()" class="form-control">
                  <option value="">-- Standard Retail / No Specific Customer --</option>
                  @for (c of customersList; track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>As Of Date</label>
                <input type="date" [(ngModel)]="simDate" (change)="runSimulation()" class="form-control" />
              </div>
            </div>

            @if (simResult) {
              <div class="sim-result-card">
                <div class="result-badge-row">
                  <span class="rule-badge">Rule Applied: <strong>{{ simResult.ruleApplied }}</strong></span>
                  <span class="source-badge">Source: <strong>{{ simResult.priceListName }}</strong></span>
                </div>
                <div class="result-numbers-grid">
                  <div class="num-box">
                    <span class="num-label">Standard Base Rate</span>
                    <span class="num-val">₹{{ simResult.standardRate | number:'1.2-2' }}</span>
                  </div>
                  <div class="num-box">
                    <span class="num-label">Applied Discount</span>
                    <span class="num-val text-success">{{ simResult.discountPercentage }}%</span>
                  </div>
                  <div class="num-box highlight">
                    <span class="num-label">Final Effective Selling Price</span>
                    <span class="num-val text-primary">₹{{ simResult.finalPrice | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <!-- CREATE / EDIT PRICE LIST PAGE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="viewMode = 'list'">
              <i class="pi pi-arrow-left"></i>
            </button>
            <div>
              <h1>{{ editId ? 'Edit Price List' : 'New Price List' }}</h1>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="viewMode = 'list'">Cancel</button>
            <button class="btn-primary" (click)="savePriceList()" [disabled]="submitting">
              <i class="pi pi-check"></i> {{ submitting ? 'Saving...' : 'Save Price List' }}
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
          <!-- SINGLE UNIFIED CARD -->
          <div class="zeno-card">
            <!-- 4 FORM GRID FIELDS -->
            <div class="form-grid-4 mb-4">
              <div class="form-group">
                <label>Pricing Dimension <span class="required">*</span></label>
                <select [(ngModel)]="formData.pricingType" (change)="onDimensionChange()" class="form-control">
                  <option value="STOCK_GROUP_WISE">Stock Group Wise</option>
                  <option value="CUSTOMER_WISE">Customer Wise</option>
                  <option value="PRODUCT_WISE">Product Wise</option>
                </select>
              </div>

              <div class="form-group">
                <label>Price List Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.name" class="form-control" placeholder="Enter price list name" />
              </div>

              <div class="form-group">
                <label>Effective From Date <span class="required">*</span></label>
                <input type="date" [(ngModel)]="formData.effectiveFrom" class="form-control" />
              </div>

              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="formData.isActive" class="form-control">
                  <option [ngValue]="true">Active</option>
                  <option [ngValue]="false">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <!-- JUSTIFIED TOOLBAR CONTROLS -->
            <div class="items-header-bar mb-3">
              <div class="search-box">
                <i class="pi pi-search search-icon"></i>
                <input
                  type="text"
                  [(ngModel)]="itemSearchQuery"
                  placeholder="Search product name or SKU..."
                  class="form-control search-input"
                />
              </div>

              <div class="items-right-controls">
                <span class="items-count-chip">{{ formData.items.length }} Items</span>

                <div class="bulk-adjust-bar">
                  <select [(ngModel)]="globalMode" class="form-control mode-select">
                    <option value="MARKUP">Markup (+)</option>
                    <option value="MARKDOWN">Markdown (-)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    [(ngModel)]="globalPercentage"
                    placeholder="%"
                    class="form-control pct-input"
                  />
                  <button class="btn-secondary btn-sm" (click)="applyGlobalAdjustment()" title="Apply percentage to all products">
                    Apply to All
                  </button>
                </div>

                <button class="btn-sm btn-secondary" (click)="addLineItem()">
                  <i class="pi pi-plus"></i> Add Line
                </button>
              </div>
            </div>

            <!-- PRODUCTS TABLE -->
            <table class="zeno-table line-items-table mt-4 mb-4">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Product / Item <span class="required">*</span></th>
                  <th class="text-right" style="width: 150px;">Purchase Price (₹)</th>
                  <th class="text-right" style="width: 150px;">Std Sale Rate (₹)</th>
                  <th style="width: 160px;">Adjustment</th>
                  <th class="text-right" style="width: 130px;">Rate / %</th>
                  <th class="text-right" style="width: 170px;">Final Selling Price (₹)</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                @if (getFilteredLineItems().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                      No matching product items found.
                    </td>
                  </tr>
                } @else {
                  @for (line of getFilteredLineItems(); track line.itemId || $index) {
                    <tr>
                      <td>{{ $index + 1 }}</td>
                      <td>
                        <div class="product-info-cell">
                          <span class="product-name font-semibold">{{ getItemName(line) }}</span>
                          @if (getItemSku(line)) {
                            <span class="product-sku text-muted">SKU: {{ getItemSku(line) }}</span>
                          }
                        </div>
                      </td>
                      <td class="text-right font-medium text-slate-700">₹{{ (line.purchasePrice || 0) | number:'1.2-2' }}</td>
                      <td class="text-right text-muted">₹{{ (line.standardRate || 0) | number:'1.2-2' }}</td>
                      <td>
                        <select [(ngModel)]="line.pricingMode" (change)="onAdjustmentChange(line)" class="form-control select-sm">
                          <option value="MARKUP">Markup (+)</option>
                          <option value="MARKDOWN">Markdown (-)</option>
                          <option value="DIRECT">Fixed Price</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          [(ngModel)]="line.adjustmentPercentage"
                          (input)="onAdjustmentChange(line)"
                          [disabled]="line.pricingMode === 'DIRECT'"
                          class="form-control text-right"
                          placeholder="0.00%"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          [(ngModel)]="line.customRate"
                          (input)="onSellingPriceChange(line)"
                          class="form-control text-right font-bold text-primary"
                        />
                      </td>
                      <td class="text-center">
                        <button class="btn-icon text-danger" (click)="removeLineItem(line)" title="Remove Product">
                          <i class="pi pi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>

            <!-- DESCRIPTION / NOTES AT BOTTOM -->
            <div class="notes-group mt-3">
              <label class="font-semibold">Description / Notes</label>
              <textarea [(ngModel)]="formData.notes" rows="2" class="form-control" placeholder="Optional notes..."></textarea>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './price-list.component.scss',
})
export class PriceListComponent implements OnInit {
  viewMode: 'list' | 'form' = 'list';
  editId: string | null = null;
  selectedTab: 'ALL' | 'STOCK_GROUP_WISE' | 'CUSTOMER_WISE' | 'PRODUCT_WISE' | 'SIMULATOR' = 'ALL';

  priceLists: any[] = [];
  filteredPriceLists: any[] = [];
  stockGroupsList: any[] = [];
  customersList: any[] = [];
  itemsList: any[] = [];

  loading = false;
  submitting = false;
  searchQuery = '';
  activeFilter = 'ALL';
  errorMessage = '';

  itemSearchQuery = '';
  globalMode: 'MARKUP' | 'MARKDOWN' = 'MARKUP';
  globalPercentage: number = 10;

  groupRulesCount = 0;
  customerRulesCount = 0;
  productRulesCount = 0;

  // Simulator
  simItemId = '';
  simCustomerId = '';
  simDate = new Date().toISOString().split('T')[0];
  simResult: any = null;

  formData = {
    name: '',
    pricingType: 'STOCK_GROUP_WISE',
    effectiveFrom: new Date().toISOString().split('T')[0],
    isActive: true,
    notes: '',
    items: [] as PriceListLineItem[],
  };

  constructor(
    private inventoryService: InventoryService,
    private mastersService: MastersService,
    private tenantService: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.loading = true;
    this.inventoryService.getPriceLists(comp.id).subscribe({
      next: (res) => {
        this.priceLists = res;
        this.filterPriceLists();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    this.mastersService.getItemGroups(comp.id).subscribe({
      next: (res) => {
        this.stockGroupsList = res;
      },
    });

    this.mastersService.getLedgers(comp.id, false, true).subscribe({
      next: (res) => {
        this.customersList = res;
      },
    });

    this.mastersService.getItems(comp.id).subscribe({
      next: (res) => {
        this.itemsList = res;
        if (this.viewMode === 'form' && (!this.formData.items || this.formData.items.length === 0)) {
          this.loadItemsForDimension();
        }
      },
    });
  }

  setTab(tab: any) {
    this.selectedTab = tab;
    this.filterPriceLists();
  }

  filterPriceLists() {
    let list = this.priceLists;

    if (this.selectedTab !== 'ALL' && this.selectedTab !== 'SIMULATOR') {
      list = list.filter((pl) => pl.pricingType === this.selectedTab);
    }

    if (this.activeFilter === 'ACTIVE') {
      list = list.filter((pl) => pl.isActive);
    } else if (this.activeFilter === 'INACTIVE') {
      list = list.filter((pl) => !pl.isActive);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((pl) => pl.name?.toLowerCase().includes(q));
    }

    this.filteredPriceLists = list;

    this.groupRulesCount = this.priceLists.filter(
      (pl) => pl.pricingType === 'STOCK_GROUP_WISE',
    ).length;
    this.customerRulesCount = this.priceLists.filter(
      (pl) => pl.pricingType === 'CUSTOMER_WISE',
    ).length;
    this.productRulesCount = this.priceLists.filter(
      (pl) => pl.pricingType === 'PRODUCT_WISE',
    ).length;
  }

  formatDimension(type: string): string {
    switch (type) {
      case 'STOCK_GROUP_WISE':
        return 'Stock Group Wise';
      case 'CUSTOMER_WISE':
        return 'Customer Wise';
      case 'PRODUCT_WISE':
        return 'Product Wise';
      default:
        return type;
    }
  }

  exportPriceLists() {
    if (!this.filteredPriceLists || this.filteredPriceLists.length === 0) return;
    const headers = ['Price List Name', 'Dimension', 'Effective From', 'Items Count', 'Status'];
    const rows = this.filteredPriceLists.map((pl) => [
      pl.name || '',
      this.formatDimension(pl.pricingType) || '',
      pl.effectiveFrom || '',
      pl.items?.length || 0,
      pl.isActive ? 'Active' : 'Inactive',
    ]);
    exportToCsv('Price_Lists', headers, rows);
    this.toast.success('Price lists exported successfully!', 'Export Complete');
  }

  openCreatePage() {
    this.editId = null;
    this.errorMessage = '';
    this.itemSearchQuery = '';
    this.formData = {
      name: '',
      pricingType:
        this.selectedTab !== 'ALL' && this.selectedTab !== 'SIMULATOR'
          ? this.selectedTab
          : 'STOCK_GROUP_WISE',
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      notes: '',
      items: [],
    };
    this.viewMode = 'form';
    this.loadItemsForDimension();
  }

  openEditPage(pl: any) {
    this.editId = pl.id;
    this.errorMessage = '';
    this.itemSearchQuery = '';
    this.formData = {
      name: pl.name,
      pricingType: pl.pricingType,
      effectiveFrom: pl.effectiveFrom,
      isActive: Boolean(pl.isActive),
      notes: pl.notes || '',
      items: (pl.items || []).map((it: any) => {
        const matchingItem = this.itemsList.find((i) => i.id === it.itemId);
        const pPrice = Number(it.purchasePrice || matchingItem?.purchaseRate || matchingItem?.costRate || 0);
        const cRate = Number(it.customRate || it.standardRate || 0);
        let mode: 'MARKUP' | 'MARKDOWN' | 'DIRECT' = it.pricingMode || 'MARKUP';
        let adjPct = Number(it.adjustmentPercentage || 0);
        if (!it.pricingMode && pPrice > 0) {
          if (cRate >= pPrice) {
            mode = 'MARKUP';
            adjPct = Number((((cRate - pPrice) / pPrice) * 100).toFixed(2));
          } else {
            mode = 'MARKDOWN';
            adjPct = Number((((pPrice - cRate) / pPrice) * 100).toFixed(2));
          }
        }
        return {
          id: it.id,
          itemId: it.itemId,
          itemName: matchingItem?.name || it.itemName || '',
          sku: matchingItem?.sku || it.sku || '',
          purchasePrice: pPrice,
          standardRate: Number(it.standardRate || matchingItem?.saleRate || 0),
          pricingMode: mode,
          adjustmentPercentage: adjPct,
          customRate: cRate,
        };
      }),
    };
    if (this.formData.items.length === 0) {
      this.loadItemsForDimension();
    }
    this.viewMode = 'form';
  }

  onDimensionChange() {
    this.loadItemsForDimension();
  }

  loadItemsForDimension() {
    if (!this.itemsList || this.itemsList.length === 0) return;

    this.formData.items = this.itemsList.map((item) => {
      const pPrice = Number(item.purchaseRate || item.costRate || item.saleRate || 0);
      const sRate = Number(item.saleRate || pPrice || 0);
      return {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku || '',
        purchasePrice: pPrice,
        standardRate: sRate,
        pricingMode: 'MARKUP',
        adjustmentPercentage: 0,
        customRate: sRate > 0 ? sRate : pPrice,
      };
    });
  }

  getFilteredLineItems(): PriceListLineItem[] {
    if (!this.itemSearchQuery.trim()) {
      return this.formData.items;
    }
    const q = this.itemSearchQuery.toLowerCase();
    return this.formData.items.filter(
      (line) =>
        this.getItemName(line).toLowerCase().includes(q) ||
        this.getItemSku(line).toLowerCase().includes(q),
    );
  }

  getItemName(line: PriceListLineItem): string {
    if (line.itemName) return line.itemName;
    const it = this.itemsList.find((i) => i.id === line.itemId);
    return it ? it.name : 'Product Item';
  }

  getItemSku(line: PriceListLineItem): string {
    if (line.sku) return line.sku;
    const it = this.itemsList.find((i) => i.id === line.itemId);
    return it?.sku || '';
  }

  applyGlobalAdjustment() {
    const pct = Number(this.globalPercentage || 0);
    this.formData.items.forEach((line) => {
      line.pricingMode = this.globalMode;
      line.adjustmentPercentage = pct;
      this.onAdjustmentChange(line);
    });
    this.toast.success(
      `Applied ${pct}% ${this.globalMode} to all loaded items!`,
      'Bulk Update Applied',
    );
  }

  onAdjustmentChange(line: PriceListLineItem) {
    const base = Number(line.purchasePrice || line.standardRate || 0);
    const pct = Number(line.adjustmentPercentage || 0);
    if (line.pricingMode === 'MARKUP') {
      line.customRate = Number((base + (base * pct) / 100).toFixed(2));
    } else if (line.pricingMode === 'MARKDOWN') {
      line.customRate = Number((base - (base * pct) / 100).toFixed(2));
    }
  }

  onSellingPriceChange(line: PriceListLineItem) {
    const base = Number(line.purchasePrice || line.standardRate || 0);
    const custom = Number(line.customRate || 0);
    if (base > 0) {
      if (custom >= base) {
        line.pricingMode = 'MARKUP';
        line.adjustmentPercentage = Number((((custom - base) / base) * 100).toFixed(2));
      } else {
        line.pricingMode = 'MARKDOWN';
        line.adjustmentPercentage = Number((((base - custom) / base) * 100).toFixed(2));
      }
    }
  }

  addLineItem() {
    this.formData.items.unshift({
      itemId: '',
      purchasePrice: 0,
      standardRate: 0,
      pricingMode: 'MARKUP',
      adjustmentPercentage: 0,
      customRate: 0,
    });
  }

  removeLineItem(line: PriceListLineItem) {
    const idx = this.formData.items.indexOf(line);
    if (idx !== -1) {
      this.formData.items.splice(idx, 1);
    }
  }

  savePriceList() {
    this.errorMessage = '';
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please provide a Price List Name.';
      return;
    }
    if (!this.formData.effectiveFrom) {
      this.errorMessage = 'Please set an Effective From date.';
      return;
    }
    if (!this.formData.items || this.formData.items.length === 0) {
      this.errorMessage = 'No product items loaded in this price list.';
      return;
    }

    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.submitting = true;
    const payload = {
      ...this.formData,
      companyId: comp.id,
    };

    const request$ = this.editId
      ? this.inventoryService.updatePriceList(this.editId, payload)
      : this.inventoryService.createPriceList(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success(
          `Price List "${this.formData.name}" ${this.editId ? 'updated' : 'created'} successfully!`,
          'Price List Saved',
        );
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to save price list.';
        this.toast.error(this.errorMessage, 'Save Failed');
      },
    });
  }

  deletePriceList(pl: any) {
    if (!confirm(`Are you sure you want to delete price list "${pl.name}"?`)) {
      return;
    }

    this.inventoryService.deletePriceList(pl.id).subscribe({
      next: () => {
        this.toast.success(`Price list "${pl.name}" deleted successfully.`, 'Price List Deleted');
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to delete price list';
        this.toast.error(msg, 'Deletion Failed');
        alert(msg);
      },
    });
  }

  runSimulation() {
    if (!this.simItemId) {
      this.simResult = null;
      return;
    }

    const comp = this.tenantService.currentCompany();
    if (!comp) return;

    this.inventoryService
      .getEffectivePrice(comp.id, this.simItemId, this.simCustomerId || undefined, this.simDate)
      .subscribe({
        next: (res: any) => {
          this.simResult = res;
        },
      });
  }
}
