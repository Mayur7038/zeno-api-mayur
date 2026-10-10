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
  styleUrl: './balance-sheet.component.scss'
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
