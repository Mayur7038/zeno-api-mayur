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
  styleUrl: './stock-item-report.component.scss'
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
