import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../core/services/tenant.service';
import { P2pService } from '../../core/services/p2p.service';
import { SalesService } from '../../core/services/sales.service';
import { MastersService } from '../../core/services/masters.service';
import { InventoryService } from '../../core/services/inventory.service';
import { AccountingService } from '../../core/services/accounting.service';

export type DateFilterType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';
export type ChartMetricType = 'SALES' | 'PROFIT' | 'BILLS';

interface KpiCard {
  id: string;
  title: string;
  value: string;
  comparison: string;
  changePercent: string;
  isPositive: boolean;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  colorClass: string;
}

interface OutstandingCustomer {
  customerName: string;
  invoiceNo: string;
  dueDate: string;
  amount: number;
  overdueDays: number;
  status: 'OVERDUE' | 'DUE TODAY' | 'CURRENT';
}

interface TopProduct {
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  unit: string;
  salesAmount: number;
  profit: number;
  marginPercent: number;
}

interface BusinessAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  icon: string;
  title: string;
  actionText: string;
  route: string;
}

interface ChartDataPoint {
  label: string;
  sales: number;
  profit: number;
  bills: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- DATE FILTER TOOLBAR -->
      <div class="date-filter-bar">
        <div class="date-filter-pills">
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'TODAY'"
            (click)="setDateFilter('TODAY')"
          >
            Today
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'YESTERDAY'"
            (click)="setDateFilter('YESTERDAY')"
          >
            Yesterday
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'THIS_WEEK'"
            (click)="setDateFilter('THIS_WEEK')"
          >
            This Week
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'THIS_MONTH'"
            (click)="setDateFilter('THIS_MONTH')"
          >
            This Month
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'THIS_YEAR'"
            (click)="setDateFilter('THIS_YEAR')"
          >
            This Year
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="activeDateFilter === 'CUSTOM'"
            (click)="setDateFilter('CUSTOM')"
          >
            Custom Date
          </button>
        </div>

        @if (activeDateFilter === 'CUSTOM') {
          <div class="custom-date-inputs">
            <div class="date-input-group">
              <label>From:</label>
              <input type="date" [(ngModel)]="customStartDate" (change)="onCustomDateChange()" />
            </div>
            <div class="date-input-group">
              <label>To:</label>
              <input type="date" [(ngModel)]="customEndDate" (change)="onCustomDateChange()" />
            </div>
          </div>
        }
      </div>



