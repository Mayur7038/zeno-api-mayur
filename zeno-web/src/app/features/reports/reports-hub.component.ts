import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ReportCard {
  id: string;
  title: string;
  category: string;
  categoryKey: 'financial' | 'inventory' | 'purchase' | 'sales' | 'tax' | 'manufacturing';
  description: string;
  icon: string;
  iconColor: 'blue' | 'green' | 'orange' | 'purple' | 'emerald' | 'amber';
  route?: string;
  actionText: string;
  badge?: string;
}

@Component({
  selector: 'app-reports-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="reports-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1>Reports</h1>
        </div>
        <div class="header-actions">
          <div class="search-wrap">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>
      </div>

      <!-- CATEGORY PILLS BAR -->
      <div class="category-tabs">
        <button
          [class.active]="selectedCategory === 'ALL'"
          (click)="selectedCategory = 'ALL'"
        >
          All ({{ reports.length }})
        </button>
        <button
          [class.active]="selectedCategory === 'financial'"
          (click)="selectedCategory = 'financial'"
        >
          <i class="pi pi-dollar"></i> Financial
        </button>
        <button
          [class.active]="selectedCategory === 'inventory'"
          (click)="selectedCategory = 'inventory'"
        >
          <i class="pi pi-box"></i> Inventory
        </button>
        <button
          [class.active]="selectedCategory === 'purchase'"
          (click)="selectedCategory = 'purchase'"
        >
          <i class="pi pi-shopping-cart"></i> Purchases
        </button>
        <button
          [class.active]="selectedCategory === 'sales'"
          (click)="selectedCategory = 'sales'"
        >
          <i class="pi pi-shopping-bag"></i> Sales
        </button>
        <button
          [class.active]="selectedCategory === 'tax'"
          (click)="selectedCategory = 'tax'"
        >
          <i class="pi pi-percentage"></i> Tax & GST
        </button>
        <button
          [class.active]="selectedCategory === 'manufacturing'"
          (click)="selectedCategory = 'manufacturing'"
        >
          <i class="pi pi-cog"></i> Manufacturing
        </button>
      </div>

      <!-- REPORTS GRID -->
      <div class="reports-grid">
        @if (filteredReports.length === 0) {
          <div class="no-reports-card zeno-card">
            <i class="pi pi-search" style="font-size: 2rem; color: var(--surface-400);"></i>
            <p>No reports matched your search keyword.</p>
          </div>
        }
        @for (rep of filteredReports; track rep.id) {
          @if (rep.route) {
            <a class="report-card zeno-card" [routerLink]="rep.route">
              <h3 class="report-title">{{ rep.title }}</h3>
              <p class="report-desc">{{ rep.description }}</p>
            </a>
          } @else {
            <div class="report-card zeno-card" (click)="openQuickModal(rep)">
              <h3 class="report-title">{{ rep.title }}</h3>
              <p class="report-desc">{{ rep.description }}</p>
            </div>
          }
        }
      </div>

      <!-- QUICK PREVIEW MODAL FOR MODAL-BASED REPORTS -->
      @if (activeReportModal) {
        <div class="modal-backdrop" (click)="activeReportModal = null">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ activeReportModal.title }}</h2>
              <button class="btn-close" (click)="activeReportModal = null"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="modal-info-box">
                <i [class]="activeReportModal.icon" style="font-size: 1.5rem; color: var(--primary-600)"></i>
                <div>
                  <strong>{{ activeReportModal.category }}</strong>
                  <p style="margin: 4px 0 0 0; color: var(--surface-600); font-size: 0.85rem;">{{ activeReportModal.description }}</p>
                </div>
              </div>

              <div class="report-preview-placeholder">
                <div class="kpi-mini-grid">
                  <div class="kpi-mini">
                    <span class="label">Date Range</span>
                    <strong>Current Fiscal Year (2026-27)</strong>
                  </div>
                  <div class="kpi-mini">
                    <span class="label">Status</span>
                    <strong class="text-success"><i class="pi pi-check"></i> Reconciled & Audited</strong>
                  </div>
                </div>
                <div class="empty-preview-text">
                  <i class="pi pi-chart-line" style="font-size: 2.2rem; color: var(--surface-400); margin-bottom: 8px; display: block;"></i>
                  This detailed statement is generated dynamically from double-entry GL ledgers.
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="activeReportModal = null">Close</button>
              <button class="btn-primary" onclick="window.print()"><i class="pi pi-print"></i> Print Report</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; }

    .search-wrap { position: relative; width: 340px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .search-wrap input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; outline: none; background: #fff; }
    .search-wrap input:focus { border-color: var(--primary-600); }

    .category-tabs { display: flex; gap: 8px; flex-wrap: wrap; background: #fff; padding: 10px 14px; border: 1px solid var(--surface-200); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .category-tabs button { border: 1px solid var(--surface-200); background: var(--surface-50); color: var(--surface-700); padding: 7px 14px; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; }
    .category-tabs button:hover { background: var(--surface-100); color: var(--surface-900); }
    .category-tabs button.active { background: var(--primary-600); color: #fff; border-color: var(--primary-600); box-shadow: 0 2px 4px rgba(37,99,235,0.2); }

    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .report-card {
      background: #fff;
      border: 1px solid var(--surface-200);
      border-radius: 12px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0,0,0,0.07);
      border-color: var(--primary-400);
    }
    .report-card:hover .report-title {
      color: var(--primary-600);
    }

    .report-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 6px 0;
      transition: color 0.15s ease;
    }
    .report-desc {
      font-size: 0.84rem;
      color: var(--surface-600);
      line-height: 1.45;
      margin: 0;
    }

    .no-reports-card { grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--surface-500); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
    .modal-content { background: #fff; border-radius: 14px; width: 650px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .modal-header { padding: 18px 24px; border-bottom: 1px solid var(--surface-200); display: flex; justify-content: space-between; align-items: center; h2 { font-size: 1.2rem; margin: 0; font-weight: 700; } }
    .btn-close { background: transparent; border: none; font-size: 1.25rem; color: var(--surface-400); cursor: pointer; }
    .modal-body { padding: 24px; flex: 1; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--surface-200); display: flex; justify-content: flex-end; gap: 12px; background: var(--surface-50); }
    .modal-info-box { display: flex; align-items: center; gap: 14px; background: var(--surface-50); border: 1px solid var(--surface-200); padding: 14px; border-radius: 8px; margin-bottom: 18px; }
    .report-preview-placeholder { border: 1px dashed var(--surface-300); border-radius: 8px; padding: 20px; background: #fafafa; }
    .kpi-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .kpi-mini { background: #fff; border: 1px solid var(--surface-200); border-radius: 6px; padding: 10px 14px; .label { font-size: 0.72rem; color: var(--surface-500); text-transform: uppercase; display: block; margin-bottom: 2px; } }
    .empty-preview-text { text-align: center; color: var(--surface-500); font-size: 0.85rem; padding: 20px 0; }

    .btn-primary { background: #2563EB; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { background: #1D4ED8; }
    .btn-secondary { background: var(--surface-100); color: var(--surface-700); border: 1px solid var(--surface-300); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .text-success { color: #16A34A; }
  `]
})
export class ReportsHubComponent implements OnInit {
  searchQuery = '';
  selectedCategory = 'ALL';
  activeReportModal: ReportCard | null = null;

  reports: ReportCard[] = [
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      category: 'Financial',
      categoryKey: 'financial',
      description: 'Ledger debit and credit balances summary.',
      icon: 'pi pi-chart-bar',
      iconColor: 'blue',
      route: '/reports/trial-balance',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'stock-summary',
      title: 'Stock Summary',
      category: 'Inventory',
      categoryKey: 'inventory',
      description: 'Current item quantities and stock valuation.',
      icon: 'pi pi-database',
      iconColor: 'green',
      route: '/reports/stock-summary',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'stock-item-statement',
      title: 'Stock Item Statement',
      category: 'Inventory',
      categoryKey: 'inventory',
      description: 'Chronological history of stock item movement.',
      icon: 'pi pi-box',
      iconColor: 'emerald',
      route: '/reports/stock-item-statement',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      category: 'Financial',
      categoryKey: 'financial',
      description: 'Income, expense, and net profit statement.',
      icon: 'pi pi-chart-line',
      iconColor: 'emerald',
      route: '/reports/profit-loss',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      category: 'Financial',
      categoryKey: 'financial',
      description: 'Assets, liabilities, and capital equity.',
      icon: 'pi pi-book',
      iconColor: 'purple',
      route: '/reports/balance-sheet',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'ledger-statement',
      title: 'Ledger Statement',
      category: 'Financial',
      categoryKey: 'financial',
      description: 'Account activity and statement report.',
      icon: 'pi pi-list',
      iconColor: 'blue',
      route: '/reports/ledger-statement',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'purchase-register',
      title: 'Purchase Register',
      category: 'Purchases',
      categoryKey: 'purchase',
      description: 'Vendor bills and inward purchase history.',
      icon: 'pi pi-receipt',
      iconColor: 'orange',
      route: '/procure-to-pay/purchase-invoices',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'vendor-ageing',
      title: 'Payables Ageing',
      category: 'Purchases',
      categoryKey: 'purchase',
      description: 'Overdue vendor balances by ageing buckets.',
      icon: 'pi pi-credit-card',
      iconColor: 'amber',
      route: '/procure-to-pay/vendor-payments',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'sales-register',
      title: 'Sales Register',
      category: 'Sales',
      categoryKey: 'sales',
      description: 'Customer invoices and sales turnover.',
      icon: 'pi pi-shopping-bag',
      iconColor: 'blue',
      route: '/sales/sales-invoices',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'customer-ageing',
      title: 'Receivables Ageing',
      category: 'Sales',
      categoryKey: 'sales',
      description: 'Outstanding customer dues and collections.',
      icon: 'pi pi-wallet',
      iconColor: 'green',
      route: '/sales/customer-receipts',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'gstr1-summary',
      title: 'GSTR-1 Summary',
      category: 'Tax & GST',
      categoryKey: 'tax',
      description: 'Outward supplies and GST return turnover.',
      icon: 'pi pi-percentage',
      iconColor: 'purple',
      route: '/reports/gstr1-summary',
      actionText: 'View Report',
    },
    {
      id: 'gstr3b-summary',
      title: 'GSTR-3B Summary',
      category: 'Tax & GST',
      categoryKey: 'tax',
      description: 'Tax liability and Input Tax Credit (ITC).',
      icon: 'pi pi-file-edit',
      iconColor: 'emerald',
      route: '/reports/gstr3b-summary',
      actionText: 'View Report',
    },
    {
      id: 'production-register',
      title: 'Production Register',
      category: 'Manufacturing',
      categoryKey: 'manufacturing',
      description: 'Assembly runs and component consumption.',
      icon: 'pi pi-sync',
      iconColor: 'orange',
      route: '/manufacturing/production-entries',
      actionText: 'View Report',
      badge: 'Live',
    },
    {
      id: 'bom-costing',
      title: 'BOM Costing',
      category: 'Manufacturing',
      categoryKey: 'manufacturing',
      description: 'Recipe costs and component breakdown.',
      icon: 'pi pi-list',
      iconColor: 'blue',
      route: '/manufacturing/boms',
      actionText: 'View Report',
      badge: 'Live',
    },
  ];

  ngOnInit() {}

  get filteredReports(): ReportCard[] {
    return this.reports.filter((r) => {
      const matchCat = this.selectedCategory === 'ALL' || r.categoryKey === this.selectedCategory;
      const matchSearch =
        !this.searchQuery.trim() ||
        r.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  openQuickModal(rep: ReportCard) {
    this.activeReportModal = rep;
  }
}
