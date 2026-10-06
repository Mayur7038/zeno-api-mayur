import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { MastersService } from '../../../core/services/masters.service';
import { TenantService } from '../../../core/services/tenant.service';

interface PriceListLineItem {
  id?: string;
  itemId: string;
  variantId?: string | null;
  standardRate: number;
  customRate: number;
  discountPercentage: number;
  minSellingPrice: number;
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
            <p class="subtitle">Maintain tiered selling prices and contract discounts: Stock Group Wise, Customer Wise, and Product Wise with effective dates</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New Price List
            </button>
          </div>
        </div>

        <!-- KPI METRICS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-percentage"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Price Lists</span>
              <span class="kpi-value">{{ priceLists.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-folder"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Stock Group Rules</span>
              <span class="kpi-value">{{ groupRulesCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-users"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Customer Contract Rules</span>
              <span class="kpi-value">{{ customerRulesCount }}</span>
            </div>
          </div>
        </div>

        <!-- DIMENSION NAVIGATION TABS -->
        <div class="dimension-tabs">
          <button class="tab-btn" [class.active]="selectedTab === 'ALL'" (click)="setTab('ALL')">
            <i class="pi pi-list"></i> All Rules ({{ priceLists.length }})
          </button>
          <button class="tab-btn" [class.active]="selectedTab === 'STOCK_GROUP_WISE'" (click)="setTab('STOCK_GROUP_WISE')">
            <i class="pi pi-folder"></i> Stock Group Wise ({{ groupRulesCount }})
          </button>
          <button class="tab-btn" [class.active]="selectedTab === 'CUSTOMER_WISE'" (click)="setTab('CUSTOMER_WISE')">
            <i class="pi pi-user"></i> Customer Wise ({{ customerRulesCount }})
          </button>
          <button class="tab-btn" [class.active]="selectedTab === 'PRODUCT_WISE'" (click)="setTab('PRODUCT_WISE')">
            <i class="pi pi-tag"></i> Product Wise ({{ productRulesCount }})
          </button>
          <button class="tab-btn tab-simulator" [class.active]="selectedTab === 'SIMULATOR'" (click)="setTab('SIMULATOR')">
            <i class="pi pi-calculator"></i> Price Lookup Simulator
          </button>
        </div>

        @if (selectedTab !== 'SIMULATOR') {
          <!-- TABLE TOOLBAR -->
          <div class="zeno-card">
            <div class="table-toolbar">
              <div class="toolbar-search">
                <i class="pi pi-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search by price list name, target group, or customer..."
                  [(ngModel)]="searchQuery"
                  (input)="filterPriceLists()"
                />
              </div>
              <div class="toolbar-filters">
                <select [(ngModel)]="activeFilter" (change)="filterPriceLists()" class="form-control" style="width: 160px;">
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <!-- PRICE LISTS TABLE -->
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Price List Name</th>
                  <th>Dimension</th>
                  <th>Target (Group / Customer)</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th class="text-right">Discount %</th>
                  <th class="text-right">Margin %</th>
                  <th class="text-right">Items Count</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading) {
                  <tr>
                    <td colspan="10" class="text-center py-5">
                      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-600);"></i>
                      <p class="mt-2 text-muted">Loading price lists...</p>
                    </td>
                  </tr>
                } @else if (filteredPriceLists.length === 0) {
                  <tr>
                    <td colspan="10" class="text-center py-5 text-muted">
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
                        @if (pl.code) {
                          <span class="text-muted text-xs block">({{ pl.code }})</span>
                        }
                      </td>
                      <td>
                        <span class="dimension-badge" [class.badge-group]="pl.pricingType === 'STOCK_GROUP_WISE'" [class.badge-customer]="pl.pricingType === 'CUSTOMER_WISE'" [class.badge-product]="pl.pricingType === 'PRODUCT_WISE'">
                          {{ formatDimension(pl.pricingType) }}
                        </span>
                      </td>
                      <td>
                        @if (pl.pricingType === 'STOCK_GROUP_WISE') {
                          <span class="target-chip group">
                            <i class="pi pi-folder"></i> {{ pl.itemGroup?.name || 'All Groups' }}
                          </span>
                        } @else if (pl.pricingType === 'CUSTOMER_WISE') {
                          <span class="target-chip customer">
                            <i class="pi pi-user"></i> {{ pl.customer?.name || 'All Customers' }}
                          </span>
                        } @else {
                          <span class="target-chip product">
                            <i class="pi pi-tag"></i> {{ pl.items?.length || 0 }} Items
                          </span>
                        }
                      </td>
                      <td>{{ pl.effectiveFrom }}</td>
                      <td>{{ pl.effectiveTo || 'No Expiry' }}</td>
                      <td class="text-right font-medium">{{ pl.discountPercentage ? pl.discountPercentage + '%' : '-' }}</td>
                      <td class="text-right font-medium">{{ pl.marginPercentage ? pl.marginPercentage + '%' : '-' }}</td>
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
              <p class="subtitle">Test how pricing rules resolve across Customer Specific -> Stock Group -> Product Tier -> Standard Sale Rate</p>
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
              <p class="subtitle">Configure pricing rule with dimensional targeting and effective date validity</p>
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
          <!-- DIMENSION & HEADER CARD -->
          <div class="zeno-card mb-4">
            <h3 class="card-section-title">Pricing Dimension & Validity</h3>

            <!-- DIMENSION TYPE RADIO PILLS -->
            <div class="dimension-selector mb-4">
              <label class="dim-pill" [class.selected]="formData.pricingType === 'STOCK_GROUP_WISE'">
                <input type="radio" [(ngModel)]="formData.pricingType" value="STOCK_GROUP_WISE" />
                <i class="pi pi-folder"></i>
                <div class="dim-text">
                  <span class="dim-title">Stock Group Wise</span>
                  <span class="dim-desc">Apply price or discount across all products in a Stock Group</span>
                </div>
              </label>

              <label class="dim-pill" [class.selected]="formData.pricingType === 'CUSTOMER_WISE'">
                <input type="radio" [(ngModel)]="formData.pricingType" value="CUSTOMER_WISE" />
                <i class="pi pi-user"></i>
                <div class="dim-text">
                  <span class="dim-title">Customer Wise</span>
                  <span class="dim-desc">Special contracted pricing or tier for a specific Customer / Debtor</span>
                </div>
              </label>

              <label class="dim-pill" [class.selected]="formData.pricingType === 'PRODUCT_WISE'">
                <input type="radio" [(ngModel)]="formData.pricingType" value="PRODUCT_WISE" />
                <i class="pi pi-tag"></i>
                <div class="dim-text">
                  <span class="dim-title">Product Wise</span>
                  <span class="dim-desc">Individual custom prices or margins per item</span>
                </div>
              </label>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Price List Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.name" placeholder="e.g. Wholesale Tier 1, Summer 2026..." class="form-control" />
              </div>

              <div class="form-group">
                <label>Price List Code (Optional)</label>
                <input type="text" [(ngModel)]="formData.code" placeholder="e.g. PL-WS-01" class="form-control" />
              </div>

              <!-- DYNAMIC TARGET SELECTOR -->
              @if (formData.pricingType === 'STOCK_GROUP_WISE') {
                <div class="form-group">
                  <label>Target Stock Group <span class="required">*</span></label>
                  <select [(ngModel)]="formData.itemGroupId" class="form-control">
                    <option value="">-- Choose Stock Group --</option>
                    @for (grp of stockGroupsList; track grp.id) {
                      <option [value]="grp.id">{{ grp.name }}</option>
                    }
                  </select>
                </div>
              }

              @if (formData.pricingType === 'CUSTOMER_WISE') {
                <div class="form-group">
                  <label>Target Customer <span class="required">*</span></label>
                  <select [(ngModel)]="formData.customerId" class="form-control">
                    <option value="">-- Choose Customer --</option>
                    @for (c of customersList; track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
              }

              <div class="form-group">
                <label>Effective From Date <span class="required">*</span></label>
                <input type="date" [(ngModel)]="formData.effectiveFrom" class="form-control" />
              </div>

              <div class="form-group">
                <label>Effective To Date (Optional Expiry)</label>
                <input type="date" [(ngModel)]="formData.effectiveTo" class="form-control" />
              </div>

              <div class="form-group">
                <label>Default Discount Percentage (%)</label>
                <input type="number" min="0" max="100" step="0.5" [(ngModel)]="formData.discountPercentage" class="form-control" />
              </div>

              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="formData.isActive" class="form-control">
                  <option [ngValue]="true">Active</option>
                  <option [ngValue]="false">Inactive / Suspended</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Description / Notes</label>
                <textarea [(ngModel)]="formData.notes" rows="2" placeholder="Terms, contract references..." class="form-control"></textarea>
              </div>
            </div>
          </div>

          <!-- LINE ITEMS CARD -->
          <div class="zeno-card">
            <div class="items-header">
              <h3 class="card-section-title mb-0">Specific Item Price Overrides</h3>
              <button class="btn-sm btn-secondary" (click)="addLineItem()">
                <i class="pi pi-plus"></i> Add Product Line
              </button>
            </div>

            <table class="zeno-table line-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="width: 320px;">Product / Item <span class="required">*</span></th>
                  <th class="text-right" style="width: 150px;">Base Sale Rate (₹)</th>
                  <th class="text-right" style="width: 170px;">Custom Selling Price (₹)</th>
                  <th class="text-right" style="width: 140px;">Discount %</th>
                  <th class="text-right" style="width: 160px;">Min Selling Price (₹)</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                @if (formData.items.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                      No specific item overrides added.
                      @if (formData.pricingType === 'STOCK_GROUP_WISE' || formData.pricingType === 'CUSTOMER_WISE') {
                        <span>The global discount ({{ formData.discountPercentage }}%) will apply to all matching items.</span>
                      }
                    </td>
                  </tr>
                } @else {
                  @for (line of formData.items; track $index) {
                    <tr>
                      <td>{{ $index + 1 }}</td>
                      <td>
                        <select [(ngModel)]="line.itemId" (change)="onItemSelect(line)" class="form-control">
                          <option value="">-- Select Product --</option>
                          @for (it of itemsList; track it.id) {
                            <option [value]="it.id">{{ it.name }} ({{ it.sku || 'No SKU' }})</option>
                          }
                        </select>
                      </td>
                      <td class="text-right font-medium">₹{{ line.standardRate | number:'1.2-2' }}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          [(ngModel)]="line.customRate"
                          (input)="onCustomRateChange(line)"
                          class="form-control text-right font-semibold"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          [(ngModel)]="line.discountPercentage"
                          (input)="onDiscountChange(line)"
                          class="form-control text-right"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          [(ngModel)]="line.minSellingPrice"
                          class="form-control text-right"
                        />
                      </td>
                      <td class="text-center">
                        <button class="btn-icon text-danger" (click)="removeLineItem($index)" title="Remove Line">
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
      }
    </div>
  `,
  styles: [`
    .inventory-page { padding: 0; }
    .page-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
      h1 { font-size: 1.5rem; font-weight: 700; color: var(--surface-900); margin: 0; }
      .subtitle { font-size: 0.875rem; color: var(--surface-500); margin: 4px 0 0 0; }
    }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .btn-back {
      background: #ffffff; border: 1px solid var(--surface-300); width: 36px; height: 36px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--surface-700);
      &:hover { background: var(--surface-100); }
    }
    .header-actions { display: flex; gap: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-md); padding: 16px 20px;
      display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      &.blue { background: #eff6ff; color: #2563eb; }
      &.green { background: #f0fdf4; color: #16a34a; }
      &.purple { background: #faf5ff; color: #9333ea; }
    }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--surface-500); }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--surface-900); }
    .dimension-tabs {
      display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--surface-200); padding-bottom: 8px;
    }
    .tab-btn {
      background: none; border: 1px solid transparent; padding: 8px 16px; border-radius: var(--radius-sm);
      font-size: 0.875rem; font-weight: 600; color: var(--surface-600); cursor: pointer; display: flex; align-items: center; gap: 8px;
      &:hover { background: var(--surface-100); color: var(--surface-900); }
      &.active { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
      &.tab-simulator { margin-left: auto; background: #faf5ff; border-color: #e9d5ff; color: #7e22ce; }
      &.tab-simulator.active { background: #f3e8ff; border-color: #c084fc; color: #6b21a8; }
    }
    .zeno-card { background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-md); padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .card-section-title { font-size: 1.05rem; font-weight: 700; color: var(--surface-800); margin: 0 0 16px 0; }
    .table-toolbar { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .toolbar-search {
      position: relative; flex: 1; max-width: 440px;
      .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); }
      input { width: 100%; padding: 9px 12px 9px 36px; border: 1px solid var(--surface-300); border-radius: var(--radius-sm); font-size: 0.875rem; outline: none; }
    }
    .toolbar-filters { display: flex; gap: 10px; }
    .zeno-table {
      width: 100%; border-collapse: collapse; font-size: 0.875rem;
      th { background: var(--surface-50); padding: 10px 14px; font-weight: 600; color: var(--surface-600); border-bottom: 1px solid var(--surface-200); text-align: left; }
      td { padding: 12px 14px; border-bottom: 1px solid var(--surface-100); color: var(--surface-800); }
      tr:hover td { background: var(--surface-50); }
    }
    .clickable { cursor: pointer; &:hover { text-decoration: underline; } }
    .dimension-badge {
      display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
      &.badge-group { background: #e0f2fe; color: #0369a1; }
      &.badge-customer { background: #f3e8ff; color: #7e22ce; }
      &.badge-product { background: #fef3c7; color: #b45309; }
    }
    .target-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
      &.group { background: #f0f9ff; color: #0284c7; }
      &.customer { background: #faf5ff; color: #9333ea; }
      &.product { background: #fffbeb; color: #d97706; }
    }
    .status-badge {
      display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
      &.status-active { background: #dcfce7; color: #166534; }
      &.status-inactive { background: #f1f5f9; color: #64748b; }
    }
    .dimension-selector {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
    }
    .dim-pill {
      border: 1px solid var(--surface-300); border-radius: var(--radius-sm); padding: 14px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: all 0.15s ease;
      input { display: none; }
      i { font-size: 1.25rem; color: var(--surface-400); margin-top: 2px; }
      &.selected {
        border-color: var(--primary-500); background: #eff6ff;
        i { color: var(--primary-600); }
        .dim-title { color: var(--primary-800); }
      }
    }
    .dim-text { display: flex; flex-direction: column; }
    .dim-title { font-weight: 700; font-size: 0.875rem; color: var(--surface-800); }
    .dim-desc { font-size: 0.75rem; color: var(--surface-500); margin-top: 2px; }
    .action-buttons { display: flex; justify-content: flex-end; gap: 6px; }
    .btn-icon {
      background: none; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); width: 32px; height: 32px;
      cursor: pointer; color: var(--surface-600); display: inline-flex; align-items: center; justify-content: center;
      &:hover { background: var(--surface-100); }
      &.text-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    }
    .btn-primary {
      background: var(--primary-600); color: #ffffff; border: none; padding: 9px 18px; border-radius: var(--radius-sm);
      font-weight: 600; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      &:hover { background: var(--primary-700); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-secondary {
      background: #ffffff; border: 1px solid var(--surface-300); color: var(--surface-700); padding: 9px 18px;
      border-radius: var(--radius-sm); font-weight: 600; font-size: 0.875rem; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
      &:hover { background: var(--surface-100); }
    }
    .btn-sm { padding: 6px 12px; font-size: 0.8125rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .form-group {
      display: flex; flex-direction: column; gap: 6px;
      label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
      &.full-width { grid-column: 1 / -1; }
    }
    .form-control {
      padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: var(--radius-sm); font-size: 0.875rem; outline: none;
      &:focus { border-color: var(--primary-500); }
    }
    .required { color: #dc2626; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .alert-danger {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: var(--radius-sm);
      display: flex; align-items: center; gap: 10px; font-size: 0.875rem;
    }
    .simulator-header { margin-bottom: 20px; h3 { margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px; } }
    .sim-result-card {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: var(--radius-md); padding: 20px;
    }
    .result-badge-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .rule-badge {
      background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 4px; font-size: 0.8125rem;
    }
    .source-badge {
      background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 4px; font-size: 0.8125rem;
    }
    .result-numbers-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    }
    .num-box {
      background: #ffffff; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; display: flex; flex-direction: column;
      .num-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 600; text-transform: uppercase; }
      .num-val { font-size: 1.5rem; font-weight: 700; margin-top: 4px; }
      &.highlight { border-color: #bfdbfe; background: #eff6ff; }
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .text-muted { color: var(--surface-500); }
    .text-primary { color: var(--primary-600); }
    .text-success { color: #16a34a; }
  `],
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
    code: '',
    pricingType: 'STOCK_GROUP_WISE',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    itemGroupId: '',
    customerId: '',
    discountPercentage: 0,
    isActive: true,
    notes: '',
    items: [] as PriceListLineItem[],
  };

  constructor(
    private inventoryService: InventoryService,
    private mastersService: MastersService,
    private tenantService: TenantService,
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
      list = list.filter(
        (pl) =>
          pl.name?.toLowerCase().includes(q) ||
          pl.code?.toLowerCase().includes(q) ||
          pl.itemGroup?.name?.toLowerCase().includes(q) ||
          pl.customer?.name?.toLowerCase().includes(q),
      );
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

  openCreatePage() {
    this.editId = null;
    this.errorMessage = '';
    this.formData = {
      name: '',
      code: '',
      pricingType:
        this.selectedTab !== 'ALL' && this.selectedTab !== 'SIMULATOR'
          ? this.selectedTab
          : 'STOCK_GROUP_WISE',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      itemGroupId: '',
      customerId: '',
      discountPercentage: 0,
      isActive: true,
      notes: '',
      items: [],
    };
    this.viewMode = 'form';
  }

  openEditPage(pl: any) {
    this.editId = pl.id;
    this.errorMessage = '';
    this.formData = {
      name: pl.name,
      code: pl.code || '',
      pricingType: pl.pricingType,
      effectiveFrom: pl.effectiveFrom,
      effectiveTo: pl.effectiveTo || '',
      itemGroupId: pl.itemGroupId || '',
      customerId: pl.customerId || '',
      discountPercentage: Number(pl.discountPercentage || 0),
      isActive: Boolean(pl.isActive),
      notes: pl.notes || '',
      items: (pl.items || []).map((it: any) => ({
        id: it.id,
        itemId: it.itemId,
        variantId: it.variantId || null,
        standardRate: Number(it.standardRate || 0),
        customRate: Number(it.customRate || it.standardRate || 0),
        discountPercentage: Number(it.discountPercentage || 0),
        minSellingPrice: Number(it.minSellingPrice || 0),
      })),
    };
    this.viewMode = 'form';
  }

  addLineItem() {
    this.formData.items.push({
      itemId: '',
      standardRate: 0,
      customRate: 0,
      discountPercentage: this.formData.discountPercentage || 0,
      minSellingPrice: 0,
    });
  }

  removeLineItem(idx: number) {
    this.formData.items.splice(idx, 1);
  }

  onItemSelect(line: PriceListLineItem) {
    const item = this.itemsList.find((i) => i.id === line.itemId);
    if (item) {
      const baseRate = Number(item.saleRate || 0);
      line.standardRate = baseRate;
      const discount = Number(line.discountPercentage || this.formData.discountPercentage || 0);
      line.discountPercentage = discount;
      line.customRate = Number((baseRate * (1 - discount / 100)).toFixed(2));
      line.minSellingPrice = Number(item.purchaseRate || 0);
    }
  }

  onDiscountChange(line: PriceListLineItem) {
    const base = Number(line.standardRate || 0);
    const disc = Number(line.discountPercentage || 0);
    line.customRate = Number((base * (1 - disc / 100)).toFixed(2));
  }

  onCustomRateChange(line: PriceListLineItem) {
    const base = Number(line.standardRate || 0);
    const custom = Number(line.customRate || 0);
    if (base > 0) {
      line.discountPercentage = Number((((base - custom) / base) * 100).toFixed(2));
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
    if (this.formData.pricingType === 'STOCK_GROUP_WISE' && !this.formData.itemGroupId) {
      this.errorMessage = 'Please select a Stock Group for Stock Group Wise pricing.';
      return;
    }
    if (this.formData.pricingType === 'CUSTOMER_WISE' && !this.formData.customerId) {
      this.errorMessage = 'Please select a Customer for Customer Wise pricing.';
      return;
    }
    if (
      this.formData.pricingType === 'PRODUCT_WISE' &&
      (!this.formData.items || this.formData.items.length === 0)
    ) {
      this.errorMessage = 'Please add at least one product line for Product Wise pricing.';
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
        this.viewMode = 'list';
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to save price list.';
      },
    });
  }

  deletePriceList(pl: any) {
    if (!confirm(`Are you sure you want to delete price list "${pl.name}"?`)) {
      return;
    }

    this.inventoryService.deletePriceList(pl.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete price list');
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
      .getEffectivePrice(comp.id, this.simItemId, this.simCustomerId, this.simDate)
      .subscribe({
        next: (res) => {
          this.simResult = res;
        },
      });
  }
}
