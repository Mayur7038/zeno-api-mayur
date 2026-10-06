import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p2p-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports" title="Back to Reports"><i class="pi pi-arrow-left"></i></button>
          <h1>Trial Balance</h1>
        </div>
        <div>
          @if (isBalanced) {
            <span class="badge-pill badge-cleared" style="font-size: 0.875rem; padding: 6px 14px;">
              <i class="pi pi-check-circle"></i> Balanced (Dr == Cr)
            </span>
          } @else {
            <span class="badge-pill badge-cancelled" style="font-size: 0.875rem; padding: 6px 14px;">
              <i class="pi pi-exclamation-triangle"></i> Out of Balance
            </span>
          }
        </div>
      </div>

      <div class="zeno-card">
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Account / Ledger Name</th>
              <th class="text-right">Debit (Dr) ₹</th>
              <th class="text-right">Credit (Cr) ₹</th>
              <th class="text-right">Net Balance ₹</th>
            </tr>
          </thead>
          <tbody>
            @if (rows.length === 0) {
              <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No ledger transactions posted yet.
                </td>
              </tr>
            }
            @for (r of rows; track r.ledgerId) {
              <tr>
                <td class="font-bold">{{ r.ledgerName }}</td>
                <td class="text-right font-mono">{{ r.debit > 0 ? ('₹' + r.debit.toFixed(2)) : '—' }}</td>
                <td class="text-right font-mono">{{ r.credit > 0 ? ('₹' + r.credit.toFixed(2)) : '—' }}</td>
                <td class="text-right font-mono font-bold" [style.color]="r.balance >= 0 ? '#1e40af' : '#b91c1c'">
                  ₹{{ Math.abs(r.balance).toFixed(2) }} {{ r.balance >= 0 ? 'Dr' : 'Cr' }}
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr style="background: var(--surface-100); font-weight: 800; font-size: 0.9375rem;">
              <td>TOTAL</td>
              <td class="text-right font-mono" style="color: #1e40af;">₹{{ totalDebit.toFixed(2) }}</td>
              <td class="text-right font-mono" style="color: #b91c1c;">₹{{ totalCredit.toFixed(2) }}</td>
              <td class="text-right font-mono" style="color: #047857;">₹0.00</td>
            </tr>
          </tfoot>
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
export class TrialBalanceComponent implements OnInit {
  rows: any[] = [];
  totalDebit = 0;
  totalCredit = 0;
  isBalanced = true;
  Math = Math;

  constructor(
    private masters: MastersService,
    public tenant: TenantService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => this.loadTrialBalance(),
    });
  }

  loadTrialBalance() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getTrialBalance(compId).subscribe({
      next: (res) => {
        this.rows = res.rows || [];
        this.totalDebit = res.totalDebit || 0;
        this.totalCredit = res.totalCredit || 0;
        this.isBalanced = res.isBalanced;
      },
    });
  }
}
