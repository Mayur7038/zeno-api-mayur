import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-sales-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER BAR -->
        <div class="page-header">
          <div>
            <h1>Sales Returns (Credit Notes)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> Issue Credit Note
            </button>
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Credit Note #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Orig. Invoice #</th>
                <th>Restock Warehouse</th>
                <th>Reason</th>
                <th>Taxable</th>
                <th>Tax Reversed</th>
                <th>Grand Total</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="10" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; margin-bottom: 8px; display:block;"></i>
                    Loading sales returns...
                  </td>
                </tr>
              } @else if (returns.length === 0) {
                <tr>
                  <td colspan="10" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No sales returns or credit notes recorded.
                  </td>
                </tr>
              }
              @for (sr of returns; track sr.id) {
                <tr (click)="viewReturn(sr)" style="cursor: pointer;">
                  <td class="font-mono font-bold" style="color: #DC2626">{{ sr.voucherNo }}</td>
                  <td>{{ sr.returnDate }}</td>
                  <td>
                    <strong>{{ sr.customerLedger?.name || 'Customer' }}</strong>
                    <div style="font-size: 0.75rem; color: var(--surface-500)">{{ sr.customerLedger?.gstin || 'Unregistered' }}</div>
                  </td>
                  <td class="font-mono">{{ sr.salesInvoice?.voucherNo || 'Direct Return' }}</td>
                  <td>{{ sr.godown?.name || 'Main Warehouse' }}</td>
                  <td><span class="reason-pill">{{ sr.reason }}</span></td>
                  <td>₹{{ sr.subtotal | number:'1.2-2' }}</td>
                  <td>₹{{ sr.taxTotal | number:'1.2-2' }}</td>
                  <td class="font-bold text-danger">₹{{ sr.grandTotal | number:'1.2-2' }}</td>
                  <td class="text-right" (click)="$event.stopPropagation()">
                    <button class="btn-icon" title="View Credit Note" (click)="viewReturn(sr)">
                      <i class="pi pi-eye"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- FULL PAGE CREATE SALES RETURN / CREDIT NOTE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>New Sales Return (Credit Note)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitReturn()" [disabled]="submitting || !isValidReturn()">
              <i class="pi pi-check"></i> Post Return & Issue Credit Note
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer</label>
              <select [(ngModel)]="newSr.customerLedgerId" (change)="onCustomerSelected()">
                <option value="">Select Customer...</option>
                @for (cust of customers; track cust.id) {
                  <option [value]="cust.id">{{ cust.name }} ({{ cust.gstin || 'Unregistered' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Original Sales Invoice</label>
              <select [(ngModel)]="newSr.salesInvoiceId" (change)="onInvoiceSelected()">
                <option value="">Direct Return (No invoice)</option>
                @for (inv of customerInvoices; track inv.id) {
                  <option [value]="inv.id">Invoice #{{ inv.voucherNo }} (₹{{ inv.grandTotal }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Restock Godown</label>
              <select [(ngModel)]="newSr.godownId">
                <option value="">Select Warehouse...</option>
                @for (g of godowns; track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Primary' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Return Date</label>
              <input type="date" [(ngModel)]="newSr.returnDate" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="required">Return Reason</label>
              <input type="text" [(ngModel)]="newSr.reason" placeholder="e.g. Defective unit, customer cancellation, packaging transit damage" />
            </div>
          </div>

          <!-- ITEMS SECTION -->
          <div class="items-section">
            <div class="section-title-row">
              <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Returned Items</h3>
              <button type="button" class="btn-sm btn-outline" (click)="addItemRow()">
                <i class="pi pi-plus"></i> Add Item
              </button>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Item / Product</th>
                  <th style="width: 14%;">Returned Qty</th>
                  <th style="width: 16%;">Sales Rate (₹)</th>
                  <th style="width: 14%;">GST Rate (%)</th>
                  <th style="width: 18%; text-align: right;">Total Refund (₹)</th>
                  <th style="width: 6%;"></th>
                </tr>
              </thead>
              <tbody>
                @for (row of newSr.items; track $index; let idx = $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="row.itemId" (change)="onItemSelect(idx)">
                        <option value="">Select Item...</option>
                        @for (item of itemsList; track item.id) {
                          <option [value]="item.id">{{ item.name }} ({{ item.sku || 'No SKU' }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input type="number" min="1" [(ngModel)]="row.returnedQty" (input)="recalculateTotals()" />
                    </td>
                    <td>
                      <input type="number" step="0.01" [(ngModel)]="row.unitPrice" (input)="recalculateTotals()" />
                    </td>
                    <td>
                      <select [(ngModel)]="row.taxRate" (change)="recalculateTotals()">
                        <option [value]="0">0%</option>
                        <option [value]="5">5%</option>
                        <option [value]="12">12%</option>
                        <option [value]="18">18%</option>
                        <option [value]="28">28%</option>
                      </select>
                    </td>
                    <td style="text-align: right; font-weight: 600; color: #DC2626;">
                      ₹{{ calculateRowTotal(row) | number:'1.2-2' }}
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-icon text-danger" (click)="removeItemRow(idx)" [disabled]="newSr.items.length <= 1">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- ACCOUNTING BANNER -->
          <div class="accounting-explanation-box">
            <i class="pi pi-calculator"></i>
            <div>
              <strong>Automated Balanced Accounting Impact:</strong>
              <div style="font-size: 0.8rem; margin-top: 2px;">
                Dr. Sales Account (₹{{ modalTotals.taxableSubtotal | number:'1.2-2' }}) | 
                Dr. Output GST (₹{{ modalTotals.taxTotal | number:'1.2-2' }}) | 
                Cr. Customer Receivable (₹{{ modalTotals.grandTotal | number:'1.2-2' }})
              </div>
            </div>
          </div>

          <div class="totals-summary-card">
            <div class="summary-line">
              <span>Reversed Taxable:</span>
              <strong>₹{{ modalTotals.taxableSubtotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line">
              <span>Reversed GST Tax:</span>
              <span>₹{{ modalTotals.taxTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total text-danger">
              <span>Total Credit Note:</span>
              <strong>₹{{ modalTotals.grandTotal | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedReturn) {
        <!-- FULL PAGE VIEW SALES RETURN / CREDIT NOTE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Credit Note #{{ selectedReturn.voucherNo }}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()"><i class="pi pi-print"></i> Print Voucher</button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Customer & Reason</span>
              <strong>{{ selectedReturn.customerLedger?.name }}</strong>
              <p style="margin: 4px 0 0 0;"><strong>Reason:</strong> {{ selectedReturn.reason }}</p>
            </div>
            <div class="info-block">
              <span class="label">Restock Godown</span>
              <strong>{{ selectedReturn.godown?.name }}</strong>
              <p style="margin: 4px 0 0 0;">Orig Invoice: {{ selectedReturn.salesInvoice?.voucherNo || 'N/A' }}</p>
            </div>
          </div>

          <h4 style="margin: 24px 0 12px; font-size: 0.95rem; color: var(--surface-700)">Returned Line Items</h4>
          <table class="zeno-table" style="border: 1px solid var(--surface-200); border-radius: 8px;">
            <thead>
              <tr>
                <th>Item</th>
                <th>Returned Qty</th>
                <th>Rate</th>
                <th>Taxable</th>
                <th class="text-right">Total Refund</th>
              </tr>
            </thead>
            <tbody>
              @for (item of selectedReturn.items; track item.id) {
                <tr>
                  <td>
                    <strong>{{ item.item?.name }}</strong>
                    <div style="font-size: 0.72rem; color: var(--surface-500)">{{ item.item?.sku }}</div>
                  </td>
                  <td class="font-bold">{{ item.returnedQty }}</td>
                  <td>₹{{ item.rate | number:'1.2-2' }}</td>
                  <td>₹{{ item.taxableAmount | number:'1.2-2' }}</td>
                  <td class="text-right font-bold text-danger">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="totals-summary-card" style="margin-top: 20px;">
            <div class="summary-line">
              <span>Reversed Subtotal:</span>
              <strong>₹{{ selectedReturn.subtotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line">
              <span>Reversed Tax:</span>
              <span>₹{{ selectedReturn.taxTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total text-danger">
              <span>Credit Note Total:</span>
              <strong>₹{{ selectedReturn.grandTotal | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: var(--radius-sm, 6px); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
    .btn-back:hover { background: var(--surface-200); color: var(--surface-900); }
    .form-page-card { padding: 24px; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.red { background: #FEF2F2; color: #DC2626; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .zeno-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; overflow-x: auto; overflow-y: hidden; max-width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
    .zeno-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; white-space: nowrap !important; }
    .zeno-table th { background: var(--surface-50); padding: 12px 18px; color: var(--surface-600); font-weight: 600; border-bottom: 1px solid var(--surface-200); white-space: nowrap !important; }
    .zeno-table td { padding: 13px 18px; border-bottom: 1px solid var(--surface-100); color: var(--surface-800); white-space: nowrap !important; }
    .zeno-table tr:hover td { background: var(--surface-50); }
    .zeno-table th *, .zeno-table td * { white-space: nowrap !important; }

    .reason-pill { background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; }
    .text-danger { color: #DC2626; }

    .btn-primary { background: #2563EB; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { background: #1D4ED8; }
    .btn-secondary { background: var(--surface-100); color: var(--surface-700); border: 1px solid var(--surface-300); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600, #2563EB); color: var(--primary-600, #2563EB); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .items-section { margin-top: 16px; }
    .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; }
    .items-table th { background: var(--surface-100); padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: var(--surface-600); }
    .items-table td { padding: 8px 10px; border-bottom: 1px solid var(--surface-200); }
    .items-table select, .items-table input { width: 100%; padding: 6px 8px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.85rem; }

    .accounting-explanation-box { margin-top: 20px; background: #F8FAFC; border: 1px solid #CBD5E1; padding: 12px 14px; border-radius: 8px; display: flex; align-items: center; gap: 12px; color: #334155; }
    .totals-summary-card { width: 340px; margin-left: auto; margin-top: 16px; background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 10px; padding: 14px 16px; }
    .summary-line { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: var(--surface-600); }
    .summary-line.grand-total { border-top: 1px solid var(--surface-300); padding-top: 8px; margin-top: 8px; font-size: 1.05rem; font-weight: 700; }

    .detail-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-block { background: var(--surface-50); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-200); }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; display: block; margin-bottom: 4px; }
  `]
})
export class SalesReturnsComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  returns: any[] = [];
  customers: any[] = [];
  godowns: any[] = [];
  itemsList: any[] = [];
  customerInvoices: any[] = [];
  loading = false;
  submitting = false;

  selectedReturn: any = null;

  newSr: any = {
    customerLedgerId: '',
    salesInvoiceId: '',
    godownId: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: 'Customer Cancellation / Defect',
    items: [
      { itemId: '', returnedQty: 1, unitPrice: 0, taxRate: 18, isInterstate: false, salesInvoiceItemId: null }
    ]
  };

  modalTotals = {
    taxableSubtotal: 0,
    taxTotal: 0,
    grandTotal: 0
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadReturns();
    this.loadMasters();

    // Check query params if navigated with ?invoiceId=...
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.openCreatePage();
        this.newSr.customerLedgerId = params['customerId'] || '';
        this.onCustomerSelected();
        this.newSr.salesInvoiceId = params['invoiceId'];
        this.onInvoiceSelected();
      }
    });
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get totalReturnValue(): number {
    return this.returns.reduce((sum, r) => sum + Number(r.grandTotal || 0), 0);
  }

  get totalRestockedUnits(): number {
    return this.returns.reduce((sum, r) => sum + (r.items?.reduce((s: number, i: any) => s + Number(i.returnedQty || 0), 0) || 0), 0);
  }

  loadReturns() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getSalesReturns(this.companyId).subscribe({
      next: (res) => {
        this.returns = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMasters() {
    if (!this.companyId) return;
    this.mastersService.getLedgers(this.companyId, false, true).subscribe((data) => {
      this.customers = data || [];
    });
    this.mastersService.getItems(this.companyId).subscribe((data) => {
      this.itemsList = data || [];
    });
    const defaultGodowns = this.tenantService.godowns();
    if (defaultGodowns && defaultGodowns.length > 0) {
      this.godowns = defaultGodowns;
    }
  }

  openCreatePage() {
    this.newSr = {
      customerLedgerId: '',
      salesInvoiceId: '',
      godownId: this.godowns[0]?.id || '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: 'Customer Cancellation / Defect',
      items: [
        { itemId: '', returnedQty: 1, unitPrice: 0, taxRate: 18, isInterstate: false, salesInvoiceItemId: null }
      ]
    };
    this.recalculateTotals();
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedReturn = null;
  }

  addItemRow() {
    this.newSr.items.push({
      itemId: '',
      returnedQty: 1,
      unitPrice: 0,
      taxRate: 18,
      isInterstate: false,
      salesInvoiceItemId: null
    });
    this.recalculateTotals();
  }

  removeItemRow(index: number) {
    if (this.newSr.items.length > 1) {
      this.newSr.items.splice(index, 1);
      this.recalculateTotals();
    }
  }

  onCustomerSelected() {
    if (!this.newSr.customerLedgerId) return;
    this.salesService.getCustomerPendingInvoices(this.newSr.customerLedgerId, this.companyId).subscribe((invs) => {
      this.customerInvoices = invs || [];
    });
  }

  onInvoiceSelected() {
    const inv = this.customerInvoices.find(i => i.id === this.newSr.salesInvoiceId);
    if (inv && inv.items && inv.items.length > 0) {
      this.newSr.items = inv.items.map((i: any) => ({
        itemId: i.itemId,
        returnedQty: Number(i.billedQty || 1),
        unitPrice: Number(i.rate || 0),
        taxRate: Number(i.gstRate || 18),
        isInterstate: Number(i.igstAmount || 0) > 0,
        salesInvoiceItemId: i.id
      }));
      this.recalculateTotals();
    }
  }

  onItemSelect(index: number) {
    const row = this.newSr.items[index];
    const item = this.itemsList.find(i => i.id === row.itemId);
    if (item) {
      row.unitPrice = Number(item.salesPrice || item.purchasePrice || 0);
      row.taxRate = Number(item.taxRate || 18);
      this.recalculateTotals();
    }
  }

  calculateRowTotal(row: any): number {
    const qty = Number(row.returnedQty || 0);
    const rate = Number(row.unitPrice || 0);
    const taxable = qty * rate;
    const tax = (taxable * Number(row.taxRate || 0)) / 100;
    return taxable + tax;
  }

  recalculateTotals() {
    let subtotal = 0;
    let tax = 0;

    for (const r of this.newSr.items) {
      const qty = Number(r.returnedQty || 0);
      const rate = Number(r.unitPrice || 0);
      const taxable = qty * rate;
      const taxRate = Number(r.taxRate || 0);

      subtotal += taxable;
      tax += (taxable * taxRate) / 100;
    }

    this.modalTotals = {
      taxableSubtotal: subtotal,
      taxTotal: tax,
      grandTotal: subtotal + tax
    };
  }

  isValidReturn(): boolean {
    return (
      !!this.newSr.customerLedgerId &&
      !!this.newSr.godownId &&
      !!this.newSr.reason &&
      this.newSr.items.length > 0 &&
      this.newSr.items.every((i: any) => !!i.itemId && Number(i.returnedQty) > 0)
    );
  }

  submitReturn() {
    if (!this.isValidReturn()) return;
    this.submitting = true;
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newSr
    };

    this.salesService.createSalesReturn(payload).subscribe({
      next: (created: any) => {
        this.submitting = false;
        this.toast.success(
          `Sales Return / Credit Note ${created?.creditNoteNo || ''} created successfully! Total: ₹${Number(this.modalTotals.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Credit Note Issued',
        );
        this.backToList();
        this.loadReturns();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to issue credit note';
        this.toast.error(msg, 'Issue Failed');
        alert(msg);
      }
    });
  }

  viewReturn(sr: any) {
    this.selectedReturn = sr;
    this.viewMode = 'view';
  }
}
