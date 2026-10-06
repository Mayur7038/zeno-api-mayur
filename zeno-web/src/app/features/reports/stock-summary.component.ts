import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stock-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p2p-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports" title="Back to Reports"><i class="pi pi-arrow-left"></i></button>
          <h1>Stock Summary</h1>
        </div>
        <div>
          <span class="badge-pill badge-cleared" style="font-size: 0.875rem; padding: 6px 14px;">
            <i class="pi pi-database"></i> Total Valuation: ₹{{ grandValuation.toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="zeno-card">
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Item / SKU</th>
              <th>SKU Code</th>
              <th>Unit</th>
              <th class="text-right">Available Stock</th>
              <th class="text-right">Average Rate ₹</th>
              <th class="text-right">Total Inventory Value ₹</th>
            </tr>
          </thead>
          <tbody>
            @if (items.length === 0) {
              <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No stock items in inventory. Receive items via GRN to update stock ledger.
                </td>
              </tr>
            }
            @for (item of items; track item.itemId) {
              <tr>
                <td class="font-bold">{{ item.itemName }}</td>
                <td class="font-mono">{{ item.sku || '—' }}</td>
                <td>{{ item.unit }}</td>
                <td class="text-right font-mono font-bold" style="color: #047857;">
                  {{ item.currentStock }} {{ item.unit }}
                </td>
                <td class="text-right font-mono">₹{{ item.averageRate.toFixed(2) }}</td>
                <td class="text-right font-mono font-bold">₹{{ item.totalValue.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .p2p-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; } }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: var(--radius-sm, 6px); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; transition: all 0.15s ease; &:hover { background: var(--surface-200); color: var(--surface-900); } }
  `],
})
export class StockSummaryComponent implements OnInit {
  items: any[] = [];
  grandValuation = 0;

  constructor(
    private masters: MastersService,
    public tenant: TenantService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => this.loadStock(),
    });
  }

  loadStock() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getStockSummary(compId).subscribe({
      next: (res) => {
        this.items = res || [];
        this.grandValuation = this.items.reduce((s, i) => s + Number(i.totalValue || 0), 0);
      },
    });
  }
}
