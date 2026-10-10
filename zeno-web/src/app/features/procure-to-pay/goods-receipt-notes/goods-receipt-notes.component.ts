import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../../shared/ui/zeno-searchable-select.component';
import { ZenoItemFastEntryComponent } from '../../../shared/ui/zeno-item-fast-entry.component';

@Component({
  selector: 'app-goods-receipt-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent, ZenoItemFastEntryComponent],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Goods Receipt Notes</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-box"></i> Create GRN (Stock IN)
            </button>
          </div>
        </div>

        <!-- FILTER CARD -->
        <!-- TOOLBAR & TABLE CARD -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="loadGrns()"
                placeholder="Search Goods Receipt Notes..."
              />
            </div>

            <div class="toolbar-filters">
              <select
                class="form-select"
                [(ngModel)]="selectedStatus"
                (change)="filterStatus(selectedStatus)"
              >
                <option value="">All GRNs</option>
                <option value="PENDING">Pending Invoicing</option>
                <option value="PARTIALLY_CLEARED">Partially Invoiced</option>
                <option value="CLEARED">Cleared</option>
              </select>

              <button class="btn-export" (click)="exportGrns()" [disabled]="grns.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>
          <table class="zeno-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>GRN Date</th>
                <th>Vendor</th>
                <th>Warehouse / Godown</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (grns.length === 0) {
                <tr>
                  <td colspan="6" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No Goods Receipt Notes found. Receive items against pending POs to update stock.
                  </td>
                </tr>
              }
              @for (grn of grns; track grn.id) {
                <tr>
                  <td class="font-mono font-bold" style="color: var(--primary-700)">{{ grn.voucherNo }}</td>
                  <td>{{ grn.grnDate }}</td>
                  <td class="font-bold">{{ grn.vendorLedger?.name }}</td>
                  <td>
                    <span class="badge-pill" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
                      <i class="pi pi-warehouse"></i> {{ grn.godown?.name || 'Main Warehouse' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-pill" [ngClass]="{
                      'badge-pending': grn.status === 'PENDING',
                      'badge-partial': grn.status === 'PARTIALLY_CLEARED',
                      'badge-cleared': grn.status === 'CLEARED'
                    }">
                      {{ grn.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="action-btn" title="View GRN & Lines" (click)="viewGrn(grn.id)">
                      <i class="pi pi-eye"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE GRN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Goods Receipt Note</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitCreateGRN()" [disabled]="submitting || form.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Stock IN...
              } @else {
                <i class="pi pi-check"></i> Post Goods Receipt
              }
            </button>
          </div>
        </div>

        <div class="form-page-no-card">
          @if (createError) {
            <div class="alert alert-error" style="margin-bottom: 16px;">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ createError }}</span>
            </div>
          }

          <!-- TOP SECTION: VENDOR & METADATA (MAX 4 FIELDS) -->
          <div class="form-grid-4">
            <div class="form-group">
              <label class="required">Vendor</label>
              <zeno-searchable-select
                [options]="vendors"
                labelKey="name"
                valueKey="id"
                secondaryKey="gstin"
                placeholder="-- Select Vendor --"
                [(ngModel)]="form.vendorLedgerId"
                (selectChange)="onVendorChange()"
              ></zeno-searchable-select>
            </div>

            <div class="form-group">
              <label>Vendor Challan No.</label>
              <input
                type="text"
                placeholder="e.g. CH-2026-001"
                [(ngModel)]="form.vendorChallanNo"
              />
            </div>

            <div class="form-group">
              <label class="required">GRN Date</label>
              <input type="date" [(ngModel)]="form.grnDate" required />
            </div>

            <div class="form-group">
              <label class="required">Destination Godown / Warehouse</label>
              <select [(ngModel)]="form.godownId" required>
                @for (g of tenant.godowns(); track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code }})</option>
                }
              </select>
            </div>

            @if (form.vendorLedgerId) {
              <div class="form-group span-4" style="margin-top: 4px;">
                <button type="button" class="btn-secondary" style="height: 38px; align-self: flex-start;" (click)="openPoModal()">
                  <i class="pi pi-link"></i> Select Pending POs ({{ pendingPos.length }})
                </button>
              </div>
            }
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
                    <th style="min-width: 200px;">Item Description</th>
                    <th style="width: 100px;" class="text-center">Ordered Qty</th>
                    <th style="width: 110px;" class="text-center">Received Qty</th>
                    <th style="width: 80px;" class="text-center">Unit</th>
                    <th style="width: 110px;" class="text-right">Unit Rate (₹)</th>
                    <th style="width: 120px;" class="text-right">Total (₹)</th>
                    <th style="width: 70px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (form.items.length === 0) {
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 24px; color: var(--surface-500);">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 6px; color: var(--surface-400);"></i>
                        No items added. Use the Fast Item Entry Bar above or click "Select Pending POs".
                      </td>
                    </tr>
                  } @else {
                    @for (line of form.items; track $index) {
                      <tr>
                        <td class="excel-row-num text-center">{{ $index + 1 }}</td>
                        <td>
                          <div class="line-item-desc">
                            <span class="font-bold" style="padding: 2px 6px; display: inline-block;">{{ line.itemName || 'Selected Item' }}</span>
                            @if (line.poItemId) {
                              <span class="badge-source-po" style="margin-left: 6px;"><i class="pi pi-file"></i> PO Line</span>
                            }
                          </div>
                        </td>
                        <td class="text-center font-mono">
                          {{ line.orderedQty || 0 }}
                        </td>
                        <td class="text-center font-mono font-bold">
                          {{ line.receivedQty }}
                        </td>
                        <td class="text-center">
                          <span class="unit-badge">{{ line.unitCode || 'NOS' }}</span>
                        </td>
                        <td class="text-right font-mono">
                          ₹{{ line.rate | number:'1.2-2' }}
                        </td>
                        <td class="text-right font-mono font-bold" style="padding: 2px 8px; font-size: 0.875rem; color: var(--surface-900);">
                          ₹{{ line.totalAmount | number:'1.2-2' }}
                        </td>
                        <td class="text-center">
                          <button type="button" class="btn-icon text-primary" (click)="editItemRow($index)" title="Edit line item">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button type="button" class="btn-icon text-danger" (click)="removeLine($index)" title="Delete line item">
                            <i class="pi pi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY & TOTALS FOOTER SECTION -->
          <div class="form-footer-section">
            <div class="narration-box">
              <label class="narration-label"><i class="pi pi-align-left"></i> Delivery / Challan Notes</label>
              <textarea
                rows="3"
                class="narration-textarea"
                placeholder="Enter delivery or challan notes..."
                [(ngModel)]="form.notes"
              ></textarea>
            </div>

            <div class="totals-summary-card">
              <div class="summary-line grand-total">
                <span>Total Received Value:</span>
                <strong>₹{{ grnTotalValue | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && viewingGrn) {
        <!-- VIEW GRN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Goods Receipt Note: {{ viewingGrn.voucherNo }}</h1>
            <span class="badge-pill badge-cleared">Stock Posted IN</span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print GRN
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--surface-200); padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <div class="font-bold" style="font-size: 1.125rem;">Vendor: {{ viewingGrn.vendorLedger?.name }}</div>
              @if (viewingGrn.vendorChallanNo) {
                <div>Vendor Challan No: <strong>{{ viewingGrn.vendorChallanNo }}</strong></div>
              }
              <div>GRN Date: {{ viewingGrn.grnDate }}</div>
            </div>
            <div style="text-align: right;">
              <div>Godown: <strong>{{ viewingGrn.godown?.name }}</strong></div>
              <div>Branch: <strong>{{ viewingGrn.branch?.branchName || 'Head Office' }}</strong></div>
            </div>
          </div>

          <div class="section-title" style="font-weight: 700; margin-bottom: 12px;">Received Line Items</div>
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Received Qty</th>
                <th>Rate</th>
                <th class="text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              @for (item of viewingGrn.items; track item.id) {
                <tr>
                  <td class="font-bold">{{ item.item?.name }}</td>
                  <td>{{ item.receivedQty }} {{ item.unit?.code }}</td>
                  <td>₹{{ item.rate }}</td>
                  <td class="text-right font-mono font-bold">₹{{ item.totalAmount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- SELECT PENDING POS DIALOG (UTILITY SELECTOR) -->
    @if (showPoModal) {
      <div class="modal-backdrop" style="z-index: 1050;">
        <div class="modal-dialog" style="max-width: 760px;">
          <div class="modal-header">
            <h3>Pending Purchase Orders for Selected Vendor</h3>
            <button class="close-btn" (click)="showPoModal = false">&times;</button>
          </div>
          <div class="modal-body">
            @if (pendingPos.length === 0) {
              <div style="padding: 32px; text-align: center; color: var(--surface-500);">
                No pending orders found for this vendor.
              </div>
            } @else {
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>PO Voucher</th>
                    <th>Date</th>
                    <th>Lines</th>
                    <th>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (po of pendingPos; track po.id) {
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          [checked]="selectedPoIds.includes(po.id)"
                          (change)="togglePoSelect(po.id)"
                        />
                      </td>
                      <td class="font-mono font-bold">{{ po.voucherNo }}</td>
                      <td>{{ po.orderDate }}</td>
                      <td>{{ po.items?.length }} Items</td>
                      <td class="font-mono">₹{{ po.grandTotal }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showPoModal = false">Cancel</button>
            <button class="btn-primary" (click)="confirmPullPOs()" [disabled]="selectedPoIds.length === 0">
              Pull Selected POs ({{ selectedPoIds.length }})
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './goods-receipt-notes.component.scss',
})
export class GoodsReceiptNotesComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  grns: any[] = [];
  vendors: any[] = [];
  itemsList: any[] = [];
  pendingPos: any[] = [];
  selectedPoIds: string[] = [];

  selectedStatus = '';
  searchQuery = '';
  showPoModal = false;
  submitting = false;
  createError = '';
  viewingGrn: any = null;

  get pendingInvoicingCount(): number {
    return this.grns.filter(g => g.status === 'PENDING' || g.status === 'PARTIALLY_CLEARED').length;
  }

  get fullyInvoicedCount(): number {
    return this.grns.filter(g => g.status === 'CLEARED').length;
  }

  get activeIntakesCount(): number {
    return this.grns.filter(g => g.status !== 'CANCELLED').length;
  }

  form: any = {
    grnDate: new Date().toISOString().split('T')[0],
    vendorLedgerId: '',
    vendorChallanNo: '',
    godownId: '',
    notes: '',
    items: [],
  };

  get grnTotalValue(): number {
    return (this.form?.items || []).reduce((sum: number, line: any) => sum + Number(line.totalAmount || 0), 0);
  }

  getItemName(itemId: string): string {
    if (!itemId) return '';
    const item = this.itemsList.find(i => i.id === itemId);
    return item ? (item.name || item.itemName) : 'Selected Item';
  }

  constructor(
    private p2p: P2pService,
    public tenant: TenantService,
    private masters: MastersService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadGrns();
        this.loadMasters();
      },
    });
  }

  loadGrns() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.p2p.getGoodsReceiptNotes(compId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => (this.grns = res),
    });
  }

  loadMasters() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getLedgers(compId, true).subscribe({ next: (v) => (this.vendors = v) });
    this.masters.getItems(compId).subscribe({ next: (it) => (this.itemsList = it) });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadGrns();
  }

  openCreateModal() {
    this.form = {
      grnDate: new Date().toISOString().split('T')[0],
      vendorLedgerId: this.vendors[0]?.id || '',
      vendorChallanNo: '',
      godownId: this.tenant.currentGodown()?.id || '',
      notes: '',
      items: [],
    };
    this.pendingPos = [];
    this.selectedPoIds = [];
    this.createError = '';
    this.viewMode = 'create';
    if (this.form.vendorLedgerId) {
      this.onVendorChange();
    }
  }

  backToList() {
    this.viewMode = 'list';
    this.viewingGrn = null;
    this.createError = '';
    this.loadGrns();
  }

  onVendorChange() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId || !this.form.vendorLedgerId) return;

    this.p2p.getVendorPendingOrders(this.form.vendorLedgerId, compId).subscribe({
      next: (pos) => (this.pendingPos = pos),
    });
  }

  openPoModal() {
    this.showPoModal = true;
  }

  togglePoSelect(poId: string) {
    if (this.selectedPoIds.includes(poId)) {
      this.selectedPoIds = this.selectedPoIds.filter((id) => id !== poId);
    } else {
      this.selectedPoIds.push(poId);
    }
  }

  confirmPullPOs() {
    const selected = this.pendingPos.filter((po) => this.selectedPoIds.includes(po.id));
    this.form.items = [];

    for (const po of selected) {
      for (const item of po.items || []) {
        const remaining = Math.max(0, Number(item.orderedQty) - Number(item.receivedQty || 0));
        if (remaining > 0) {
          this.form.items.push({
            poItemId: item.id,
            itemId: item.itemId,
            itemName: item.item?.name,
            unitId: item.unitId,
            unitCode: item.unit?.code || 'NOS',
            orderedQty: item.orderedQty,
            receivedQty: remaining,
            rate: Number(item.rate),
            totalAmount: Number((remaining * Number(item.rate)).toFixed(2)),
          });
        }
      }
    }
    this.showPoModal = false;
  }

  addManualLine() {
    const firstItem = this.itemsList[0];
    const line = {
      itemId: firstItem?.id || '',
      itemName: firstItem?.name || '',
      unitId: firstItem?.unitId || '',
      unitCode: firstItem?.unit?.code || 'NOS',
      orderedQty: 1,
      receivedQty: 1,
      rate: Number(firstItem?.purchaseRate || firstItem?.standardCost || 0),
      totalAmount: Number(firstItem?.purchaseRate || firstItem?.standardCost || 0),
    };
    this.form.items.push(line);
  }

  editingItemData: { item: any, index: number } | null = null;

  onFastItemAdded(itemData: any) {
    const line = {
      itemId: itemData.itemId,
      itemName: itemData.itemName,
      unitId: itemData.itemObj?.unitId || '',
      unitCode: itemData.unit || 'NOS',
      orderedQty: itemData.qty,
      receivedQty: itemData.qty,
      rate: itemData.rate,
      totalAmount: itemData.amount
    };
    this.form.items.push(line);
    this.calculateLine(line);
  }

  editItemRow(index: number) {
    const row = this.form.items[index];
    if (row) {
      this.editingItemData = {
        item: {
          itemId: row.itemId,
          qty: row.receivedQty,
          rate: row.rate,
          discount: 0,
          gstRate: 0
        },
        index
      };
    }
  }

  onFastItemUpdated(itemData: any) {
    if (this.editingItemData !== null && this.editingItemData.index >= 0) {
      const idx = this.editingItemData.index;
      const line = this.form.items[idx];
      if (line) {
        line.itemId = itemData.itemId;
        line.itemName = itemData.itemName;
        line.receivedQty = itemData.qty;
        line.orderedQty = itemData.qty;
        line.rate = itemData.rate;
        this.calculateLine(line);
      }
      this.editingItemData = null;
    }
  }

  onManualItemSelect(line: any) {
    const selected = this.itemsList.find((it) => it.id === line.itemId);
    if (selected) {
      line.itemName = selected.name;
      line.unitId = selected.unitId;
      line.unitCode = selected.unit?.code || 'NOS';
      line.rate = Number(selected.purchaseRate || selected.standardCost || 0);
      this.calculateLine(line);
    }
  }

  removeLine(index: number) {
    if (this.editingItemData?.index === index) {
      this.editingItemData = null;
    }
    this.form.items.splice(index, 1);
  }

  calculateLine(line: any) {
    const qty = Number(line.receivedQty || 0);
    const rate = Number(line.rate || 0);
    line.totalAmount = Number((qty * rate).toFixed(2));
  }

  submitCreateGRN() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.tenant.currentBranch()?.id;

    if (!this.form.godownId) {
      this.createError = 'Please select a destination warehouse/godown';
      return;
    }

    this.submitting = true;
    this.createError = '';

    const payload = {
      companyId: compId,
      branchId,
      godownId: this.form.godownId,
      vendorLedgerId: this.form.vendorLedgerId,
      vendorChallanNo: this.form.vendorChallanNo,
      grnDate: this.form.grnDate,
      purchaseOrderIds: this.selectedPoIds,
      notes: this.form.notes,
      items: this.form.items.map((i: any) => ({
        poItemId: i.poItemId || null,
        itemId: i.itemId,
        unitId: i.unitId,
        receivedQty: i.receivedQty,
        rate: i.rate,
      })),
    };

    this.p2p.createGoodsReceiptNote(payload).subscribe({
      next: (grn: any) => {
        this.submitting = false;
        this.toast.success(
          `Goods Receipt Note ${grn?.voucherNo || ''} recorded successfully! Items added to inventory.`,
          'GRN Generated',
        );
        this.viewMode = 'list';
        this.loadGrns();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to record GRN';
        this.toast.error(this.createError, 'GRN Failed');
      },
    });
  }

  viewGrn(id: string) {
    this.p2p.getGoodsReceiptNoteById(id).subscribe({
      next: (grn) => {
        this.viewingGrn = grn;
        this.viewMode = 'view';
      },
    });
  }

  exportGrns() {
    if (!this.grns || this.grns.length === 0) return;
    const headers = ['GRN No', 'Date', 'Vendor', 'Godown / Warehouse', 'Status'];
    const rows = this.grns.map((g: any) => [
      g.voucherNo || '',
      g.grnDate || '',
      g.vendorLedger?.name || '',
      g.godown?.name || '',
      g.status || ''
    ]);
    exportToCsv('Goods_Receipt_Notes', headers, rows);
    this.toast.success('Goods Receipt Notes exported successfully!', 'Export Complete');
  }
}
