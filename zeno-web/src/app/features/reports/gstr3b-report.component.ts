import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-gstr3b-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>GSTR-3B Summary</h1>
            <p class="sub">Summary of Tax Liability and Eligible ITC</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-filter-bar">
            <div class="date-group"><label>From</label><input type="date" [(ngModel)]="startDate" (change)="load()" /></div>
            <div class="date-group"><label>To</label><input type="date" [(ngModel)]="endDate" (change)="load()" /></div>
          </div>
          <button class="btn-secondary" onclick="window.print()"><i class="pi pi-print"></i> Print</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i>&nbsp;Calculating GSTR-3B...</div>
      }

      @if (!loading && data) {
        <div class="zeno-card">
          <div class="table-responsive">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Nature of Supplies</th>
                  <th class="text-right">Total Taxable Value (&#8377;)</th>
                  <th class="text-right">Integrated Tax (&#8377;)</th>
                  <th class="text-right">Central Tax (&#8377;)</th>
                  <th class="text-right">State/UT Tax (&#8377;)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="5" style="background: var(--surface-100); font-weight: bold;">3.1 Details of Outward Supplies and inward supplies liable to reverse charge</td></tr>
                <tr>
                  <td>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                  <td class="text-right font-mono">{{ data.outward.taxable.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.outward.igst.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.outward.cgst.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.outward.sgst.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td>(b) Outward taxable supplies (zero rated)</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                </tr>
                <tr>
                  <td>(c) Other outward supplies (Nil rated, exempted)</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                  <td class="text-right font-mono">0.00</td>
                </tr>

                <tr><td colspan="5" style="background: var(--surface-100); font-weight: bold;">4. Eligible ITC</td></tr>
                <tr>
                  <td>(A) ITC Available (whether in full or part) - All other ITC</td>
                  <td class="text-right font-mono">{{ data.inward.taxable.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.inward.igst.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.inward.cgst.toFixed(2) }}</td>
                  <td class="text-right font-mono">{{ data.inward.sgst.toFixed(2) }}</td>
                </tr>
                
                <tr class="total-row">
                  <td class="text-right"><strong>Net Tax Payable (Outward - ITC)</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="text-right font-mono font-bold" [class.text-danger]="(data.outward.igst - data.inward.igst) > 0" [class.text-success]="(data.outward.igst - data.inward.igst) <= 0">{{ (data.outward.igst - data.inward.igst).toFixed(2) }}</td>
                  <td class="text-right font-mono font-bold" [class.text-danger]="(data.outward.cgst - data.inward.cgst) > 0" [class.text-success]="(data.outward.cgst - data.inward.cgst) <= 0">{{ (data.outward.cgst - data.inward.cgst).toFixed(2) }}</td>
                  <td class="text-right font-mono font-bold" [class.text-danger]="(data.outward.sgst - data.inward.sgst) > 0" [class.text-success]="(data.outward.sgst - data.inward.sgst) <= 0">{{ (data.outward.sgst - data.inward.sgst).toFixed(2) }}</td>
                </tr>
              </tbody>
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
    .date-filter-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--surface-200); border-radius: 10px; padding: 10px 14px; }
    .date-group { display: flex; flex-direction: column; gap: 3px; }
    .date-group label { font-size: 0.7rem; font-weight: 600; color: var(--surface-500); text-transform: uppercase; }
    .date-group input { border: 1px solid var(--surface-300); border-radius: 6px; padding: 5px 8px; font-size: 0.85rem; }
    .loading-state { padding: 60px; text-align: center; color: var(--surface-500); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 10px; }
    
    .zeno-card { background: #fff; border: 1px solid var(--surface-300); border-radius: 12px; margin-bottom: 0;}
    .table-responsive { overflow-x: auto; }
    .zeno-table { width: 100%; border-collapse: separate !important; border-spacing: 0 !important; font-size: 0.875rem; }
    .zeno-table th { background: var(--surface-100); padding: 10px 16px; color: var(--surface-700); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; border-bottom: 1px solid var(--surface-300); }
    .zeno-table td { padding: 11px 16px; border-bottom: 1px solid var(--surface-200); color: var(--surface-800); }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-muted { color: var(--surface-500); }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .total-row td { border-top: 2px solid var(--surface-300); background: var(--surface-50); padding: 14px 16px; }
    .text-danger { color: #DC2626; }
    .text-success { color: #16A34A; }
  `]
})
export class Gstr3bReportComponent implements OnInit {
  loading = false;
  startDate = '';
  endDate = '';
  data: any = null;

  constructor(private api: ApiService, public tenant: TenantService) {}

  ngOnInit() {
    const now = new Date();
    const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.startDate = `${fy}-04-01`;
    this.endDate = `${fy + 1}-03-31`;

    this.tenant.loadHierarchy().subscribe({
      next: () => this.load()
    });
  }

  load() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    
    const sales$ = this.api.get<any[]>(`/sales/sales-invoices?companyId=${compId}`);
    const purchases$ = this.api.get<any[]>(`/procure-to-pay/purchase-invoices?companyId=${compId}`);
    
    forkJoin([sales$, purchases$]).subscribe({
      next: ([salesRes, purchaseRes]) => {
        const start = new Date(this.startDate).getTime();
        const end = new Date(this.endDate).getTime();
        
        let outTaxable = 0; let outCgst = 0; let outSgst = 0; let outIgst = 0;
        salesRes.forEach(inv => {
          if (inv.status === 'CANCELLED') return;
          const dt = new Date(inv.invoiceDate).getTime();
          if (dt >= start && dt <= end) {
            outTaxable += Number(inv.taxableTotal || 0);
            outCgst += Number(inv.cgstTotal || 0);
            outSgst += Number(inv.sgstTotal || 0);
            outIgst += Number(inv.igstTotal || 0);
          }
        });

        let inTaxable = 0; let inCgst = 0; let inSgst = 0; let inIgst = 0;
        purchaseRes.forEach(inv => {
          if (inv.status === 'CANCELLED') return;
          const dt = new Date(inv.invoiceDate).getTime();
          if (dt >= start && dt <= end) {
            inTaxable += Number(inv.taxableTotal || 0);
            inCgst += Number(inv.cgstTotal || 0);
            inSgst += Number(inv.sgstTotal || 0);
            inIgst += Number(inv.igstTotal || 0);
          }
        });

        this.data = {
          outward: { taxable: outTaxable, cgst: outCgst, sgst: outSgst, igst: outIgst },
          inward: { taxable: inTaxable, cgst: inCgst, sgst: inSgst, igst: inIgst }
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
