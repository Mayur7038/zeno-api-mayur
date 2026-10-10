import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-gstr1-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>GSTR-1 Report</h1>
            <p class="sub">Details of outward supplies of goods or services</p>
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
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i>&nbsp;Calculating GSTR-1...</div>
      }

      @if (!loading && data) {
        <div class="zeno-card summary-cards" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; padding: 20px;">
          <div class="summary-box">
            <div class="title">Total Invoices</div>
            <div class="val">{{ data.totalInvoices }}</div>
          </div>
          <div class="summary-box">
            <div class="title">Taxable Value (&#8377;)</div>
            <div class="val">{{ data.taxableValue.toFixed(2) }}</div>
          </div>
          <div class="summary-box">
            <div class="title">CGST (&#8377;)</div>
            <div class="val">{{ data.cgst.toFixed(2) }}</div>
          </div>
          <div class="summary-box">
            <div class="title">SGST (&#8377;)</div>
            <div class="val">{{ data.sgst.toFixed(2) }}</div>
          </div>
          <div class="summary-box">
            <div class="title">IGST (&#8377;)</div>
            <div class="val">{{ data.igst.toFixed(2) }}</div>
          </div>
        </div>

        <div class="zeno-card">
          <div class="table-responsive">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>GSTIN</th>
                  <th class="text-right">Taxable Val</th>
                  <th class="text-right">CGST</th>
                  <th class="text-right">SGST</th>
                  <th class="text-right">IGST</th>
                  <th class="text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody>
                @if (data.invoices.length === 0) {
                  <tr><td colspan="9" class="text-center empty-cell">No outward supplies found for this period.</td></tr>
                }
                @for (inv of data.invoices; track inv.id) {
                  <tr>
                    <td class="font-bold">{{ inv.voucherNo }}</td>
                    <td>{{ inv.invoiceDate | date:'dd MMM yyyy' }}</td>
                    <td>{{ inv.customerName }}</td>
                    <td class="font-mono">{{ inv.customerGstin || 'URD' }}</td>
                    <td class="text-right font-mono">{{ inv.taxableTotal.toFixed(2) }}</td>
                    <td class="text-right font-mono text-muted">{{ inv.cgstTotal.toFixed(2) }}</td>
                    <td class="text-right font-mono text-muted">{{ inv.sgstTotal.toFixed(2) }}</td>
                    <td class="text-right font-mono text-muted">{{ inv.igstTotal.toFixed(2) }}</td>
                    <td class="text-right font-bold font-mono">&#8377;{{ inv.grandTotal.toFixed(2) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './gstr1-report.component.scss'
})
export class Gstr1ReportComponent implements OnInit {
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
    
    this.api.get<any[]>(`/sales/sales-invoices?companyId=${compId}`).subscribe({
      next: (res) => {
        // Filter by date
        const start = new Date(this.startDate).getTime();
        const end = new Date(this.endDate).getTime();
        
        let filtered = res.filter(inv => {
          if (inv.status === 'CANCELLED') return false;
          const invDate = new Date(inv.invoiceDate).getTime();
          return invDate >= start && invDate <= end;
        });
        
        // Sort by date ascending
        filtered.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());

        let taxable = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        
        const invoices = filtered.map(inv => {
          const t = Number(inv.taxableTotal || 0);
          const c = Number(inv.cgstTotal || 0);
          const s = Number(inv.sgstTotal || 0);
          const i = Number(inv.igstTotal || 0);
          
          taxable += t;
          cgst += c;
          sgst += s;
          igst += i;
          
          return {
            id: inv.id,
            voucherNo: inv.voucherNo,
            invoiceDate: inv.invoiceDate,
            customerName: inv.customerLedger?.name || 'Cash',
            customerGstin: inv.customerLedger?.gstin || '',
            taxableTotal: t,
            cgstTotal: c,
            sgstTotal: s,
            igstTotal: i,
            grandTotal: Number(inv.grandTotal || 0)
          };
        });

        this.data = {
          totalInvoices: invoices.length,
          taxableValue: taxable,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          invoices
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
