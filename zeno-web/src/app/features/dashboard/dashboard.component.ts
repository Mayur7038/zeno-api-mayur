import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { P2pService } from '../../core/services/p2p.service';
import { TenantService } from '../../core/services/tenant.service';
import { MastersService } from '../../core/services/masters.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- HEADER -->
      <div class="page-header">
        <h1>Operations & Procurement Dashboard</h1>
        <div class="header-actions">
          <a routerLink="/procure-to-pay/purchase-orders" class="btn-primary">
            <i class="pi pi-plus"></i> New Purchase Order
          </a>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-blue">
            <i class="pi pi-shopping-bag"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Purchase Invoices</span>
            <span class="kpi-value font-mono">₹{{ totalPurchases.toLocaleString() }}</span>
            <span class="kpi-subtext">{{ invoicesCount }} Invoices Posted</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">
            <i class="pi pi-clock"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Pending Purchase Orders</span>
            <span class="kpi-value">{{ pendingOrdersCount }}</span>
            <span class="kpi-subtext">Awaiting GRN Receipt</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-emerald">
            <i class="pi pi-database"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Live Warehouse Inventory</span>
            <span class="kpi-value font-mono">₹{{ totalStockValuation.toLocaleString() }}</span>
            <span class="kpi-subtext">{{ totalStockItems }} SKUs Tracked</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-purple">
            <i class="pi pi-credit-card"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Outstanding Payables</span>
            <span class="kpi-value font-mono">₹{{ outstandingPayables.toLocaleString() }}</span>
            <span class="kpi-subtext">Pending Vendor Bills</span>
          </div>
        </div>
      </div>

      <!-- WORKFLOW CAROUSEL / QUICK PATH -->
      <div class="zeno-card p2p-flow-card">
        <div class="flow-header">
          <h3>Procure-to-Pay Core Workflow</h3>
          <span class="flow-desc">Follow standard enterprise procurement progression</span>
        </div>
        <div class="flow-steps">
          <a routerLink="/procure-to-pay/purchase-orders" class="flow-step">
            <div class="step-num">1</div>
            <div class="step-info">
              <span class="step-title">Purchase Order</span>
              <span class="step-desc">Order intent & pricing</span>
            </div>
            <i class="pi pi-chevron-right step-arrow"></i>
          </a>

          <a routerLink="/procure-to-pay/goods-receipt-notes" class="flow-step">
            <div class="step-num">2</div>
            <div class="step-info">
              <span class="step-title">Goods Receipt (GRN)</span>
              <span class="step-desc">Stock In & verification</span>
            </div>
            <i class="pi pi-chevron-right step-arrow"></i>
          </a>

          <a routerLink="/procure-to-pay/purchase-invoices" class="flow-step">
            <div class="step-num">3</div>
            <div class="step-info">
              <span class="step-title">Purchase Invoice</span>
              <span class="step-desc">Tax & ledger entry</span>
            </div>
            <i class="pi pi-chevron-right step-arrow"></i>
          </a>

          <a routerLink="/procure-to-pay/vendor-payments" class="flow-step">
            <div class="step-num">4</div>
            <div class="step-info">
              <span class="step-title">Vendor Payment</span>
              <span class="step-desc">Bill allocation & clearing</span>
            </div>
          </a>
        </div>
      </div>

      <!-- RECENT TRANSACTIONS TABLE -->
      <div class="zeno-card recent-card">
        <div class="card-header">
          <h3>Recent Purchase Invoices</h3>
          <a routerLink="/procure-to-pay/purchase-invoices" class="view-all-link">View All <i class="pi pi-arrow-right"></i></a>
        </div>

        <table class="zeno-table">
          <thead>
            <tr>
              <th>Voucher No</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Taxable</th>
              <th>Tax (GST)</th>
              <th>Grand Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @if (recentInvoices.length === 0) {
              <tr>
                <td colspan="7" class="text-center" style="padding: 32px; color: var(--surface-500);">
                  No invoices recorded yet. Create your first Purchase Order or Purchase Invoice.
                </td>
              </tr>
            }
            @for (inv of recentInvoices; track inv.id) {
              <tr>
                <td class="font-mono font-bold">{{ inv.voucherNo }}</td>
                <td>{{ inv.invoiceDate }}</td>
                <td>{{ inv.vendorLedger?.name || 'Vendor' }}</td>
                <td class="font-mono">₹{{ inv.taxableTotal }}</td>
                <td class="font-mono">₹{{ (+inv.cgstTotal + +inv.sgstTotal + +inv.igstTotal) }}</td>
                <td class="font-mono font-bold">₹{{ inv.grandTotal }}</td>
                <td>
                  <span class="badge-pill" [ngClass]="{
                    'badge-paid': inv.status === 'PAID',
                    'badge-partial': inv.status === 'PARTIALLY_PAID',
                    'badge-pending': inv.status === 'PENDING'
                  }">
                    {{ inv.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin: 0;
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-subtle);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.icon-blue { background-color: var(--primary-50); color: var(--primary-600); }
      &.icon-amber { background-color: #fef3c7; color: #b45309; }
      &.icon-emerald { background-color: #ecfdf5; color: #047857; }
      &.icon-purple { background-color: #f3e8ff; color: #7e22ce; }
    }

    .kpi-content {
      display: flex;
      flex-direction: column;

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--surface-500);
      }

      .kpi-value {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--surface-900);
        margin: 2px 0;
      }

      .kpi-subtext {
        font-size: 0.75rem;
        color: var(--surface-400);
      }
    }

    .p2p-flow-card {
      padding: 20px 24px;

      .flow-header {
        margin-bottom: 16px;
        h3 { font-size: 1rem; font-weight: 700; color: var(--surface-900); }
        .flow-desc { font-size: 0.8125rem; color: var(--surface-500); }
      }

      .flow-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .flow-step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--surface-50);
        border: 1px solid var(--surface-200);
        border-radius: var(--radius-sm);
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          background: var(--primary-50);
          border-color: var(--primary-300);
          transform: translateY(-1px);
        }

        .step-num {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background-color: var(--primary-600);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
        }

        .step-info {
          display: flex;
          flex-direction: column;
          flex: 1;

          .step-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--surface-900);
          }

          .step-desc {
            font-size: 0.6875rem;
            color: var(--surface-500);
          }
        }

        .step-arrow {
          color: var(--surface-400);
          font-size: 0.75rem;
        }
      }
    }

    .recent-card {
      .card-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--surface-200);
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--surface-900);
        }

        .view-all-link {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary-600);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  totalPurchases = 0;
  invoicesCount = 0;
  pendingOrdersCount = 0;
  totalStockValuation = 0;
  totalStockItems = 0;
  outstandingPayables = 0;
  recentInvoices: any[] = [];

  constructor(
    private p2p: P2pService,
    private tenant: TenantService,
    private masters: MastersService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => this.loadData(),
    });
  }

  loadData() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    // Load Invoices
    this.p2p.getPurchaseInvoices(compId).subscribe({
      next: (invoices) => {
        this.recentInvoices = invoices.slice(0, 5);
        this.invoicesCount = invoices.length;
        this.totalPurchases = invoices.reduce((s, i) => s + Number(i.grandTotal || 0), 0);
        this.outstandingPayables = invoices
          .filter((i) => i.status !== 'PAID')
          .reduce((s, i) => s + (Number(i.grandTotal) - Number(i.paidAmount || 0)), 0);
      },
    });

    // Load Pending Orders
    this.p2p.getPurchaseOrders(compId, 'PENDING').subscribe({
      next: (orders) => {
        this.pendingOrdersCount = orders.length;
      },
    });

    // Load Stock Summary
    this.masters.getStockSummary(compId).subscribe({
      next: (stock) => {
        this.totalStockItems = stock.length;
        this.totalStockValuation = stock.reduce((s, item) => s + Number(item.totalValue || 0), 0);
      },
    });
  }
}
