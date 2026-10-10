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
  styleUrl: './reports-hub.component.scss'
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
