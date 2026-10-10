import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-sales-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Sales Invoices</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Sales Invoice
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
                (input)="loadInvoices()"
                placeholder="Search sales invoices..."
              />
            </div>

            <div class="toolbar-filters">
              <select
                class="form-select"
                [(ngModel)]="selectedStatus"
                (change)="filterStatus(selectedStatus)"
              >
                <option value="">All Invoices</option>
                <option value="PENDING">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
              </select>

              <button class="btn-export" (click)="exportInvoices()" [disabled]="invoices.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <!-- INVOICES TABLE -->
          <table class="zeno-table">
              <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Taxable</th>
                <th>GST</th>
                <th>Grand Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    <i class="pi pi-spin pi-spinner"></i> Loading tax invoices...
                  </td>
                </tr>
              } @else if (invoices.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    No sales invoices found. Create a bill directly or convert from delivery challan.
                  </td>
                </tr>
              } @else {
                @for (inv of invoices; track inv.id) {
                  <tr (click)="viewInvoice(inv.id)" style="cursor: pointer;">
                    <td class="font-bold" style="color: var(--primary-700)">{{ inv.voucherNo }}</td>
                    <td>{{ inv.invoiceDate }}</td>
                    <td>
                      <div class="font-bold">{{ inv.customerLedger?.name }}</div>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ inv.customerLedger?.gstin || 'Unregistered' }}</div>
                    </td>
                    <td>₹{{ inv.taxableTotal | number:'1.2-2' }}</td>
                    <td>₹{{ (Number(inv.cgstTotal || 0) + Number(inv.sgstTotal || 0) + Number(inv.igstTotal || 0)) | number:'1.2-2' }}</td>
                    <td class="font-bold">₹{{ inv.grandTotal | number:'1.2-2' }}</td>
                    <td class="font-bold text-danger">
                      ₹{{ (inv.grandTotal - (inv.paidAmount || 0)) | number:'1.2-2' }}
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(inv.status)">{{ formatStatus(inv.status) }}</span>
                    </td>
                    <td class="text-right" (click)="$event.stopPropagation()">
                      <button class="btn-icon" title="View Tax Invoice" (click)="viewInvoice(inv.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                      @if (inv.status !== 'PAID') {
                        <button class="btn-icon text-success" title="Record Receipt" (click)="recordPayment(inv)">
                          <i class="pi pi-wallet"></i>
                        </button>
                      }
                      <button class="btn-icon text-orange" title="Issue Credit Note (Sales Return)" (click)="createReturn(inv)">
                        <i class="pi pi-replay"></i>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE SALES INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Create Sales Tax Invoice</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitInvoice()" [disabled]="submitting || !isValidInvoice()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Ledger Entries...
              } @else {
                <i class="pi pi-check"></i> Post Tax Invoice
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer / Debtor</label>
              <zeno-searchable-select
                [options]="customers"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="Search Customer (Name or GSTIN)..."
                [(ngModel)]="newInv.customerLedgerId"
                (selectChange)="onCustomerSelected()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label class="required">Invoice Date</label>
              <input type="date" [(ngModel)]="newInv.invoiceDate" />
            </div>

            <div class="form-group">
              <label>Payment Due Date</label>
              <input type="date" [(ngModel)]="newInv.paymentDueDate" />
            </div>

            <div class="form-group">
              <label>Place of Supply State</label>
              <input type="text" [(ngModel)]="newInv.placeOfSupplyStateCode" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 14px;">
            <div class="form-group">
              <label>Customer Billing Address</label>
              <input type="text" [(ngModel)]="newInv.billingAddress" />
            </div>
            <div class="form-group">
              <label>Shipping / Consignee Address</label>
              <input type="text" [(ngModel)]="newInv.shippingAddress" />
            </div>
          </div>

          <!-- PULL PENDING CHALLANS TRIGGER -->
          @if (newInv.customerLedgerId) {
            <div class="pull-orders-box">
              <div class="pull-orders-info">
                <i class="pi pi-truck"></i>
                <span>Pull unbilled delivery challans for this customer</span>
              </div>
              <button class="btn-sm btn-outline" type="button" (click)="pullPendingChallans()" [disabled]="loadingPendingChallans">
                @if (loadingPendingChallans) {
                  <i class="pi pi-spin pi-spinner"></i> Loading...
                } @else {
                  <i class="pi pi-download"></i> Load Unbilled Challans
                }
              </button>
            </div>
          }

          <!-- ITEMS SECTION -->
          <div class="line-items-section">
            <div class="section-title-wrap">
              <div class="section-title">
                <i class="pi pi-receipt"></i> Billed Line Items
              </div>
              <button class="add-line-btn" type="button" (click)="addItemRow()">
                <i class="pi pi-plus"></i> Add Blank Line
              </button>
            </div>

            <!-- FAST ITEM ENTRY BAR -->
            <zeno-item-fast-entry
              [itemsList]="itemsList"
              [showDiscount]="true"
              [showGst]="true"
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
                    <th style="width: 80px;" class="text-center">Qty</th>
                    <th style="width: 75px;" class="text-center">Unit</th>
                    <th style="width: 110px;">Rate (₹)</th>
                    <th style="width: 100px;">Discount (₹)</th>
                    <th style="width: 85px;">GST %</th>
                    <th class="text-right" style="width: 120px;">Amount (₹)</th>
                    <th class="text-center" style="width: 70px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (newInv.items.length === 0 || (newInv.items.length === 1 && !newInv.items[0].itemId)) {
                    <tr>
                      <td colspan="9" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added yet. Use the Fast Item Entry Bar above to add items to this invoice.
                      </td>
                    </tr>
                  } @else {
                    @for (row of newInv.items; track $index; let i = $index) {
                      @if (row.itemId) {
                        <tr>
                          <td class="excel-row-num text-center">{{ i + 1 }}</td>
                          <td>
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ getItemName(row.itemId) }}</span>
                          </td>
                          <td class="text-center font-mono font-bold">
                            {{ row.billedQty }}
                          </td>
                          <td class="text-center">
                            <span class="unit-badge">{{ getUnitCode(row) }}</span>
                          </td>
                          <td class="text-right font-mono">
                            ₹{{ row.unitPrice | number:'1.2-2' }}
                          </td>
                          <td class="text-right font-mono">
                            ₹{{ row.discountAmount | number:'1.2-2' }}
                          </td>
                          <td class="text-center font-mono">
                            {{ row.taxRate }}%
                          </td>
                          <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                            ₹{{ (Math.max(0, (row.billedQty * row.unitPrice) - row.discountAmount)) | number:'1.2-2' }}
                          </td>
                          <td class="text-center">
                            <button type="button" class="btn-icon text-primary" (click)="editItemRow(i)" title="Edit line item">
                              <i class="pi pi-pencil"></i>
                            </button>
                            <button type="button" class="btn-icon text-danger" (click)="removeItemRow(i)" title="Delete line item">
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

          <!-- SUMMARY & TOTALS -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Narration / Remarks</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter transaction narration or invoice notes..."
                [(ngModel)]="newInv.narration"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line">
                <span>Taxable Subtotal:</span>
                <strong>₹{{ modalTotals.taxableSubtotal | number:'1.2-2' }}</strong>
              </div>
              @if (modalTotals.igstTotal > 0) {
                <div class="summary-line">
                  <span>Integrated GST (IGST):</span>
                  <span>₹{{ modalTotals.igstTotal | number:'1.2-2' }}</span>
                </div>
              } @else {
                <div class="summary-line">
                  <span>Central GST (CGST):</span>
                  <span>₹{{ modalTotals.cgstTotal | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>State GST (SGST):</span>
                  <span>₹{{ modalTotals.sgstTotal | number:'1.2-2' }}</span>
                </div>
              }
              <div class="summary-line">
                <span>Round Off:</span>
                <span>₹{{ modalTotals.roundOff | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line grand-total">
                <span>Grand Total:</span>
                <strong>₹{{ modalTotals.grandTotal | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedInvoice) {
        <!-- VIEW SALES INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Tax Invoice #{{ selectedInvoice.voucherNo }}</h1>
            <span class="badge" [ngClass]="getStatusBadge(selectedInvoice.status)">
              {{ formatStatus(selectedInvoice.status) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" (click)="printInvoice()">
              <i class="pi pi-print"></i> Print Tax Invoice
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Billed To Customer</span>
              <strong>{{ selectedInvoice.customerLedger?.name }}</strong>
              <p>{{ selectedInvoice.customerLedger?.gstin ? 'GSTIN: ' + selectedInvoice.customerLedger?.gstin : 'Unregistered Consumer' }}</p>
              <p>{{ selectedInvoice.billingAddress }}</p>
            </div>
            <div class="info-block">
              <span class="label">Tax Place of Supply</span>
              <p>State Code: {{ selectedInvoice.placeOfSupplyStateCode || '27' }}</p>
              <p>{{ selectedInvoice.isInterstate ? 'Inter-State Transaction (IGST)' : 'Intra-State Transaction (CGST + SGST)' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Invoice Metadata</span>
              <p><strong>Invoice Date:</strong> {{ selectedInvoice.invoiceDate }}</p>
              <p><strong>Due Date:</strong> {{ selectedInvoice.paymentDueDate || 'Immediate' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Dispatch Details</span>
              <p>{{ selectedInvoice.shippingAddress || 'Consignee Address' }}</p>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: var(--surface-700)">Itemized Goods &amp; Services</h4>
          <div class="table-responsive">
            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th>Item &amp; HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of selectedInvoice.items; track item.id) {
                  <tr>
                    <td>
                      <strong>{{ item.item?.name }}</strong>
                      <div style="font-size: 0.72rem; color: var(--surface-500)">HSN/SAC: {{ item.item?.hsnSac || '8517' }}</div>
                    </td>
                    <td>{{ item.billedQty }} {{ item.unit?.code || 'NOS' }}</td>
                    <td>₹{{ item.rate | number:'1.2-2' }}</td>
                    <td>₹{{ item.taxableAmount | number:'1.2-2' }}</td>
                    <td>
                      @if (item.igstAmount > 0) {
                        <span>IGST: ₹{{ item.igstAmount | number:'1.2-2' }} ({{ item.gstRate }}%)</span>
                      } @else {
                        <span>CGST: ₹{{ item.cgstAmount | number:'1.2-2' }} + SGST: ₹{{ item.sgstAmount | number:'1.2-2' }}</span>
                      }
                    </td>
                    <td class="text-right font-bold">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="totals-summary-card" style="margin-top: 20px;">
            <div class="summary-line">
              <span>Taxable Value:</span>
              <strong>₹{{ selectedInvoice.taxableTotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line">
              <span>CGST:</span>
              <span>₹{{ selectedInvoice.cgstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>SGST:</span>
              <span>₹{{ selectedInvoice.sgstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>IGST:</span>
              <span>₹{{ selectedInvoice.igstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>Round Off:</span>
              <span>₹{{ selectedInvoice.roundOffTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total">
              <span>Grand Total:</span>
              <strong>₹{{ selectedInvoice.grandTotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line text-success font-bold">
              <span>Amount Paid:</span>
              <span>₹{{ (selectedInvoice.paidAmount || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line text-danger font-bold">
              <span>Balance Due:</span>
              <span>₹{{ (selectedInvoice.grandTotal - (selectedInvoice.paidAmount || 0)) | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './sales-invoices.component.scss'
})
export class SalesInvoicesComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  invoices: any[] = [];
  customers: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  loadingPendingChallans = false;

  searchQuery = '';
  selectedStatus = '';
  selectedInvoice: any = null;

  Number = Number;
  Math = Math;

  createDefaultGridRows(count = 1): any[] {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const isInter = compState !== (this.newInv?.placeOfSupplyStateCode || '27');
    return Array.from({ length: count }, () => ({
      itemId: '',
      billedQty: 1,
      unitPrice: 0,
      discountAmount: 0,
      taxRate: 18,
      unitCode: 'Pcs',
      isInterstate: isInter
    }));
  }

  newInv: any = {
    customerLedgerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentDueDate: '',
    placeOfSupplyStateCode: '27',
    billingAddress: '',
    shippingAddress: '',
    narration: '',
    dcIds: [] as string[],
    items: [
      { itemId: '', billedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18, unitCode: 'Pcs', isInterstate: false }
    ]
  };

  modalTotals = {
    taxableSubtotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 0
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.loadMasters();
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get paidCount(): number {
    return this.invoices.filter(i => i.status === 'PAID').length;
  }

  get totalSalesValue(): number {
    return this.invoices.reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
  }

  get totalReceivables(): number {
    return this.invoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + (Number(i.grandTotal || 0) - Number(i.paidAmount || 0)), 0);
  }

  loadInvoices() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getSalesInvoices(this.companyId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => {
        this.invoices = res || [];
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
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadInvoices();
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

  openCreateModal() {
    this.newInv = {
      customerLedgerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentDueDate: '',
      placeOfSupplyStateCode: this.tenantService.currentCompany()?.stateCode || '27',
      billingAddress: '',
      shippingAddress: '',
      narration: '',
      dcIds: [],
      items: []
    };
    this.recalculateTotals();
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedInvoice = null;
    this.loadInvoices();
  }

  onCustomerSelected() {
    const cust = this.customers.find(c => c.id === this.newInv.customerLedgerId);
    if (cust) {
      this.newInv.billingAddress = cust.addressLine1 || '';
      this.newInv.shippingAddress = cust.addressLine1 || '';
      this.newInv.placeOfSupplyStateCode = cust.stateCode || '27';
      const compState = this.tenantService.currentCompany()?.stateCode || '27';
      const isInter = compState !== (cust.stateCode || '27');
      this.newInv.items.forEach((it: any) => it.isInterstate = isInter);
      this.recalculateTotals();
    }
  }

  addItemRow() {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const isInter = compState !== (this.newInv.placeOfSupplyStateCode || '27');
    this.newInv.items.push({
      itemId: '',
      billedQty: 1,
      unitPrice: 0,
      discountAmount: 0,
      taxRate: 18,
      unitCode: 'Pcs',
      isInterstate: isInter
    });
  }

  onFastItemAdded(itemData: any) {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const isInter = compState !== (this.newInv.placeOfSupplyStateCode || '27');
    const item = this.itemsList.find(i => i.id === itemData.itemId);
    
    let emptyRow = this.newInv.items.find((r: any) => !r.itemId);
    if (emptyRow) {
      emptyRow.itemId = itemData.itemId;
      emptyRow.billedQty = itemData.qty;
      emptyRow.unitPrice = itemData.rate;
      emptyRow.discountAmount = itemData.discount;
      emptyRow.taxRate = itemData.gstRate;
      emptyRow.unitCode = item?.unitCode || item?.unit || 'Pcs';
      emptyRow.isInterstate = isInter;
    } else {
      this.newInv.items.push({
        itemId: itemData.itemId,
        billedQty: itemData.qty,
        unitPrice: itemData.rate,
        discountAmount: itemData.discount,
        taxRate: itemData.gstRate,
        unitCode: item?.unitCode || item?.unit || 'Pcs',
        isInterstate: isInter
      });
    }
    this.recalculateTotals();
  }

  editingItemData: any = null;

  editItemRow(index: number) {
    this.editingItemData = { item: this.newInv.items[index], index };
  }

  onFastItemUpdated(itemData: any) {
    if (itemData.index !== null && itemData.index !== undefined) {
      const compState = this.tenantService.currentCompany()?.stateCode || '27';
      const isInter = compState !== (this.newInv.placeOfSupplyStateCode || '27');
      const item = this.itemsList.find(i => i.id === itemData.itemId);
      this.newInv.items[itemData.index] = {
        itemId: itemData.itemId,
        billedQty: itemData.qty,
        unitPrice: itemData.rate,
        discountAmount: itemData.discount,
        taxRate: itemData.gstRate,
        unitCode: item?.unitCode || item?.unit || 'Pcs',
        isInterstate: isInter
      };
      this.editingItemData = null;
      this.recalculateTotals();
    }
  }

  removeItemRow(index: number) {
    this.newInv.items.splice(index, 1);
    if (this.newInv.items.length === 0) {
      this.newInv.items = this.createDefaultGridRows(1);
    }
    this.recalculateTotals();
  }

  onItemSelect(index: number) {
    const row = this.newInv.items[index];
    const item = this.itemsList.find(i => i.id === row.itemId);
    if (item) {
      row.unitPrice = Number(item.salesPrice || item.purchasePrice || 0);
      row.taxRate = Number(item.taxRate || 18);
      row.unitCode = item.unitCode || item.unit || 'Pcs';
      this.recalculateTotals();
    }
  }

  pullPendingChallans() {
    if (!this.newInv.customerLedgerId) return;
    this.loadingPendingChallans = true;
    this.salesService.getCustomerPendingChallans(this.newInv.customerLedgerId, this.companyId).subscribe({
      next: (challans) => {
        this.loadingPendingChallans = false;
        if (!challans || challans.length === 0) {
          alert('No unbilled delivery challans found for this customer.');
          return;
        }

        const lines: any[] = [];
        const dcIds: string[] = [];

        for (const dc of challans) {
          dcIds.push(dc.id);
          for (const item of dc.items || []) {
            const pendingQty = Number(item.dispatchedQty || 0) - Number(item.invoicedQty || 0);
            if (pendingQty > 0) {
              lines.push({
                itemId: item.itemId,
                billedQty: pendingQty,
                unitPrice: Number(item.rate || 0),
                discountAmount: Number(item.discountAmount || 0),
                taxRate: Number(item.gstRate || 18),
                isInterstate: false,
                dcItemId: item.id
              });
            }
          }
        }

        if (lines.length > 0) {
          this.newInv.items = lines;
          this.newInv.dcIds = dcIds;
          this.recalculateTotals();
        } else {
          alert('All items in dispatched challans have already been billed.');
        }
      },
      error: () => {
        this.loadingPendingChallans = false;
      }
    });
  }

  recalculateTotals() {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const r of this.newInv.items) {
      if (!r.itemId) continue;
      const qty = Number(r.billedQty || 0);
      const rate = Number(r.unitPrice || 0);
      const disc = Number(r.discountAmount || 0);
      const taxable = Math.max(0, qty * rate - disc);
      const taxRate = Number(r.taxRate || 0);

      subtotal += taxable;
      if (r.isInterstate) {
        igst += (taxable * taxRate) / 100;
      } else {
        cgst += (taxable * (taxRate / 2)) / 100;
        sgst += (taxable * (taxRate / 2)) / 100;
      }
    }

    const unrounded = subtotal + cgst + sgst + igst;
    const rounded = Math.round(unrounded);
    const roundOff = rounded - unrounded;

    this.modalTotals = {
      taxableSubtotal: subtotal,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      roundOff: roundOff,
      grandTotal: rounded
    };
  }

  isValidInvoice(): boolean {
    const validItems = this.newInv.items.filter((i: any) => !!i.itemId && Number(i.billedQty) > 0);
    return (
      !!this.newInv.customerLedgerId &&
      validItems.length > 0
    );
  }

  submitInvoice() {
    if (!this.isValidInvoice()) return;
    this.submitting = true;
    const validItems = this.newInv.items.filter((i: any) => !!i.itemId && Number(i.billedQty) > 0);
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newInv,
      items: validItems
    };

    this.salesService.createSalesInvoice(payload).subscribe({
      next: (created: any) => {
        this.submitting = false;
        this.toast.success(
          `Sales Invoice ${created?.invoiceNo || ''} created successfully! Total: ₹${Number(this.modalTotals.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          'Invoice Generated',
        );
        this.viewMode = 'list';
        this.loadInvoices();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to create sales invoice';
        this.toast.error(msg, 'Creation Failed');
        alert(msg);
      }
    });
  }

  viewInvoice(id: string) {
    this.salesService.getSalesInvoiceById(id).subscribe({
      next: (inv) => {
        this.selectedInvoice = inv;
        this.viewMode = 'view';
      }
    });
  }

  recordPayment(inv: any) {
    this.router.navigate(['/sales/customer-receipts'], {
      queryParams: { invoiceId: inv.id, customerId: inv.customerLedgerId }
    });
  }

  createReturn(inv: any) {
    this.router.navigate(['/sales/sales-returns'], {
      queryParams: { invoiceId: inv.id, customerId: inv.customerLedgerId }
    });
  }

  printInvoice() {
    window.print();
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIALLY_PAID': return 'badge-partially-paid';
      case 'PAID': return 'badge-paid';
      default: return '';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || '';
  }

  exportInvoices() {
    if (!this.invoices || this.invoices.length === 0) return;
    const headers = ['Invoice No', 'Date', 'Customer', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Balance Due', 'Status'];
    const rows = this.invoices.map((inv) => [
      inv.invoiceNo || '',
      inv.invoiceDate || '',
      inv.customerLedger?.name || '',
      inv.taxableSubtotal || 0,
      inv.cgstTotal || 0,
      inv.sgstTotal || 0,
      inv.igstTotal || 0,
      inv.grandTotal || 0,
      Number(inv.grandTotal || 0) - Number(inv.paidAmount || 0),
      inv.status || '',
    ]);
    exportToCsv('Sales_Invoices', headers, rows);
    this.toast.success('Sales invoices exported successfully!', 'Export Complete');
  }
}
