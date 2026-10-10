import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-ledger-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>Ledger Statement</h1>
            <p class="sub">Account Activity Report</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-filter-bar">
            <div class="date-group">
              <label>Select Ledger</label>
              <select [(ngModel)]="selectedLedgerId" (change)="load()" style="padding: 5px 8px; border: 1px solid var(--surface-300); border-radius: 6px;">
                <option value="">-- Select Ledger --</option>
                @for (l of ledgers; track l.id) {
                  <option [value]="l.id">{{ l.name }}</option>
                }
              </select>
            </div>
            <div class="date-group"><label>From</label><input type="date" [(ngModel)]="startDate" (change)="load()" /></div>
            <div class="date-group"><label>To</label><input type="date" [(ngModel)]="endDate" (change)="load()" /></div>
          </div>
          <button class="btn-secondary" onclick="window.print()" [disabled]="!selectedLedgerId"><i class="pi pi-print"></i> Print</button>
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

      @if (!loading && !error && !selectedLedgerId) {
        <div class="empty-state" style="padding: 60px; text-align: center; color: var(--surface-500);">
          <i class="pi pi-book" style="font-size: 3rem; margin-bottom: 10px; color: var(--surface-300);"></i>
          <p>Please select a ledger to view its statement.</p>
        </div>
      }

      @if (!loading && !error && selectedLedgerId && data) {
        <div class="net-result-bar" [class.profit]="data.netBalance >= 0" [class.loss]="data.netBalance < 0">
          <i [class]="data.netBalance >= 0 ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'"></i>
          <span>Net Balance</span>
          <strong class="net-amount">&#8377;{{ Math.abs(data.netBalance).toFixed(2) }}</strong>
          <span class="net-label">({{ data.netBalance >= 0 ? 'Dr Balance' : 'Cr Balance' }})</span>
        </div>

        <div class="zeno-card">
          <div class="table-responsive">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher Type</th>
                  <th>Voucher No</th>
                  <th>Narration</th>
                  <th class="text-right">Debit (&#8377;)</th>
                  <th class="text-right">Credit (&#8377;)</th>
                </tr>
              </thead>
              <tbody>
                @if (!data.entries || data.entries.length === 0) {
                  <tr><td colspan="6" class="text-center empty-cell">No transactions found for this period.</td></tr>
                }
                @for (entry of data.entries; track entry.id) {
                  <tr>
                    <td>{{ entry.entryDate | date:'dd MMM yyyy' }}</td>
                    <td>{{ entry.voucherType }}</td>
                    <td class="font-mono text-muted">{{ entry.voucherNo }}</td>
                    <td>{{ entry.narration }}</td>
                    <td class="text-right font-mono text-success">{{ entry.debitAmount > 0 ? entry.debitAmount : '' }}</td>
                    <td class="text-right font-mono text-danger">{{ entry.creditAmount > 0 ? entry.creditAmount : '' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" class="text-right"><strong>Closing Totals</strong></td>
                  <td class="text-right font-mono text-success"><strong>&#8377;{{ (data.totalDebit||0).toFixed(2) }}</strong></td>
                  <td class="text-right font-mono text-danger"><strong>&#8377;{{ (data.totalCredit||0).toFixed(2) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './ledger-report.component.scss'
})
export class LedgerReportComponent implements OnInit {
  loading = false;
  error = false;
  ledgers: any[] = [];
  selectedLedgerId = '';
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
          this.masters.getLedgers(compId).subscribe(res => {
            this.ledgers = res;
          });
        }
      }
    });
  }

  load() {
    if (!this.selectedLedgerId) {
      this.data = null;
      return;
    }
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    this.error = false;
    this.masters.getLedgerStatement(compId, this.selectedLedgerId, this.startDate, this.endDate).subscribe({
      next: (res) => { this.data = res; this.loading = false; },
      error: () => { this.loading = false; this.error = true; }
    });
  }
}
