import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>Balance Sheet</h1>
            <p class="sub">Statement of Assets & Liabilities</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-filter-bar">
            <div class="date-group"><label>As of Date</label><input type="date" [(ngModel)]="asOfDate" (change)="load()" /></div>
          </div>
          <button class="btn-secondary" onclick="window.print()"><i class="pi pi-print"></i> Print</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i>&nbsp;Computing Balance Sheet...</div>
      }
      
      @if (error) {
        <div style="padding: 40px; text-align: center; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; margin-top: 20px;">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <h3>Failed to load report</h3>
          <p>Could not connect to the backend server. Please ensure the API server (Port 4000) is running.</p>
        </div>
      }

      @if (!loading && !error && data) {

        <div class="zeno-card t-format-container">
          <div class="t-format-side">
            <div class="t-format-header liability-header">
              <i class="pi pi-briefcase" style="margin-right: 8px;"></i> LIABILITIES
            </div>
            <div class="t-format-table-wrap">
              <table class="zeno-table t-format-table">
                <thead><tr><th>Particulars</th><th class="text-right" style="width: 120px;">Amount (&#8377;)</th></tr></thead>
                <tbody>
                  @if (!groupedLiabilities || groupedLiabilities.length === 0) {
                    <tr><td colspan="2" class="text-center empty-cell">No liability entries found.</td></tr>
                  }
                  @for (g of groupedLiabilities; track g.groupId) {
                    <tr (click)="toggleGroup(g)" style="cursor: pointer;" class="group-summary-row">
                      <td class="font-bold pl-4">
                        <i [class]="g.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" style="margin-right: 8px; font-size: 0.8rem;"></i>
                        {{ g.groupName }}
                      </td>
                      <td class="text-right font-mono text-danger font-bold">&#8377;{{ g.amount.toFixed(2) }}</td>
                    </tr>
                    @if (g.expanded) {
                      @for (row of g.ledgers; track row.ledgerId) {
                        <tr class="ledger-row">
                          <td class="pl-4" style="padding-left: 2rem; font-size: 0.82rem; color: var(--surface-600);">{{ row.ledgerName }}</td>
                          <td class="text-right font-mono text-danger" style="font-size: 0.82rem;">&#8377;{{ row.amount.toFixed(2) }}</td>
                        </tr>
                      }
                    }
                  }
                  @if ((data.totalAssets || 0) > (data.totalLiabilities || 0)) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Difference in Opening Balances</td><td class="text-right font-mono">&#8377;{{ ((data.totalAssets || 0) - (data.totalLiabilities || 0)).toFixed(2) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="t-format-total">
              <div class="total-label">TOTAL</div>
              <div class="total-amount">&#8377;{{ Math.max(data.totalAssets || 0, data.totalLiabilities || 0).toFixed(2) }}</div>
            </div>
          </div>
          
          <div class="t-format-side">
            <div class="t-format-header asset-header">
              <i class="pi pi-building" style="margin-right: 8px;"></i> ASSETS
            </div>
            <div class="t-format-table-wrap">
              <table class="zeno-table t-format-table">
                <thead><tr><th>Particulars</th><th class="text-right" style="width: 120px;">Amount (&#8377;)</th></tr></thead>
                <tbody>
                  @if (!groupedAssets || groupedAssets.length === 0) {
                    <tr><td colspan="2" class="text-center empty-cell">No asset entries found.</td></tr>
                  }
                  @for (g of groupedAssets; track g.groupId) {
                    <tr (click)="toggleGroup(g)" style="cursor: pointer;" class="group-summary-row">
                      <td class="font-bold pl-4">
                        <i [class]="g.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" style="margin-right: 8px; font-size: 0.8rem;"></i>
                        {{ g.groupName }}
                      </td>
                      <td class="text-right font-mono text-success font-bold">&#8377;{{ g.amount.toFixed(2) }}</td>
                    </tr>
                    @if (g.expanded) {
                      @for (row of g.ledgers; track row.ledgerId) {
                        <tr class="ledger-row">
                          <td class="pl-4" style="padding-left: 2rem; font-size: 0.82rem; color: var(--surface-600);">{{ row.ledgerName }}</td>
                          <td class="text-right font-mono text-success" style="font-size: 0.82rem;">&#8377;{{ row.amount.toFixed(2) }}</td>
                        </tr>
                      }
                    }
                  }
                  @if ((data.totalLiabilities || 0) > (data.totalAssets || 0)) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Difference in Opening Balances</td><td class="text-right font-mono">&#8377;{{ ((data.totalLiabilities || 0) - (data.totalAssets || 0)).toFixed(2) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="t-format-total">
              <div class="total-label">TOTAL</div>
              <div class="total-amount">&#8377;{{ Math.max(data.totalAssets || 0, data.totalLiabilities || 0).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .rpt-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .sub { font-size: 0.78rem; color: var(--surface-500); margin: 2px 0 0 0; }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: 6px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
    .btn-secondary { background: var(--surface-100); color: var(--surface-700); border: 1px solid var(--surface-300); padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .date-filter-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--surface-200); border-radius: 10px; padding: 10px 14px; }
    .date-group { display: flex; flex-direction: column; gap: 3px; }
    .date-group label { font-size: 0.7rem; font-weight: 600; color: var(--surface-500); text-transform: uppercase; }
    .date-group input { border: 1px solid var(--surface-300); border-radius: 6px; padding: 5px 8px; font-size: 0.85rem; }
    .loading-state { padding: 60px; text-align: center; color: var(--surface-500); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .net-result-bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 12px; font-size: 0.925rem; font-weight: 600; border: 1px solid transparent; }
    .net-result-bar.profit { background: #F0FDF4; border-color: #BBF7D0; color: #15803D; }
    .net-result-bar.loss { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
    .net-amount { font-size: 1.4rem; font-weight: 800; margin-left: 8px; }
    .net-label { font-weight: 400; font-size: 0.8rem; opacity: 0.7; }
    .pl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pl-card { border-radius: 12px; overflow: hidden; margin-bottom: 0; }
    .pl-card-header { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-bottom: 1px solid var(--surface-200); }
    .asset-header { background: #F0FDF4; }
    .liability-header { background: #FEF2F2; }
    .pl-card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; }
    .pl-card-header .header-total { font-size: 0.85rem; color: var(--surface-600); }
    .asset-header h3 { color: #15803D; }
    .liability-header h3 { color: #DC2626; }
    .header-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .header-icon.green { background: #DCFCE7; color: #16A34A; }
    .header-icon.red { background: #FEE2E2; color: #DC2626; }
    .zeno-card { background: #fff; border: 1px solid var(--surface-300); border-radius: 12px; }
    .table-responsive { overflow-x: auto; }
    .zeno-table { width: 100%; border-collapse: separate !important; border-spacing: 0 !important; font-size: 0.875rem; }
    .zeno-table th { background: var(--surface-100); padding: 10px 16px; color: var(--surface-700); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--surface-300) !important; border-right: 1px solid var(--surface-200) !important; white-space: nowrap; }
    .zeno-table th:last-child { border-right: none !important; }
    .zeno-table td { padding: 11px 16px; border-bottom: 1px solid var(--surface-200) !important; border-right: 1px solid var(--surface-200) !important; color: var(--surface-800); vertical-align: middle; }
    .zeno-table td:last-child { border-right: none !important; }
    .zeno-table tr:last-child td { border-bottom: none !important; }
    .zeno-table tfoot td { border-top: 2px solid var(--surface-300) !important; background: var(--surface-50); }
    .total-row td { font-weight: 700; padding: 12px 16px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-muted { color: var(--surface-500); font-size: 0.82rem; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16A34A; }
    .text-danger { color: #DC2626; }
    .empty-cell { padding: 32px !important; color: var(--surface-400); font-style: italic; }
    .group-summary-row:hover { background: var(--surface-50); }
    .ledger-row { background: #fafafa; }
    .t-format-container { display: flex; width: 100%; min-height: 400px; background: #fff; overflow: hidden; align-items: stretch; }
    .t-format-side { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .t-format-side:first-child { border-right: 1px solid var(--surface-300); }
    .t-format-header { padding: 14px 16px; font-weight: 700; font-size: 0.9rem; text-align: center; border-bottom: 1px solid var(--surface-200); }
    .t-format-table-wrap { flex: 1; }
    .t-format-table { border: none !important; }
    .t-format-table th { border-top: none !important; }
    .t-format-table tr:last-child td { border-bottom: none !important; }
    .t-format-total { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--surface-50); border-top: 2px solid var(--surface-300); }
    .total-label { font-weight: 800; font-size: 0.9rem; color: var(--surface-800); text-transform: uppercase; }
    .total-amount { font-weight: 800; font-size: 1.1rem; color: var(--surface-900); font-family: monospace; }
  `]
})
export class BalanceSheetComponent implements OnInit {
  loading = false;
  error = false;
  data: any = null;
  asOfDate = '';
  Math = Math;
  
  groupedLiabilities: any[] = [];
  groupedAssets: any[] = [];

  constructor(private masters: MastersService, public tenant: TenantService) {}

  ngOnInit() {
    const now = new Date();
    this.asOfDate = now.toISOString().split('T')[0];
    this.tenant.loadHierarchy().subscribe({ next: () => this.load() });
  }

  load() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    this.error = false;
    this.masters.getBalanceSheet(compId, this.asOfDate).subscribe({
      next: (res) => { 
        this.data = res; 
        this.groupData();
        this.loading = false; 
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }

  groupData() {
    this.groupedLiabilities = this.groupByGroup(this.data.liabilityRows || []);
    this.groupedAssets = this.groupByGroup(this.data.assetRows || []);
  }

  groupByGroup(rows: any[]) {
    const groupsMap = new Map<string, any>();
    for (const r of rows) {
      if (!groupsMap.has(r.groupId)) {
        groupsMap.set(r.groupId, {
          groupId: r.groupId,
          groupName: r.groupName,
          amount: 0,
          expanded: false,
          ledgers: []
        });
      }
      const g = groupsMap.get(r.groupId);
      g.amount += r.amount;
      g.ledgers.push(r);
    }
    return Array.from(groupsMap.values());
  }

  toggleGroup(g: any) {
    g.expanded = !g.expanded;
  }
}
