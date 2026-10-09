import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-stock-item-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>Stock Item Statement</h1>
            <p class="sub">Item chronological history</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-filter-bar">
            <div class="date-group">
              <label>Select Item</label>
              <select [(ngModel)]="selectedItemId" (change)="load()" style="padding: 5px 8px; border: 1px solid var(--surface-300); border-radius: 6px;">
                <option value="">-- Select Item --</option>
                @for (i of items; track i.id) {
                  <option [value]="i.id">{{ i.name }}</option>
                }
              </select>
            </div>
            <div class="date-group"><label>From</label><input type="date" [(ngModel)]="startDate" (change)="load()" /></div>
            <div class="date-group"><label>To</label><input type="date" [(ngModel)]="endDate" (change)="load()" /></div>
          </div>
          <button class="btn-secondary" onclick="window.print()" [disabled]="!selectedItemId"><i class="pi pi-print"></i> Print</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i>&nbsp;Fetching ledger statement...</div>
      }
      
      @if (error) {
        <div style="padding: 40px; text-align: center; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; margin-top: 20px;">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <h3>Failed to load report</h3>
          <p>Could not connect to the backend server. Please ensure the API server (Port 4000) is running.</p>
        </div>
      }

      @if (!loading && !error && !selectedItemId) {
        <div class="empty-state" style="padding: 60px; text-align: center; color: var(--surface-500);">
          <i class="pi pi-box" style="font-size: 3rem; margin-bottom: 10px; color: var(--surface-300);"></i>
          <p>Please select a stock item to view its statement.</p>
        </div>
      }

      @if (!loading && !error && selectedItemId && data) {
        <div class="net-result-bar" [class.profit]="data.closingQty >= 0" [class.loss]="data.closingQty < 0">
          <i class="pi pi-database"></i>
          <span>Closing Stock</span>
          <strong class="net-amount">{{ data.closingQty }} Unit(s)</strong>
          <span class="net-label">(Value: &#8377;{{ data.closingValue.toFixed(2) }})</span>
        </div>

        <div class="zeno-card">
          <div class="table-responsive">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher Type</th>
                  <th>Voucher No</th>
                  <th>Godown</th>
                  <th class="text-right">Qty In</th>
                  <th class="text-right">Qty Out</th>
                  <th class="text-right">Rate (&#8377;)</th>
                  <th class="text-right">Balance Qty</th>
                </tr>
              </thead>
              <tbody>
                @if (!data.entries || data.entries.length === 0) {
                  <tr><td colspan="8" class="text-center empty-cell">No transactions found for this period.</td></tr>
                }
                @for (entry of data.entries; track entry.id) {
                  <tr>
                    <td>{{ entry.entryDate | date:'dd MMM yyyy' }}</td>
                    <td>{{ entry.voucherType }}</td>
                    <td class="font-mono text-muted">{{ entry.voucherNo }}</td>
                    <td>{{ entry.godownName }}</td>
                    <td class="text-right font-mono text-success">{{ entry.qtyIn > 0 ? entry.qtyIn : '' }}</td>
                    <td class="text-right font-mono text-danger">{{ entry.qtyOut > 0 ? entry.qtyOut : '' }}</td>
                    <td class="text-right font-mono text-muted">{{ entry.unitRate > 0 ? entry.unitRate.toFixed(2) : '' }}</td>
                    <td class="text-right font-mono font-bold">{{ entry.runningQty }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" class="text-right"><strong>Total Movement</strong></td>
                  <td class="text-right font-mono text-success"><strong>{{ data.totalInQty }}</strong></td>
                  <td class="text-right font-mono text-danger"><strong>{{ data.totalOutQty }}</strong></td>
                  <td></td>
                  <td class="text-right font-mono"><strong>{{ data.closingQty }}</strong></td>
                </tr>
              </tfoot>
            </table>
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
    .btn-secondary[disabled] { opacity: 0.5; cursor: not-allowed; }
    .date-filter-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--surface-200); border-radius: 10px; padding: 10px 14px; }
    .date-group { display: flex; flex-direction: column; gap: 3px; }
    .date-group label { font-size: 0.7rem; font-weight: 600; color: var(--surface-500); text-transform: uppercase; }
    .date-group input, .date-group select { border: 1px solid var(--surface-300); border-radius: 6px; padding: 5px 8px; font-size: 0.85rem; }
    .loading-state { padding: 60px; text-align: center; color: var(--surface-500); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .net-result-bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 12px; font-size: 0.925rem; font-weight: 600; border: 1px solid transparent; }
    .net-result-bar.profit { background: #F0FDF4; border-color: #BBF7D0; color: #15803D; }
    .net-result-bar.loss { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
    .net-amount { font-size: 1.4rem; font-weight: 800; margin-left: 8px; }
    .net-label { font-weight: 400; font-size: 0.8rem; opacity: 0.7; }
    
    .zeno-card { background: #fff; border: 1px solid var(--surface-300); border-radius: 12px; margin-bottom: 0;}
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
  `]
})
export class StockItemReportComponent implements OnInit {
  loading = false;
  error = false;
  items: any[] = [];
  selectedItemId = '';
  startDate = '';
  endDate = '';
  data: any = null;
  Math = Math;

  constructor(private masters: MastersService, public tenant: TenantService) {}

  ngOnInit() {
    const now = new Date();
    const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.startDate = `${fy}-04-01`;
    this.endDate = `${fy + 1}-03-31`;

    this.tenant.loadHierarchy().subscribe({
      next: () => {
        const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
        if (compId) {
          this.masters.getItems(compId).subscribe(res => {
            this.items = res;
          });
        }
      }
    });
  }

  load() {
    if (!this.selectedItemId) {
      this.data = null;
      return;
    }
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    this.error = false;
    this.masters.getStockItemStatement(compId, this.selectedItemId, this.startDate, this.endDate).subscribe({
      next: (res) => { this.data = res; this.loading = false; },
      error: () => { this.loading = false; this.error = true; }
    });
  }
}