      <!-- 2. MAIN KPI CARDS (8 KEY METRICS) -->
      <section class="kpi-section">
        <div class="kpi-grid">
          @for (card of kpiCards; track card.id) {
            <div class="kpi-card">
              <div class="kpi-card-top">
                <span class="kpi-label">{{ card.title }}</span>
                <div [class]="'kpi-icon-wrap ' + card.colorClass">
                  <i [class]="'pi ' + card.icon"></i>
                </div>
              </div>

              <div class="kpi-card-value font-mono">
                {{ card.value }}
              </div>

              <div class="kpi-card-footer">
                <span
                  class="kpi-trend-pill"
                  [class.positive]="card.isPositive"
                  [class.negative]="!card.isPositive"
                >
                  <i [class]="card.isPositive ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                  {{ card.changePercent }}
                </span>
                <span class="kpi-comparison-text">{{ card.comparison }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 11. NEEDS YOUR ATTENTION (BUSINESS ALERTS) -->
      @if (businessAlerts.length > 0) {
        <section class="attention-section">
          <div class="section-header-row">
            <div class="header-left">
              <span class="pulse-indicator"></span>
              <h3>Needs Your Attention</h3>
              <span class="section-tag">{{ businessAlerts.length }} Critical Alerts</span>
            </div>
          </div>
          <div class="attention-cards-grid">
            @for (alert of businessAlerts; track alert.id) {
              <div [class]="'alert-card ' + alert.type">
                <div class="alert-icon-col">
                  <i [class]="'pi ' + alert.icon"></i>
                </div>
                <div class="alert-text-col">
                  <span class="alert-title">{{ alert.title }}</span>
                </div>
                <div class="alert-action-col">
                  <a [routerLink]="alert.route" class="alert-action-btn">
                    {{ alert.actionText }} <i class="pi pi-arrow-right"></i>
                  </a>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- MAIN CONTENT: 2-COLUMN DASHBOARD LAYOUT -->
      <div class="dashboard-columns-layout">
        <!-- LEFT COLUMN: Sales Performance, Receivables & Top Products -->
        <div class="dashboard-col left-col">
          <!-- 3. SALES OVERVIEW WITH SWITCHABLE CHART -->
          <div class="zeno-card overview-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Sales Overview</h3>
                <span class="subtitle">Trend breakdown for {{ activePeriodLabel }}</span>
              </div>
              <div class="chart-switcher-tabs">
                <button
                  type="button"
                  class="chart-tab"
                  [class.active]="activeChartMetric === 'SALES'"
                  (click)="setChartMetric('SALES')"
                >
                  Sales (₹)
                </button>
                <button
                  type="button"
                  class="chart-tab"
                  [class.active]="activeChartMetric === 'PROFIT'"
                  (click)="setChartMetric('PROFIT')"
                >
                  Profit (₹)
                </button>
                <button
                  type="button"
                  class="chart-tab"
                  [class.active]="activeChartMetric === 'BILLS'"
                  (click)="setChartMetric('BILLS')"
                >
                  No. of Bills
                </button>
              </div>
            </div>

            <!-- Metric Summary Row -->
            <div class="sales-metric-pills-row">
              <div class="metric-pill">
                <span class="label">Total Sales</span>
                <span class="val font-mono">₹{{ formatCurrency(salesSummary.totalSales) }}</span>
              </div>
              <div class="metric-pill">
                <span class="label">Sales Return</span>
                <span class="val font-mono text-orange">₹{{ formatCurrency(salesSummary.salesReturn) }}</span>
              </div>
              <div class="metric-pill highlight">
                <span class="label">Net Sales</span>
                <span class="val font-mono text-blue">₹{{ formatCurrency(salesSummary.netSales) }}</span>
              </div>
              <div class="metric-pill highlight-success">
                <span class="label">Gross Profit</span>
                <span class="val font-mono text-emerald">₹{{ formatCurrency(salesSummary.grossProfit) }}</span>
              </div>
            </div>

            <!-- Modern SVG Interactive Chart -->
            <div class="chart-container">
              <div class="chart-canvas">
                <!-- SVG Bars -->
                <svg viewBox="0 0 700 240" preserveAspectRatio="none" class="chart-svg">
                  <!-- Horizontal Gridlines -->
                  <line x1="40" y1="30" x2="680" y2="30" stroke="#f1f5f9" stroke-dasharray="4" />
                  <line x1="40" y1="80" x2="680" y2="80" stroke="#f1f5f9" stroke-dasharray="4" />
                  <line x1="40" y1="130" x2="680" y2="130" stroke="#f1f5f9" stroke-dasharray="4" />
                  <line x1="40" y1="180" x2="680" y2="180" stroke="#e2e8f0" />

                  <!-- Bars & Points -->
                  @for (pt of chartPoints; track pt.label; let idx = $index) {
                    <g class="chart-bar-group" (mouseenter)="onBarHover(pt, $event)" (mouseleave)="onBarLeave()">
                      <!-- Background column touch zone -->
                      <rect
                        [attr.x]="60 + idx * barSpacing - 18"
                        y="20"
                        [attr.width]="36"
                        height="160"
                        fill="transparent"
                      />
                      <!-- Bar -->
                      <rect
                        [attr.x]="60 + idx * barSpacing - 14"
                        [attr.y]="getBarY(pt)"
                        width="28"
                        [attr.height]="getBarHeight(pt)"
                        rx="4"
                        [attr.fill]="getBarColor()"
                        class="chart-bar-rect"
                      />
                      <!-- Axis Label -->
                      <text
                        [attr.x]="60 + idx * barSpacing"
                        y="205"
                        text-anchor="middle"
                        class="chart-axis-label"
                      >
                        {{ pt.label }}
                      </text>
                    </g>
                  }
                </svg>

                <!-- Floating Hover Tooltip -->
                @if (hoveredPoint) {
                  <div
                    class="chart-tooltip"
                    [style.left.px]="tooltipX"
                    [style.top.px]="tooltipY"
                  >
                    <span class="tt-label">{{ hoveredPoint.label }}</span>
                    <span class="tt-val font-mono">
                      @if (activeChartMetric === 'SALES') {
                        ₹{{ formatCurrency(hoveredPoint.sales) }}
                      } @else if (activeChartMetric === 'PROFIT') {
                        ₹{{ formatCurrency(hoveredPoint.profit) }}
                      } @else {
                        {{ hoveredPoint.bills }} Bills
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- 5. CUSTOMER OUTSTANDING (RECEIVABLES) -->
          <div class="zeno-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Outstanding Receivables</h3>
                <span class="subtitle">Customer payments pending & overdue</span>
              </div>
              <a routerLink="/sales/sales-invoices" class="card-action-link">
                View All <i class="pi pi-arrow-right"></i>
              </a>
            </div>

            <!-- Receivables Overview Badges -->
            <div class="receivables-kpi-row">
              <div class="recv-subcard">
                <span class="recv-sub-label">Total Receivable</span>
                <span class="recv-sub-val font-mono">₹{{ formatCurrency(receivablesSummary.total) }}</span>
              </div>
              <div class="recv-subcard danger-border">
                <span class="recv-sub-label">Overdue Amount</span>
                <span class="recv-sub-val font-mono text-danger">₹{{ formatCurrency(receivablesSummary.overdue) }}</span>
              </div>
              <div class="recv-subcard warning-border">
                <span class="recv-sub-label">Due Today</span>
                <span class="recv-sub-val font-mono text-amber">₹{{ formatCurrency(receivablesSummary.dueToday) }}</span>
              </div>
              <div class="recv-subcard">
                <span class="recv-sub-label">Due This Week</span>
                <span class="recv-sub-val font-mono">₹{{ formatCurrency(receivablesSummary.dueThisWeek) }}</span>
              </div>
            </div>

            <!-- Customer Table -->
            <div class="table-container">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Invoice No</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Overdue Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cust of outstandingCustomers; track cust.invoiceNo) {
                    <tr>
                      <td class="font-bold text-main">{{ cust.customerName }}</td>
                      <td class="font-mono">{{ cust.invoiceNo }}</td>
                      <td>{{ cust.dueDate }}</td>
                      <td class="font-mono font-bold">₹{{ formatCurrency(cust.amount) }}</td>
                      <td>
                        @if (cust.overdueDays > 0) {
                          <span class="text-danger font-semibold">{{ cust.overdueDays }} days late</span>
                        } @else if (cust.overdueDays === 0) {
                          <span class="text-amber font-semibold">Today</span>
                        } @else {
                          <span class="text-muted">{{ -cust.overdueDays }} days left</span>
                        }
                      </td>
                      <td>
                        <span
                          class="status-pill"
                          [class.status-overdue]="cust.status === 'OVERDUE'"
                          [class.status-today]="cust.status === 'DUE TODAY'"
                          [class.status-current]="cust.status === 'CURRENT'"
                        >
                          {{ cust.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- 7. TOP SELLING PRODUCTS -->
          <div class="zeno-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Top Selling Products</h3>
                <span class="subtitle">Best performing items by revenue & margin</span>
              </div>
              <a routerLink="/masters/items" class="card-action-link">
                View Inventory <i class="pi pi-arrow-right"></i>
              </a>
            </div>

            <div class="table-container">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Sales Amount</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  @for (prod of topProducts; track prod.sku) {
                    <tr>
                      <td>
                        <div class="product-cell">
                          <span class="prod-name">{{ prod.name }}</span>
                          <span class="prod-sku font-mono">{{ prod.sku }} &bull; {{ prod.category }}</span>
                        </div>
                      </td>
                      <td class="font-semibold">{{ prod.quantitySold }} {{ prod.unit }}</td>
                      <td class="font-mono font-bold">₹{{ formatCurrency(prod.salesAmount) }}</td>
                      <td class="font-mono text-emerald font-semibold">₹{{ formatCurrency(prod.profit) }}</td>
                      <td>
                        <span class="margin-badge">
                          {{ prod.marginPercent }}%
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Money Position, Inventory Alerts, P&L, Purchases, Expenses -->
        <div class="dashboard-col right-col">
          <!-- 4. MONEY SUMMARY / MONEY POSITION -->
          <div class="zeno-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Money Position</h3>
                <span class="subtitle">Live cash, bank & liquidity status</span>
              </div>
              <span class="badge-liquid">
                <i class="pi pi-wallet"></i> Total Liquid: ₹{{ formatCurrency(moneySummary.totalLiquid) }}
              </span>
            </div>

            <div class="money-grid">
              <div class="money-box box-teal">
                <span class="m-label"><i class="pi pi-money-bill"></i> Cash Balance</span>
                <span class="m-val font-mono">₹{{ formatCurrency(moneySummary.cashBalance) }}</span>
                <span class="m-sub">Petty cash on hand</span>
              </div>

              <div class="money-box box-blue">
                <span class="m-label"><i class="pi pi-building"></i> Bank Balance</span>
                <span class="m-val font-mono">₹{{ formatCurrency(moneySummary.bankBalance) }}</span>
                <span class="m-sub">Across active current accounts</span>
              </div>

              <div class="money-box box-emerald">
                <span class="m-label"><i class="pi pi-download"></i> Customer Collection</span>
                <span class="m-val font-mono">₹{{ formatCurrency(moneySummary.customerCollection) }}</span>
                <span class="m-sub">Receipts collected {{ activePeriodLabel }}</span>
              </div>

              <div class="money-box box-purple">
                <span class="m-label"><i class="pi pi-upload"></i> Supplier Payments</span>
                <span class="m-val font-mono">₹{{ formatCurrency(moneySummary.supplierPayments) }}</span>
                <span class="m-sub">Disbursements cleared {{ activePeriodLabel }}</span>
              </div>
            </div>

            <!-- Net Flow Progress Indicator -->
            <div class="cash-flow-strip">
              <div class="strip-header">
                <span>Net Cash Movement</span>
                <span class="font-mono font-bold text-emerald">+₹{{ formatCurrency(moneySummary.netCashFlow) }}</span>
              </div>
              <div class="flow-progress-bar">
                <div
                  class="flow-fill"
                  [style.width.%]="getCashFlowRatio()"
                ></div>
              </div>
            </div>
          </div>

          <!-- 6. INVENTORY ALERTS -->
          <div class="zeno-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Inventory Alerts</h3>
                <span class="subtitle">Actionable stock levels requiring reorder</span>
              </div>
              <a routerLink="/inventory/price-list" class="card-action-link">
                Stock List <i class="pi pi-arrow-right"></i>
              </a>
            </div>

            <div class="inventory-alerts-grid">
              <a routerLink="/masters/items" class="inv-alert-card border-rose">
                <div class="inv-alert-icon icon-rose">
                  <i class="pi pi-times-circle"></i>
                </div>
                <div class="inv-alert-info">
                  <span class="inv-count font-mono">{{ inventoryAlerts.outOfStock }}</span>
                  <span class="inv-label">Out of Stock</span>
                </div>
                <i class="pi pi-chevron-right inv-arrow"></i>
              </a>

              <a routerLink="/masters/items" class="inv-alert-card border-amber">
                <div class="inv-alert-icon icon-amber">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="inv-alert-info">
                  <span class="inv-count font-mono">{{ inventoryAlerts.lowStock }}</span>
                  <span class="inv-label">Low Stock</span>
                </div>
                <i class="pi pi-chevron-right inv-arrow"></i>
              </a>

              <a routerLink="/procure-to-pay/purchase-orders" class="inv-alert-card border-orange">
                <div class="inv-alert-icon icon-orange">
                  <i class="pi pi-shopping-bag"></i>
                </div>
                <div class="inv-alert-info">
                  <span class="inv-count font-mono">{{ inventoryAlerts.reorderRequired }}</span>
                  <span class="inv-label">Reorder Required</span>
                </div>
                <i class="pi pi-chevron-right inv-arrow"></i>
              </a>

              <a routerLink="/inventory/price-list" class="inv-alert-card border-purple">
                <div class="inv-alert-icon icon-purple">
                  <i class="pi pi-calendar-times"></i>
                </div>
                <div class="inv-alert-info">
                  <span class="inv-count font-mono">{{ inventoryAlerts.expiringSoon }}</span>
                  <span class="inv-label">Expiring Soon (30d)</span>
                </div>
                <i class="pi pi-chevron-right inv-arrow"></i>
              </a>

              <a routerLink="/inventory/price-list" class="inv-alert-card border-slate">
                <div class="inv-alert-icon icon-slate">
                  <i class="pi pi-history"></i>
                </div>
                <div class="inv-alert-info">
                  <span class="inv-count font-mono">{{ inventoryAlerts.nonMovingStock }}</span>
                  <span class="inv-label">Non-Moving (90d+)</span>
                </div>
                <i class="pi pi-chevron-right inv-arrow"></i>
              </a>
            </div>
          </div>

          <!-- 10. PROFIT SUMMARY (WATERFALL CALCULATION) -->
          <div class="zeno-card">
            <div class="card-header-bar">
              <div class="title-wrap">
                <h3>Profit Summary</h3>
                <span class="subtitle">P&L estimation for {{ activePeriodLabel }}</span>
              </div>
              <span class="net-margin-tag">
                Net Margin: {{ profitSummary.netMarginPercent }}%
              </span>
            </div>

            <div class="waterfall-list">
              <div class="waterfall-step">
                <div class="step-desc">
                  <span class="step-num">1</span>
                  <span>Gross Sales</span>
                </div>
                <span class="step-val font-mono">₹{{ formatCurrency(profitSummary.sales) }}</span>
              </div>

              <div class="waterfall-step deduction">
                <div class="step-desc">
                  <span class="step-num step-minus">-</span>
                  <span>Cost of Goods Sold (Purchase Cost)</span>
                </div>
                <span class="step-val font-mono text-danger">- ₹{{ formatCurrency(profitSummary.purchaseCost) }}</span>
              </div>

              <div class="waterfall-step subtotal">
                <div class="step-desc">
                  <span class="step-num step-equal">=</span>
                  <span class="font-bold">Gross Profit ({{ profitSummary.grossMarginPercent }}%)</span>
                </div>
                <span class="step-val font-mono font-bold text-emerald">₹{{ formatCurrency(profitSummary.grossProfit) }}</span>
              </div>

              <div class="waterfall-step deduction">
                <div class="step-desc">
                  <span class="step-num step-minus">-</span>
                  <span>Operating Expenses</span>
                </div>
                <span class="step-val font-mono text-danger">- ₹{{ formatCurrency(profitSummary.expenses) }}</span>
              </div>

              <div class="waterfall-step grand-total">
                <div class="step-desc">
                  <span class="step-num step-star"><i class="pi pi-check"></i></span>
                  <span class="font-bold text-main">Estimated Net Profit</span>
                </div>
                <span class="step-val font-mono font-extrabold text-blue">₹{{ formatCurrency(profitSummary.netProfit) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 1600px;
      margin: 0 auto;
      padding-bottom: 40px;
    }

    /* 1. Date Filter Toolbar */
    .date-filter-bar {
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .date-filter-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: var(--surface-50, #f8fafc);
      border: 1px solid var(--surface-200, #e2e8f0);
      color: var(--surface-600, #475569);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-100, #f1f5f9);
        color: var(--surface-900, #0f172a);
      }

      &.active {
        background: var(--primary-600, #2563eb);
        color: #ffffff;
        border-color: var(--primary-600, #2563eb);
        box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
      }
    }

    .custom-date-inputs {
      display: flex;
      align-items: center;
      gap: 10px;

      .date-input-group {
        display: flex;
        align-items: center;
        gap: 6px;

        label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--surface-500, #64748b);
        }

        input {
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid var(--surface-300, #cbd5e1);
          font-size: 0.8125rem;
          outline: none;
        }
      }
    }

    /* 12. Quick Actions Bar */
    .quick-actions-bar {
      background: #ffffff;
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      .qa-bar-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .qa-bar-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--surface-900, #0f172a);
          display: flex;
          align-items: center;
          gap: 6px;

          i {
            color: var(--primary-600, #2563eb);
          }
        }

        .qa-bar-subtitle {
          font-size: 0.75rem;
          color: var(--surface-400, #94a3b8);
        }
      }

      .qa-buttons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
      }

      .qa-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 12px;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        white-space: nowrap;

        &:hover {
          transform: translateY(-1px);
        }

        &.btn-sale {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
          &:hover { background: #dbeafe; }
        }

        &.btn-purchase {
          background: #f5f3ff;
          color: #6d28d9;
          border-color: #ddd6fe;
          &:hover { background: #ede9fe; }
        }

        &.btn-finance {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
          &:hover { background: #d1fae5; }
        }

        &.btn-master {
          background: #f8fafc;
          color: #334155;
          border-color: #cbd5e1;
          &:hover { background: #f1f5f9; color: #0f172a; }
        }

        &.btn-return {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fed7aa;
          &:hover { background: #ffedd5; }
        }
      }
    }

    /* 2. KPI Section */
    .kpi-section {
      width: 100%;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.15s ease;

      &:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
        border-color: var(--surface-300, #cbd5e1);
      }

      .kpi-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .kpi-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--surface-500, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .kpi-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;

          &.icon-blue { background: #eff6ff; color: #2563eb; }
          &.icon-emerald { background: #ecfdf5; color: #059669; }
          &.icon-amber { background: #fef3c7; color: #d97706; }
          &.icon-purple { background: #f5f3ff; color: #7c3aed; }
          &.icon-cyan { background: #ecfeff; color: #0891b2; }
          &.icon-indigo { background: #e0e7ff; color: #4338ca; }
          &.icon-orange { background: #fff7ed; color: #ea580c; }
          &.icon-teal { background: #f0fdf4; color: #0d9488; }
        }
      }

      .kpi-card-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--surface-900, #0f172a);
        line-height: 1.2;
      }

      .kpi-card-footer {
        display: flex;
        align-items: center;
        gap: 8px;

        .kpi-trend-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;

          &.positive {
            background: #ecfdf5;
            color: #047857;
          }

          &.negative {
            background: #fee2e2;
            color: #b91c1c;
          }
        }

        .kpi-comparison-text {
          font-size: 0.71875rem;
          color: var(--surface-400, #94a3b8);
        }
      }
    }

    /* 11. Needs Your Attention */
    .attention-section {
      background: #fff;
      border: 1px solid #fee2e2;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.05);

      .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .pulse-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
          }

          h3 {
            margin: 0;
            font-size: 0.9375rem;
            font-weight: 700;
            color: #991b1b;
          }

          .section-tag {
            background: #fee2e2;
            color: #b91c1c;
            font-size: 0.6875rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
          }
        }
      }

      .attention-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 10px;
      }

      .alert-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        background: #fff5f5;

        &.warning {
          border-color: #fde68a;
          background: #fffbeb;
          .alert-icon-col i { color: #d97706; }
        }

        &.info {
          border-color: #bfdbfe;
          background: #eff6ff;
          .alert-icon-col i { color: #2563eb; }
        }

        .alert-icon-col {
          font-size: 1.1rem;
          color: #dc2626;
        }

        .alert-text-col {
          flex: 1;

          .alert-title {
            font-size: 0.8125rem;
            font-weight: 600;
            color: #1e293b;
          }
        }

        .alert-action-col {
          .alert-action-btn {
            font-size: 0.75rem;
            font-weight: 700;
            color: #2563eb;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    /* 2-Column Grid Layout */
    .dashboard-columns-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
      }
    }

    .dashboard-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Common Card Styling */
    .zeno-card {
      background: #ffffff;
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;

      .title-wrap {
        display: flex;
        flex-direction: column;

        h3 {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--surface-900, #0f172a);
          letter-spacing: -0.01em;
        }

        .subtitle {
          font-size: 0.75rem;
          color: var(--surface-500, #64748b);
          margin-top: 2px;
        }
      }

      .card-action-link {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--primary-600, #2563eb);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Chart Card Styles */
    .chart-switcher-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--surface-100, #f1f5f9);
      padding: 3px;
      border-radius: 8px;

      .chart-tab {
        background: transparent;
        border: none;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--surface-600, #475569);
        cursor: pointer;
        transition: all 0.15s ease;

        &.active {
          background: #ffffff;
          color: var(--primary-600, #2563eb);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
      }
    }

    .sales-metric-pills-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      @media (max-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .metric-pill {
        padding: 10px 14px;
        background: var(--surface-50, #f8fafc);
        border: 1px solid var(--surface-200, #e2e8f0);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        &.highlight {
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        &.highlight-success {
          border-color: #a7f3d0;
          background: #ecfdf5;
        }

        .label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--surface-500, #64748b);
          text-transform: uppercase;
        }

        .val {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--surface-900, #0f172a);
        }
      }
    }

    .chart-container {
      width: 100%;
      height: 240px;
      position: relative;

      .chart-canvas {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .chart-svg {
        width: 100%;
        height: 100%;
      }

      .chart-bar-rect {
        transition: opacity 0.15s ease, transform 0.15s ease;
        cursor: pointer;

        &:hover {
          opacity: 0.85;
        }
      }

      .chart-axis-label {
        font-size: 11px;
        fill: #64748b;
        font-family: inherit;
        font-weight: 500;
      }

      .chart-tooltip {
        position: absolute;
        background: #0f172a;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        pointer-events: none;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 2px;
        transform: translate(-50%, -100%);
        z-index: 10;
        white-space: nowrap;

        .tt-label {
          color: #94a3b8;
          font-size: 0.6875rem;
        }

        .tt-val {
          font-weight: 700;
          font-size: 0.8125rem;
        }
      }
    }

    /* Customer Outstanding & Table */
    .receivables-kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      @media (max-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .recv-subcard {
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--surface-50, #f8fafc);
        border: 1px solid var(--surface-200, #e2e8f0);
        display: flex;
        flex-direction: column;
        gap: 2px;

        &.danger-border {
          border-left: 3px solid #ef4444;
        }

        &.warning-border {
          border-left: 3px solid #f59e0b;
        }

        .recv-sub-label {
          font-size: 0.6875rem;
          color: var(--surface-500, #64748b);
          font-weight: 600;
        }

        .recv-sub-val {
          font-size: 1rem;
          font-weight: 700;
          color: var(--surface-900, #0f172a);
        }
      }
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .dashboard-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;

      th {
        text-align: left;
        padding: 10px 12px;
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--surface-500, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--surface-200, #e2e8f0);
        background: var(--surface-50, #f8fafc);
        white-space: nowrap;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--surface-100, #f1f5f9);
        color: var(--surface-700, #334155);
        vertical-align: middle;
        white-space: nowrap;
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .status-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      display: inline-block;

      &.status-overdue {
        background: #fee2e2;
        color: #991b1b;
      }

      &.status-today {
        background: #fef3c7;
        color: #92400e;
      }

      &.status-current {
        background: #ecfdf5;
        color: #065f46;
      }
    }

    /* Product Cell */
    .product-cell {
      display: flex;
      flex-direction: column;

      .prod-name {
        font-weight: 700;
        color: var(--surface-900, #0f172a);
      }

      .prod-sku {
        font-size: 0.6875rem;
        color: var(--surface-400, #94a3b8);
      }
    }

    .margin-badge {
      background: #ecfdf5;
      color: #047857;
      font-weight: 700;
      font-size: 0.71875rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Money Position */
    .badge-liquid {
      background: #f0fdf4;
      color: #166534;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid #bbf7d0;
    }

    .money-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }

      .money-box {
        padding: 12px 14px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        border: 1px solid transparent;

        &.box-teal { background: #f0fdfa; border-color: #99f6e4; color: #0f766e; }
        &.box-blue { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        &.box-emerald { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        &.box-purple { background: #faf5ff; border-color: #e9d5ff; color: #7e22ce; }

        .m-label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .m-val {
          font-size: 1.125rem;
          font-weight: 800;
          margin: 2px 0;
        }

        .m-sub {
          font-size: 0.65625rem;
          opacity: 0.8;
        }
      }
    }

    .cash-flow-strip {
      padding-top: 10px;
      border-top: 1px dashed var(--surface-200, #e2e8f0);
      display: flex;
      flex-direction: column;
      gap: 6px;

      .strip-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--surface-600, #475569);
      }

      .flow-progress-bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;

        .flow-fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
        }
      }
    }

    /* Inventory Alerts Grid */
    .inventory-alerts-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .inv-alert-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--surface-50, #f8fafc);
        border: 1px solid var(--surface-200, #e2e8f0);
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          background: #ffffff;
          transform: translateX(2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        &.border-rose { border-left: 3px solid #f43f5e; }
        &.border-amber { border-left: 3px solid #f59e0b; }
        &.border-orange { border-left: 3px solid #ea580c; }
        &.border-purple { border-left: 3px solid #a855f7; }
        &.border-slate { border-left: 3px solid #64748b; }

        .inv-alert-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;

          &.icon-rose { background: #ffe4e6; color: #e11d48; }
          &.icon-amber { background: #fef3c7; color: #d97706; }
          &.icon-orange { background: #ffedd5; color: #ea580c; }
          &.icon-purple { background: #f3e8ff; color: #9333ea; }
          &.icon-slate { background: #f1f5f9; color: #475569; }
        }

        .inv-alert-info {
          flex: 1;
          display: flex;
          align-items: baseline;
          gap: 8px;

          .inv-count {
            font-size: 1.0625rem;
            font-weight: 800;
            color: var(--surface-900, #0f172a);
          }

          .inv-label {
            font-size: 0.8125rem;
            color: var(--surface-600, #475569);
            font-weight: 600;
          }
        }

        .inv-arrow {
          font-size: 0.75rem;
          color: var(--surface-400, #94a3b8);
        }
      }
    }

    /* Profit Summary Waterfall */
    .net-margin-tag {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }

    .waterfall-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .waterfall-step {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8125rem;
        background: var(--surface-50, #f8fafc);

        .step-desc {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--surface-700, #334155);

          .step-num {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #cbd5e1;
            color: #0f172a;
            font-size: 0.65rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;

            &.step-minus { background: #fee2e2; color: #b91c1c; }
            &.step-equal { background: #dbeafe; color: #1d4ed8; }
            &.step-star { background: #dcfce7; color: #15803d; }
          }
        }

        &.deduction {
          background: #fffafa;
        }

        &.subtotal {
          background: #f0fdf4;
          border: 1px dashed #86efac;
        }

        &.grand-total {
          background: #eff6ff;
          border: 1px solid #93c5fd;
          padding: 10px 12px;
          margin-top: 4px;
        }
      }
    }

    /* Purchase Summary Grid */
    .purchase-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;

      .purchase-metric-item {
        padding: 10px 12px;
        background: var(--surface-50, #f8fafc);
        border: 1px solid var(--surface-200, #e2e8f0);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .p-label {
          font-size: 0.6875rem;
          color: var(--surface-500, #64748b);
          font-weight: 600;
          text-transform: uppercase;
        }

        .p-val {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--surface-900, #0f172a);
        }
      }
    }

    /* Expense Summary */
    .total-expense-pill {
      font-size: 0.75rem;
      font-weight: 700;
      color: #991b1b;
      background: #fee2e2;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .expense-bar-stacked {
      height: 10px;
      background: #e2e8f0;
      border-radius: 5px;
      overflow: hidden;
      display: flex;

      .seg {
        height: 100%;
        &.salary { background: #3b82f6; }
        &.rent { background: #8b5cf6; }
        &.electricity { background: #f59e0b; }
        &.transport { background: #06b6d4; }
        &.other { background: #94a3b8; }
      }
    }

    .expense-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .exp-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.8125rem;
        padding: 4px 0;

        .exp-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--surface-700, #334155);

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            &.dot-salary { background: #3b82f6; }
            &.dot-rent { background: #8b5cf6; }
            &.dot-electricity { background: #f59e0b; }
            &.dot-transport { background: #06b6d4; }
            &.dot-other { background: #94a3b8; }
          }
        }

        .exp-nums {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;

          .exp-pct {
            font-size: 0.6875rem;
            color: var(--surface-400, #94a3b8);
          }
        }
      }
    }

    /* Helpers */
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .text-main { color: var(--surface-900, #0f172a); }
    .text-blue { color: #2563eb; }
    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .text-orange { color: #ea580c; }
    .text-danger { color: #dc2626; }
    .text-muted { color: var(--surface-400, #94a3b8); }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class DashboardComponent implements OnInit {
  activeDateFilter: DateFilterType = 'TODAY';
  activeChartMetric: ChartMetricType = 'SALES';
  customStartDate = '2026-10-01';
  customEndDate = '2026-10-07';

  // Chart hover tooltip coordinates
  hoveredPoint: ChartDataPoint | null = null;
  tooltipX = 0;
  tooltipY = 0;
  barSpacing = 90;

  // 2. Main KPI Cards
  kpiCards: KpiCard[] = [];

  // 3. Sales Overview Chart Points & Summary
  chartPoints: ChartDataPoint[] = [];
  salesSummary = {
    totalSales: 148500,
    salesReturn: 4200,
    netSales: 144300,
    grossProfit: 42600,
  };

  // 4. Money Summary
  moneySummary = {
    cashBalance: 122500,
    bankBalance: 550000,
    totalLiquid: 672500,
    customerCollection: 92400,
    supplierPayments: 64000,
    customerOutstanding: 584200,
    supplierOutstanding: 312800,
    netCashFlow: 28400,
  };

  // 5. Customer Outstanding
  receivablesSummary = {
    total: 584200,
    overdue: 142000,
    dueToday: 38500,
    dueThisWeek: 84200,
  };

  outstandingCustomers: OutstandingCustomer[] = [
    {
      customerName: 'Apex Logistics & Trade',
      invoiceNo: 'INV-2026-089',
      dueDate: '01-Oct-2026',
      amount: 45000,
      overdueDays: 6,
      status: 'OVERDUE',
    },
    {
      customerName: 'Metro Distributors Corp',
      invoiceNo: 'INV-2026-092',
      dueDate: '03-Oct-2026',
      amount: 32500,
      overdueDays: 4,
      status: 'OVERDUE',
    },
    {
      customerName: 'Zenith Retail Outlets',
      invoiceNo: 'INV-2026-095',
      dueDate: '07-Oct-2026',
      amount: 38500,
      overdueDays: 0,
      status: 'DUE TODAY',
    },
    {
      customerName: 'Sunrise Enterprises Ltd',
      invoiceNo: 'INV-2026-099',
      dueDate: '10-Oct-2026',
      amount: 64200,
      overdueDays: -3,
      status: 'CURRENT',
    },
    {
      customerName: 'Global Supermart Stores',
      invoiceNo: 'INV-2026-101',
      dueDate: '14-Oct-2026',
      amount: 28000,
      overdueDays: -7,
      status: 'CURRENT',
    },
  ];

  // 6. Inventory Alerts
  inventoryAlerts = {
    outOfStock: 5,
    lowStock: 14,
    reorderRequired: 8,
    expiringSoon: 7,
    nonMovingStock: 12,
  };

  // 7. Top Selling Products
  topProducts: TopProduct[] = [
    {
      name: 'Industrial Safety Boots (ISI Grade)',
      sku: 'SKU-SFT-001',
      category: 'Footwear',
      quantitySold: 184,
      unit: 'Pairs',
      salesAmount: 349600,
      profit: 98400,
      marginPercent: 28.1,
    },
    {
      name: 'Heavy-Duty Reinforced Work Gloves',
      sku: 'SKU-GLV-012',
      category: 'Safety Gear',
      quantitySold: 320,
      unit: 'Pairs',
      salesAmount: 112000,
      profit: 35800,
      marginPercent: 32.0,
    },
    {
      name: 'Reflective High-Visibility Vest',
      sku: 'SKU-VST-044',
      category: 'Apparel',
      quantitySold: 260,
      unit: 'Pcs',
      salesAmount: 98800,
      profit: 31200,
      marginPercent: 31.6,
    },
    {
      name: 'Polycarbonate Hard Hat Helmet',
      sku: 'SKU-HLM-089',
      category: 'Head Protection',
      quantitySold: 145,
      unit: 'Pcs',
      salesAmount: 87000,
      profit: 26100,
      marginPercent: 30.0,
    },
    {
      name: 'Clear Anti-Fog Chemical Goggles',
      sku: 'SKU-GGL-021',
      category: 'Eye Protection',
      quantitySold: 210,
      unit: 'Pcs',
      salesAmount: 63000,
      profit: 22050,
      marginPercent: 35.0,
    },
  ];

  // 8. Purchase Summary
  purchaseSummary = {
    todayPurchase: 82400,
    monthlyPurchase: 1428000,
    pendingPOs: 3,
    pendingGRNs: 2,
    pendingBills: 6,
    supplierOutstanding: 312800,
  };

  // 9. Expense Summary
  expenseSummary = {
    total: 68500,
    salary: 35000,
    salaryPercent: 51,
    rent: 18000,
    rentPercent: 26,
    electricity: 5500,
    electricityPercent: 8,
    transport: 4200,
    transportPercent: 6,
    other: 5800,
    otherPercent: 9,
  };

  // 10. Profit Summary
  profitSummary = {
    sales: 144300,
    purchaseCost: 101700,
    grossProfit: 42600,
    grossMarginPercent: 29.5,
    expenses: 14200,
    netProfit: 28400,
    netMarginPercent: 19.7,
  };

  // 11. Needs Your Attention
  businessAlerts: BusinessAlert[] = [
    {
      id: 'al-1',
      type: 'danger',
      icon: 'pi-exclamation-circle',
      title: '8 customer invoices are overdue (₹1,42,000)',
      actionText: 'Collect Payments',
      route: '/sales/customer-receipts',
    },
    {
      id: 'al-2',
      type: 'danger',
      icon: 'pi-times-circle',
      title: '5 products are out of stock',
      actionText: 'Restock Items',
      route: '/masters/items',
    },
    {
      id: 'al-3',
      type: 'warning',
      icon: 'pi-shopping-bag',
      title: '14 products are below minimum reorder level',
      actionText: 'Create Purchase Order',
      route: '/procure-to-pay/purchase-orders',
    },
    {
      id: 'al-4',
      type: 'info',
      icon: 'pi-truck',
      title: '3 purchase orders awaiting GRN receipt',
      actionText: 'Receive Stock',
      route: '/procure-to-pay/goods-receipt-notes',
    },
    {
      id: 'al-5',
      type: 'warning',
      icon: 'pi-credit-card',
      title: '4 supplier payments due this week (₹85,000)',
      actionText: 'Pay Bills',
      route: '/procure-to-pay/vendor-payments',
    },
    {
      id: 'al-6',
      type: 'info',
      icon: 'pi-clock',
      title: '7 product batches expiring within 30 days',
      actionText: 'Review Batches',
      route: '/inventory/price-list',
    },
  ];

  constructor(
    public tenant: TenantService,
    public router: Router,
    private p2p: P2pService,
    private sales: SalesService,
    private masters: MastersService,
    private inventory: InventoryService,
    private accounting: AccountingService,
  ) {}

  get activePeriodLabel(): string {
    switch (this.activeDateFilter) {
      case 'TODAY': return 'Today';
      case 'YESTERDAY': return 'Yesterday';
      case 'THIS_WEEK': return 'This Week';
      case 'THIS_MONTH': return 'This Month';
      case 'THIS_YEAR': return 'This Financial Year';
      case 'CUSTOM': return 'Selected Custom Range';
    }
  }

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => this.loadLiveData(),
    });
    this.calculateMetricsForPeriod(this.activeDateFilter);
  }

  setDateFilter(filter: DateFilterType) {
    this.activeDateFilter = filter;
    this.calculateMetricsForPeriod(filter);
  }

  onCustomDateChange() {
    if (this.customStartDate && this.customEndDate) {
      this.calculateMetricsForPeriod('CUSTOM');
    }
  }

  setChartMetric(metric: ChartMetricType) {
    this.activeChartMetric = metric;
  }

  calculateMetricsForPeriod(filter: DateFilterType) {
    let salesMult = 1;
    let periodName = 'vs yesterday';

    switch (filter) {
      case 'TODAY':
        salesMult = 1;
        periodName = 'vs yesterday';
        this.chartPoints = [
          { label: '9 AM', sales: 12000, profit: 3500, bills: 2 },
          { label: '11 AM', sales: 28500, profit: 8200, bills: 6 },
          { label: '1 PM', sales: 45000, profit: 13100, bills: 8 },
          { label: '3 PM', sales: 22000, profit: 6400, bills: 4 },
          { label: '5 PM', sales: 18000, profit: 5200, bills: 3 },
          { label: '7 PM', sales: 15000, profit: 4200, bills: 3 },
          { label: '9 PM', sales: 8000, profit: 2000, bills: 2 },
        ];
        break;

      case 'YESTERDAY':
        salesMult = 0.88;
        periodName = 'vs prev day';
        this.chartPoints = [
          { label: '9 AM', sales: 10500, profit: 3000, bills: 2 },
          { label: '11 AM', sales: 24000, profit: 6900, bills: 5 },
          { label: '1 PM', sales: 38000, profit: 10800, bills: 7 },
          { label: '3 PM', sales: 21000, profit: 5900, bills: 4 },
          { label: '5 PM', sales: 16500, profit: 4700, bills: 3 },
          { label: '7 PM', sales: 12000, profit: 3400, bills: 2 },
          { label: '9 PM', sales: 7800, profit: 1500, bills: 1 },
        ];
        break;

      case 'THIS_WEEK':
        salesMult = 5.67;
        periodName = 'vs last week';
        this.chartPoints = [
          { label: 'Mon', sales: 112000, profit: 32000, bills: 22 },
          { label: 'Tue', sales: 129800, profit: 36200, bills: 24 },
          { label: 'Wed', sales: 148500, profit: 42600, bills: 28 },
          { label: 'Thu', sales: 135000, profit: 39000, bills: 26 },
          { label: 'Fri', sales: 158000, profit: 46500, bills: 31 },
          { label: 'Sat', sales: 124000, profit: 37200, bills: 23 },
          { label: 'Sun', sales: 34700, profit: 11500, bills: 8 },
        ];
        break;

      case 'THIS_MONTH':
        salesMult = 23.4;
        periodName = 'vs last month';
        this.chartPoints = [
          { label: 'Wk 1', sales: 842000, profit: 245000, bills: 162 },
          { label: 'Wk 2', sales: 915000, profit: 262000, bills: 175 },
          { label: 'Wk 3', sales: 880000, profit: 248000, bills: 168 },
          { label: 'Wk 4', sales: 843000, profit: 230000, bills: 135 },
        ];
        break;

      case 'THIS_YEAR':
      case 'CUSTOM':
        salesMult = 124.2;
        periodName = 'vs last year';
        this.chartPoints = [
          { label: 'Apr', sales: 2450000, profit: 710000, bills: 460 },
          { label: 'May', sales: 2680000, profit: 775000, bills: 510 },
          { label: 'Jun', sales: 2540000, profit: 735000, bills: 480 },
          { label: 'Jul', sales: 2720000, profit: 788000, bills: 520 },
          { label: 'Aug', sales: 2890000, profit: 838000, bills: 550 },
          { label: 'Sep', sales: 3120000, profit: 905000, bills: 590 },
          { label: 'Oct', sales: 2050000, profit: 489000, bills: 310 },
        ];
        break;
    }

    const baseSales = Math.round(148500 * salesMult);
    const baseProfit = Math.round(42600 * salesMult);
    const baseBills = Math.round(28 * (salesMult < 1 ? 0.9 : Math.max(1, salesMult * 0.85)));
    const baseReturns = Math.round(4200 * salesMult);

    this.salesSummary = {
      totalSales: baseSales,
      salesReturn: baseReturns,
      netSales: baseSales - baseReturns,
      grossProfit: baseProfit,
    };

    this.profitSummary = {
      sales: baseSales - baseReturns,
      purchaseCost: Math.round(baseSales * 0.69),
      grossProfit: baseProfit,
      grossMarginPercent: 29.5,
      expenses: Math.round(baseSales * 0.1),
      netProfit: Math.round(baseProfit - baseSales * 0.1),
      netMarginPercent: 19.7,
    };

    // Build the 8 KPI Cards
    this.kpiCards = [
      {
        id: 'kpi-sales',
        title: filter === 'TODAY' ? "Today's Sales" : 'Period Sales',
        value: `₹${this.formatCurrency(baseSales)}`,
        comparison: periodName,
        changePercent: '+14.2%',
        isPositive: true,
        trend: 'up',
        icon: 'pi-shopping-bag',
        colorClass: 'icon-blue',
      },
      {
        id: 'kpi-profit',
        title: filter === 'TODAY' ? "Today's Profit" : 'Period Profit',
        value: `₹${this.formatCurrency(baseProfit)}`,
        comparison: '29.5% margin',
        changePercent: '+8.5%',
        isPositive: true,
        trend: 'up',
        icon: 'pi-chart-line',
        colorClass: 'icon-emerald',
      },
      {
        id: 'kpi-receivable',
        title: 'Customer Receivable',
        value: `₹${this.formatCurrency(this.receivablesSummary.total)}`,
        comparison: '14 overdue bills',
        changePercent: '₹1.4L late',
        isPositive: false,
        trend: 'down',
        icon: 'pi-arrow-down-left',
        colorClass: 'icon-amber',
      },
      {
        id: 'kpi-payable',
        title: 'Supplier Payable',
        value: `₹${this.formatCurrency(this.moneySummary.supplierOutstanding)}`,
        comparison: '6 bills pending',
        changePercent: 'Due in 7d',
        isPositive: true,
        trend: 'neutral',
        icon: 'pi-arrow-up-right',
        colorClass: 'icon-purple',
      },
      {
        id: 'kpi-stock',
        title: 'Stock Value',
        value: '₹18,45,000',
        comparison: '240 Active SKUs',
        changePercent: '5 out of stock',
        isPositive: false,
        trend: 'down',
        icon: 'pi-box',
        colorClass: 'icon-cyan',
      },
      {
        id: 'kpi-bills',
        title: filter === 'TODAY' ? "Today's Bills" : 'Total Bills',
        value: `${baseBills} Bills`,
        comparison: periodName,
        changePercent: '+16.7%',
        isPositive: true,
        trend: 'up',
        icon: 'pi-file-edit',
        colorClass: 'icon-indigo',
      },
      {
        id: 'kpi-return',
        title: 'Sales Return',
        value: `₹${this.formatCurrency(baseReturns)}`,
        comparison: '2.8% of gross sales',
        changePercent: '1 return',
        isPositive: false,
        trend: 'down',
        icon: 'pi-replay',
        colorClass: 'icon-orange',
      },
      {
        id: 'kpi-liquid',
        title: 'Cash + Bank Balance',
        value: `₹${this.formatCurrency(this.moneySummary.totalLiquid)}`,
        comparison: 'Cash: ₹1.2L | Bank: ₹5.5L',
        changePercent: 'Healthy',
        isPositive: true,
        trend: 'up',
        icon: 'pi-wallet',
        colorClass: 'icon-teal',
      },
    ];

    this.barSpacing = Math.round(620 / Math.max(1, this.chartPoints.length));
  }

  loadLiveData() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    // Load actual stock summary if available
    this.masters.getStockSummary(compId).subscribe({
      next: (stock) => {
        if (stock && stock.length > 0) {
          const totalVal = stock.reduce((s, it) => s + Number(it.totalValue || 0), 0);
          const zeroStock = stock.filter((it) => Number(it.totalQuantity || 0) <= 0).length;
          const lowStock = stock.filter((it) => Number(it.totalQuantity || 0) > 0 && Number(it.totalQuantity || 0) < 10).length;

          const stockCard = this.kpiCards.find((c) => c.id === 'kpi-stock');
          if (stockCard) {
            stockCard.value = `₹${this.formatCurrency(totalVal)}`;
            stockCard.comparison = `${stock.length} Active SKUs`;
          }

          this.inventoryAlerts.outOfStock = zeroStock || 5;
          this.inventoryAlerts.lowStock = lowStock || 14;
        }
      },
      error: () => {},
    });

    // Load pending orders
    this.p2p.getPurchaseOrders(compId, 'PENDING').subscribe({
      next: (orders) => {
        if (orders) {
          this.purchaseSummary.pendingPOs = orders.length || 3;
        }
      },
      error: () => {},
    });

    // Load real purchase invoices
    this.p2p.getPurchaseInvoices(compId).subscribe({
      next: (invoices) => {
        if (invoices && invoices.length > 0) {
          const unpaid = invoices.filter((i) => i.status !== 'PAID');
          const sumUnpaid = unpaid.reduce((s, i) => s + (Number(i.grandTotal) - Number(i.paidAmount || 0)), 0);
          if (sumUnpaid > 0) {
            this.purchaseSummary.supplierOutstanding = sumUnpaid;
            this.moneySummary.supplierOutstanding = sumUnpaid;
            const payableCard = this.kpiCards.find((c) => c.id === 'kpi-payable');
            if (payableCard) {
              payableCard.value = `₹${this.formatCurrency(sumUnpaid)}`;
            }
          }
        }
      },
      error: () => {},
    });
  }

  // --- SVG Chart Calculations ---
  getBarHeight(pt: ChartDataPoint): number {
    const maxVal = Math.max(...this.chartPoints.map((p) => this.getMetricValue(p)), 10);
    const val = this.getMetricValue(pt);
    return Math.max(8, Math.round((val / maxVal) * 150));
  }

  getBarY(pt: ChartDataPoint): number {
    const h = this.getBarHeight(pt);
    return 180 - h;
  }

  getMetricValue(pt: ChartDataPoint): number {
    switch (this.activeChartMetric) {
      case 'SALES': return pt.sales;
      case 'PROFIT': return pt.profit;
      case 'BILLS': return pt.bills;
    }
  }

  getBarColor(): string {
    switch (this.activeChartMetric) {
      case 'SALES': return '#3b82f6';
      case 'PROFIT': return '#10b981';
      case 'BILLS': return '#6366f1';
    }
  }

  onBarHover(pt: ChartDataPoint, event: MouseEvent) {
    this.hoveredPoint = pt;
    const target = event.currentTarget as SVGElement;
    const rect = target.getBoundingClientRect();
    const parentRect = (target.closest('.chart-canvas') as HTMLElement)?.getBoundingClientRect();
    if (parentRect) {
      this.tooltipX = rect.left - parentRect.left + 14;
      this.tooltipY = rect.top - parentRect.top;
    }
  }

  onBarLeave() {
    this.hoveredPoint = null;
  }

  getCashFlowRatio(): number {
    const inFlow = this.moneySummary.customerCollection;
    const outFlow = this.moneySummary.supplierPayments;
    const total = inFlow + outFlow;
    if (total === 0) return 50;
    return Math.round((inFlow / total) * 100);
  }

  formatCurrency(value: number): string {
    if (isNaN(value)) return '0';
    return Number(value).toLocaleString('en-IN');
  }
}
