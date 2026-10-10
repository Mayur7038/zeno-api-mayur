import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MastersService } from "../../core/services/masters.service";
import { TenantService } from "../../core/services/tenant.service";

@Component({
  selector: "app-profit-loss",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rpt-page">
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" routerLink="/reports"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>Profit &amp; Loss Account</h1>
            <p class="sub">Income &amp; Expenditure Statement</p>
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
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i>&nbsp;Computing P&L from GL entries...</div>
      }
      
      @if (error) {
        <div style="padding: 40px; text-align: center; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; margin-top: 20px;">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <h3>Failed to load report</h3>
          <p>Could not connect to the backend server. Please ensure the API server (Port 4000) is running.</p>
        </div>
      }

      @if (!loading && !error && data) {


        <!-- Unified Trading & P&L Account -->
        <div class="t-format-container">
          <!-- LEFT SIDE (EXPENDITURE) -->
          <div class="t-format-side">
            <div class="t-format-header expense-header">
              <i class="pi pi-arrow-up-right" style="margin-right: 8px;"></i> EXPENDITURE
            </div>
            <div class="t-format-table-wrap">
              <table class="zeno-table t-format-table">
                <thead><tr><th>Particulars</th><th class="text-right" style="width: 120px;">Amount (&#8377;)</th></tr></thead>
                <tbody>
                  <!-- Trading Part -->
                  @if (tradingExpenses.length > 0 || grossProfit > 0) {
                    <tr class="section-header-row"><td colspan="2" class="font-bold text-muted" style="background: var(--surface-50); font-size: 0.8rem; text-transform: uppercase;">Direct Expenses</td></tr>
                  }
                  @for (row of tradingExpenses; track row.ledgerId) {
                    <tr>
                      <td class="font-bold pl-4">{{ row.ledgerName }} <span class="text-muted" style="font-size:0.75rem; font-weight:normal; margin-left: 8px;">{{row.groupName}}</span></td>
                      <td class="text-right font-mono text-danger">&#8377;{{ row.amount.toFixed(2) }}</td>
                    </tr>
                  }
                  @if (grossProfit > 0) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Gross Profit (c/o)</td><td class="text-right font-mono font-bold">&#8377;{{ grossProfit.toFixed(2) }}</td></tr>
                  }
                  <tr class="mid-total-row">
                    <td class="font-bold text-right" style="font-size: 0.8rem;">TOTAL</td>
                    <td class="text-right font-mono font-bold">&#8377;{{ Math.max(totalTradingIncome, totalTradingExpense).toFixed(2) }}</td>
                  </tr>

                  <!-- P&L Part -->
                  @if (plExpenses.length > 0 || grossLoss > 0) {
                    <tr class="section-header-row"><td colspan="2" class="font-bold text-muted" style="background: var(--surface-50); font-size: 0.8rem; text-transform: uppercase;">Indirect Expenses</td></tr>
                  }
                  @if (grossLoss > 0) {
                    <tr><td class="font-bold pl-4" style="color: var(--surface-800);">Gross Loss (b/f)</td><td class="text-right font-mono">&#8377;{{ grossLoss.toFixed(2) }}</td></tr>
                  }
                  @for (row of plExpenses; track row.ledgerId) {
                    <tr>
                      <td class="font-bold pl-4">{{ row.ledgerName }} <span class="text-muted" style="font-size:0.75rem; font-weight:normal; margin-left: 8px;">{{row.groupName}}</span></td>
                      <td class="text-right font-mono text-danger">&#8377;{{ row.amount.toFixed(2) }}</td>
                    </tr>
                  }
                  @if (netProfit > 0) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Net Profit (transferred to Capital)</td><td class="text-right font-mono font-bold">&#8377;{{ netProfit.toFixed(2) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="t-format-total double-underline">
              <div class="total-label">GRAND TOTAL</div>
              <div class="total-amount">&#8377;{{ Math.max(totalPlIncome + grossProfit, totalPlExpense + grossLoss).toFixed(2) }}</div>
            </div>
          </div>
          
          <!-- RIGHT SIDE (INCOME) -->
          <div class="t-format-side">
            <div class="t-format-header income-header">
              <i class="pi pi-arrow-down-left" style="margin-right: 8px;"></i> INCOME
            </div>
            <div class="t-format-table-wrap">
              <table class="zeno-table t-format-table">
                <thead><tr><th>Particulars</th><th class="text-right" style="width: 120px;">Amount (&#8377;)</th></tr></thead>
                <tbody>
                  <!-- Trading Part -->
                  @if (tradingIncomes.length > 0 || grossLoss > 0) {
                    <tr class="section-header-row"><td colspan="2" class="font-bold text-muted" style="background: var(--surface-50); font-size: 0.8rem; text-transform: uppercase;">Direct Incomes</td></tr>
                  }
                  @for (row of tradingIncomes; track row.ledgerId) {
                    <tr>
                      <td class="font-bold pl-4">{{ row.ledgerName }} <span class="text-muted" style="font-size:0.75rem; font-weight:normal; margin-left: 8px;">{{row.groupName}}</span></td>
                      <td class="text-right font-mono text-success">&#8377;{{ row.amount.toFixed(2) }}</td>
                    </tr>
                  }
                  @if (grossLoss > 0) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Gross Loss (c/o)</td><td class="text-right font-mono font-bold">&#8377;{{ grossLoss.toFixed(2) }}</td></tr>
                  }
                  <tr class="mid-total-row">
                    <td class="font-bold text-right" style="font-size: 0.8rem;">TOTAL</td>
                    <td class="text-right font-mono font-bold">&#8377;{{ Math.max(totalTradingIncome, totalTradingExpense).toFixed(2) }}</td>
                  </tr>

                  <!-- P&L Part -->
                  @if (plIncomes.length > 0 || grossProfit > 0) {
                    <tr class="section-header-row"><td colspan="2" class="font-bold text-muted" style="background: var(--surface-50); font-size: 0.8rem; text-transform: uppercase;">Indirect Incomes</td></tr>
                  }
                  @if (grossProfit > 0) {
                    <tr><td class="font-bold pl-4" style="color: var(--surface-800);">Gross Profit (b/f)</td><td class="text-right font-mono">&#8377;{{ grossProfit.toFixed(2) }}</td></tr>
                  }
                  @for (row of plIncomes; track row.ledgerId) {
                    <tr>
                      <td class="font-bold pl-4">{{ row.ledgerName }} <span class="text-muted" style="font-size:0.75rem; font-weight:normal; margin-left: 8px;">{{row.groupName}}</span></td>
                      <td class="text-right font-mono text-success">&#8377;{{ row.amount.toFixed(2) }}</td>
                    </tr>
                  }
                  @if (netLoss > 0) {
                    <tr class="difference-row"><td class="font-bold text-muted pl-4">Net Loss (transferred from Capital)</td><td class="text-right font-mono font-bold">&#8377;{{ netLoss.toFixed(2) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="t-format-total double-underline">
              <div class="total-label">GRAND TOTAL</div>
              <div class="total-amount">&#8377;{{ Math.max(totalPlIncome + grossProfit, totalPlExpense + grossLoss).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './profit-loss.component.scss'
})
export class ProfitLossComponent implements OnInit {
  loading = false;
  error = false;
  data: any = null;
  startDate = '';
  endDate = '';
  Math = Math;

  tradingExpenses: any[] = [];
  tradingIncomes: any[] = [];
  plExpenses: any[] = [];
  plIncomes: any[] = [];

  totalTradingExpense = 0;
  totalTradingIncome = 0;
  grossProfit = 0;
  grossLoss = 0;

  totalPlExpense = 0;
  totalPlIncome = 0;
  netProfit = 0;
  netLoss = 0;

  constructor(private masters: MastersService, public tenant: TenantService) {}

  ngOnInit() {
    const now = new Date();
    const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.startDate = `${fy}-04-01`;
    this.endDate = `${fy + 1}-03-31`;
    this.tenant.loadHierarchy().subscribe({ next: () => this.load() });
  }

  load() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    this.error = false;
    this.masters.getProfitLoss(compId, this.startDate, this.endDate).subscribe({
      next: (res) => { 
        this.data = res; 
        this.processData();
        this.loading = false; 
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }

  processData() {
    const expenses = this.data.expenseRows || [];
    const incomes = this.data.incomeRows || [];

    const isTradingItem = (r: any) => {
      const g = r.groupName.toLowerCase();
      const l = r.ledgerName.toLowerCase();
      return g === 'purchase accounts' 
          || g === 'direct expenses'
          || g === 'direct incomes'
          || g === 'sales accounts'
          || g === 'stock-in-hand'
          || l.includes('opening stock')
          || l.includes('closing stock');
    };
    
    this.tradingExpenses = expenses.filter((r: any) => isTradingItem(r));
    this.plExpenses = expenses.filter((r: any) => !isTradingItem(r));

    this.tradingIncomes = incomes.filter((r: any) => isTradingItem(r));
    this.plIncomes = incomes.filter((r: any) => !isTradingItem(r));

    this.totalTradingExpense = this.tradingExpenses.reduce((sum, r) => sum + r.amount, 0);
    this.totalTradingIncome = this.tradingIncomes.reduce((sum, r) => sum + r.amount, 0);

    const gpDiff = this.totalTradingIncome - this.totalTradingExpense;
    this.grossProfit = gpDiff > 0 ? gpDiff : 0;
    this.grossLoss = gpDiff < 0 ? Math.abs(gpDiff) : 0;

    this.totalPlExpense = this.plExpenses.reduce((sum, r) => sum + r.amount, 0);
    this.totalPlIncome = this.plIncomes.reduce((sum, r) => sum + r.amount, 0);

    const plIncomeSide = this.totalPlIncome + this.grossProfit;
    const plExpenseSide = this.totalPlExpense + this.grossLoss;

    const netDiff = plIncomeSide - plExpenseSide;
    this.netProfit = netDiff > 0 ? netDiff : 0;
    this.netLoss = netDiff < 0 ? Math.abs(netDiff) : 0;
  }
}
