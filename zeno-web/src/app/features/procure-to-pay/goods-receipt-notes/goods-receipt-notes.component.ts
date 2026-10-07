import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { P2pService } from '../../../core/services/p2p.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../core/services/toast.service';
import { exportToCsv } from '../../../core/utils/export.util';

@Component({
  selector: 'app-goods-receipt-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Goods Receipt Notes (GRN)</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-box"></i> Create GRN (Stock IN)
            </button>
          </div>
        </div>

        <!-- FILTER CARD -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="loadGrns()"
            />
          </div>

          <div class="filter-actions">
            <select
              class="filter-select"
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

        <!-- TABLE CARD -->
        <div class="zeno-card">
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
            <h1>Record Goods Receipt Note (Stock IN)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-success" (click)="submitCreateGRN()" [disabled]="submitting || form.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Stock IN...
              } @else {
                <i class="pi pi-check"></i> Post Goods Receipt
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          @if (createError) {
            <div class="alert alert-error" style="margin-bottom: 16px;">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ createError }}</span>
            </div>
          }

          <div class="form-grid-3">
            <div class="form-group">
              <label>GRN Date *</label>
              <input type="date" [(ngModel)]="form.grnDate" required />
            </div>

            <div class="form-group">
              <label>Vendor *</label>
              <select [(ngModel)]="form.vendorLedgerId" (change)="onVendorChange()" required>
                <option value="">-- Select Vendor --</option>
                @for (v of vendors; track v.id) {
                  <option [value]="v.id">{{ v.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Destination Godown / Warehouse *</label>
              <select [(ngModel)]="form.godownId" required>
                @for (g of tenant.godowns(); track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code }})</option>
                }
              </select>
            </div>
          </div>

          <!-- PENDING PO SELECTOR BAR -->
          @if (form.vendorLedgerId) {
            <div class="po-pull-bar">
              <div class="po-pull-text">
                <i class="pi pi-link"></i> Pull items from pending Purchase Orders for this vendor
              </div>
              <button type="button" class="btn-secondary" (click)="openPoModal()">
                <i class="pi pi-search"></i> Select Pending POs ({{ pendingPos.length }} available)
              </button>
            </div>
          }

          <!-- RECEIVED ITEMS -->
          <div class="line-items-section">
            <div class="section-title">Received Line Items</div>
            <table class="zeno-table line-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Ordered Qty</th>
                  <th>Received Qty (Stock IN) *</th>
                  <th>Unit Rate (₹)</th>
                  <th class="text-right">Total (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @if (form.items.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center" style="padding: 24px; color: var(--surface-500);">
                      No items added. Click "Select Pending POs" above or add item directly.
                    </td>
                  </tr>
                }
                @for (line of form.items; track $index) {
                  <tr>
                    <td class="font-bold">{{ line.itemName || 'Selected Item' }}</td>
                    <td>{{ line.orderedQty || 0 }} {{ line.unitCode }}</td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.receivedQty"
                        (input)="calculateLine(line)"
                        min="1"
                        style="width: 100px;"
                      />
                    </td>
                    <td>₹{{ line.rate }}</td>
                    <td class="text-right font-mono font-bold">₹{{ line.totalAmount }}</td>
                    <td class="text-right">
                      <button class="remove-line-btn" (click)="removeLine($index)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <button type="button" class="btn-secondary add-line-btn" (click)="addManualLine()">
              <i class="pi pi-plus"></i> Add Direct Item
            </button>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label>Delivery / Challan Notes</label>
            <textarea [(ngModel)]="form.notes" rows="3"></textarea>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-success" (click)="submitCreateGRN()" [disabled]="submitting || form.items.length === 0">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Stock IN...
              } @else {
                <i class="pi pi-check"></i> Post Goods Receipt
              }
            </button>
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
  styles: [`
    .p2p-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
      .header-actions { display: flex; gap: 10px; }
    }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .btn-back {
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      border-radius: var(--radius-sm);
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: var(--surface-200); color: var(--surface-900); }
    }
    .form-page-card { padding: 24px; }
    .filter-card { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; .filter-group { position: relative; flex: 1; max-width: 360px; .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); } input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); font-size: 0.875rem; outline: none; } } .status-tabs { display: flex; gap: 6px; button { background: none; border: 1px solid transparent; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; color: var(--surface-600); cursor: pointer; &.active { background-color: var(--primary-50); color: var(--primary-700); border-color: var(--primary-200); } } } }
    .action-btn { width: 32px; height: 32px; border: 1px solid var(--surface-200); background: var(--surface-0); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--surface-600); }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); } input, select, textarea { border: 1px solid var(--surface-300); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.875rem; } }
    .po-pull-bar { display: flex; align-items: center; justify-content: space-between; background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-sm); padding: 12px 16px; margin: 16px 0; .po-pull-text { font-size: 0.875rem; font-weight: 600; color: var(--primary-800); display: flex; align-items: center; gap: 8px; } }
    .line-items-section { margin: 16px 0; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); padding: 16px; background: var(--surface-50); .section-title { font-size: 0.875rem; font-weight: 700; margin-bottom: 12px; } .line-table { background: #ffffff; border: 1px solid var(--surface-200); border-radius: var(--radius-sm); } .add-line-btn { margin-top: 12px; font-size: 0.8125rem; padding: 6px 12px; } .remove-line-btn { background: none; border: none; color: var(--danger); cursor: pointer; } }
    .badge-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
    .badge-pending { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-partial { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .badge-cleared { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.72rem; color: var(--surface-500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); margin-top: 2px; }
  `],
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
    godownId: '',
    notes: '',
    items: [],
  };

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
    this.form.items.push({
      itemId: firstItem?.id || '',
      itemName: firstItem?.name || '',
      unitId: firstItem?.unitId || '',
      unitCode: firstItem?.unit?.code || 'NOS',
      orderedQty: 1,
      receivedQty: 1,
      rate: Number(firstItem?.purchaseRate || 0),
      totalAmount: Number(firstItem?.purchaseRate || 0),
    });
  }

  removeLine(index: number) {
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
