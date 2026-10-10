import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-sales-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
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

        <!-- TOOLBAR & TABLE CARD -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search credit notes..."
              />
            </div>

            <div class="toolbar-filters">
              <select class="form-select" [(ngModel)]="selectedCustomer">
                <option value="">All Customers</option>
                @for (c of customers; track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>

              <button class="btn-export" (click)="exportReturns()" [disabled]="filteredReturns.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>
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
              } @else if (filteredReturns.length === 0) {
                <tr>
                  <td colspan="10" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No sales returns or credit notes recorded.
                  </td>
                </tr>
              }
              @for (sr of filteredReturns; track sr.id) {
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

        <div class="form-page-no-card">
          <!-- TOP SECTION: CUSTOMER & METADATA (MAX 4 FIELDS) -->
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer</label>
              <zeno-searchable-select
                [options]="customers"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Select Customer..."
                [(ngModel)]="newSr.customerLedgerId"
                (selectChange)="onCustomerSelected()"
              ></zeno-searchable-select>
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

          <!-- LINE ITEMS EDITOR -->
          <div class="line-items-section">
            <zeno-item-fast-entry
              [itemsList]="itemsList"
              [showDiscount]="false"
              [showGst]="false"
              [editData]="editingItemData"
              (itemAdded)="onFastItemAdded($event)"
              (itemUpdated)="onFastItemUpdated($event)"
            ></zeno-item-fast-entry>

            <div class="table-responsive">
              <table class="zeno-table line-table">
                <thead>
                  <tr>
                    <th style="width: 36px;" class="text-center">#</th>
                    <th style="min-width: 200px;">Product / Item</th>
                    <th style="width: 80px;" class="text-center">Return Qty</th>
                    <th style="width: 75px;" class="text-center">Unit</th>
                    <th style="width: 110px;" class="text-right">Sales Rate (₹)</th>
                    <th style="width: 85px;" class="text-center">GST %</th>
                    <th style="width: 120px;" class="text-right">Total Refund (₹)</th>
                    <th style="width: 70px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (newSr.items.length === 0 || (newSr.items.length === 1 && !newSr.items[0].itemId)) {
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added yet. Use the Fast Item Entry Bar above to add items to this return.
                      </td>
                    </tr>
                  } @else {
                    @for (row of newSr.items; track $index; let idx = $index) {
                      @if (row.itemId) {
                        <tr>
                          <td class="excel-row-num text-center">{{ idx + 1 }}</td>
                          <td>
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(row.itemId) }}</span>
                          </td>
                          <td class="text-center font-mono font-bold">
                            {{ row.returnedQty }}
                          </td>
                          <td class="text-center">
                            <span class="unit-badge">{{ getUnitCode(row) }}</span>
                          </td>
                          <td class="text-right font-mono">
                            ₹{{ row.unitPrice | number:'1.2-2' }}
                          </td>
                          <td class="text-center font-mono">
                            {{ row.taxRate }}%
                          </td>
                          <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: #DC2626;">
                            ₹{{ calculateRowTotal(row) | number:'1.2-2' }}
                          </td>
                          <td class="text-center">
                            <button type="button" class="btn-icon text-primary" (click)="editItemRow(idx)" title="Edit line item">
                              <i class="pi pi-pencil"></i>
                            </button>
                            <button type="button" class="btn-icon text-danger" (click)="removeItemRow(idx)" title="Delete line item">
                              <i class="pi pi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY & TOTALS FOOTER SECTION -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Reason for Return / Remarks</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter return reason or remarks..."
                [(ngModel)]="newSr.reason"
              ></textarea>
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
          <div class="table-responsive">
            <table class="zeno-table line-table">
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
          </div>

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
  styleUrl: './sales-returns.component.scss'
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
  searchQuery: string = '';
  selectedCustomer: string = '';

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

  get filteredReturns(): any[] {
    let list = this.returns || [];
    if (this.selectedCustomer) {
      list = list.filter((sr: any) => sr.customerLedgerId === this.selectedCustomer);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter((sr: any) =>
        (sr.voucherNo && sr.voucherNo.toLowerCase().includes(q)) ||
        (sr.customerLedger?.name && sr.customerLedger.name.toLowerCase().includes(q)) ||
        (sr.reason && sr.reason.toLowerCase().includes(q))
      );
    }
    return list;
  }

  exportReturns() {
    const list = this.filteredReturns;
    if (!list || list.length === 0) return;
    const headers = ['Credit Note No', 'Date', 'Customer', 'Original Invoice', 'Warehouse', 'Reason', 'Taxable', 'Tax Reversed', 'Grand Total'];
    const rows = list.map((sr) => [
      sr.voucherNo || '',
      sr.returnDate || '',
      sr.customerLedger?.name || '',
      sr.salesInvoice?.voucherNo || 'Direct Return',
      sr.godown?.name || '',
      sr.reason || '',
      sr.taxableAmount || sr.taxableSubtotal || 0,
      sr.taxAmount || sr.taxTotal || 0,
      sr.totalAmount || sr.grandTotal || 0
    ]);
    exportToCsv('Sales_Returns_Credit_Notes', headers, rows);
    this.toast.success('Sales returns exported successfully!', 'Export Complete');
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

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.itemsList.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
  }

  getUnitCode(row: any): string {
    if (!row) return 'Pcs';
    const val = row.unitCode || row.unit;
    if (!val) return 'Pcs';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.code || val.name || val.unitCode || 'Pcs';
    return String(val);
  }

  openCreatePage() {
    this.newSr = {
      customerLedgerId: '',
      salesInvoiceId: '',
      godownId: this.godowns[0]?.id || '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: 'Customer Cancellation / Defect',
      items: []
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

  editingItemData: { item: any, index: number } | null = null;

  onFastItemAdded(itemData: any) {
    if (this.newSr.items.length === 1 && !this.newSr.items[0].itemId) {
      this.newSr.items = [];
    }
    this.newSr.items.push({
      itemId: itemData.itemId,
      returnedQty: itemData.qty,
      unitPrice: itemData.rate,
      taxRate: itemData.gstRate,
      isInterstate: false,
      salesInvoiceItemId: null
    });
    this.recalculateTotals();
  }

  editItemRow(index: number) {
    const row = this.newSr.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.returnedQty,
          rate: row.unitPrice,
          discount: 0,
          gstRate: row.taxRate
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      if (this.newSr.items[idx]) {
        this.newSr.items[idx].itemId = itemData.itemId;
        this.newSr.items[idx].returnedQty = itemData.qty;
        this.newSr.items[idx].unitPrice = itemData.rate;
        this.newSr.items[idx].taxRate = itemData.gstRate;
      }
      this.editingItemData = null;
      this.recalculateTotals();
    }
  }

  removeItemRow(index: number) {
    if (this.editingItemData?.index === index) {
      this.editingItemData = null;
    }
    this.newSr.items.splice(index, 1);
    this.recalculateTotals();
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
