import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';

@Component({
  selector: 'app-delivery-challans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Delivery Challans</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Delivery Challan
            </button>
          </div>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-truck"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Challans</span>
              <span class="kpi-value">{{ challans.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon orange"><i class="pi pi-file-edit"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Pending Invoicing</span>
              <span class="kpi-value">{{ pendingCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-check"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Fully Invoiced</span>
              <span class="kpi-value">{{ clearedCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-compass"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Active Dispatches</span>
              <span class="kpi-value">{{ challans.length }}</span>
            </div>
          </div>
        </div>

        <!-- FILTER & TOOLBAR -->
        <div class="zeno-card">
          <div class="filter-card">
            <div class="filter-group">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                placeholder="Search by challan #, vehicle, customer..."
                [(ngModel)]="searchQuery"
                (input)="loadChallans()"
              />
            </div>

            <div class="status-tabs">
              <button [class.active]="selectedStatus === ''" (click)="filterStatus('')">All</button>
              <button [class.active]="selectedStatus === 'PENDING'" (click)="filterStatus('PENDING')">Pending Invoicing</button>
              <button [class.active]="selectedStatus === 'PARTIALLY_INVOICED'" (click)="filterStatus('PARTIALLY_INVOICED')">Part-Invoiced</button>
              <button [class.active]="selectedStatus === 'CLEARED'" (click)="filterStatus('CLEARED')">Cleared</button>
            </div>
          </div>

          <!-- CHALLANS TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Challan No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Godown</th>
                <th>Vehicle #</th>
                <th>Items Count</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    <i class="pi pi-spin pi-spinner"></i> Loading delivery challans...
                  </td>
                </tr>
              } @else if (challans.length === 0) {
                <tr>
                  <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    No delivery challans recorded. Create a dispatch to deduct stock.
                  </td>
                </tr>
              } @else {
                @for (dc of challans; track dc.id) {
                  <tr (click)="viewChallan(dc.id)" style="cursor: pointer;">
                    <td class="font-bold" style="color: var(--primary-700)">{{ dc.voucherNo }}</td>
                    <td>{{ dc.challanDate }}</td>
                    <td>
                      <div class="font-bold">{{ dc.customerLedger?.name }}</div>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ dc.customerLedger?.gstin || 'Unregistered' }}</div>
                    </td>
                    <td>{{ dc.godown?.name || 'Main Godown' }}</td>
                    <td>{{ dc.vehicleNo || '-' }}</td>
                    <td>{{ dc.items?.length || 0 }} items</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(dc.status)">{{ formatStatus(dc.status) }}</span>
                    </td>
                    <td class="text-right" (click)="$event.stopPropagation()">
                      <button class="btn-icon" title="View Details" (click)="viewChallan(dc.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE DELIVERY CHALLAN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Record Delivery Challan (Stock OUT)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitChallan()" [disabled]="submitting || !isValidChallan()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Dispatching Stock...
              } @else {
                <i class="pi pi-check"></i> Post Dispatch &amp; Deduct Stock
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <!-- TOP SECTION -->
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer</label>
              <select [(ngModel)]="newDc.customerLedgerId" (change)="onCustomerSelected()">
                <option value="">Select Customer...</option>
                @for (cust of customers; track cust.id) {
                  <option [value]="cust.id">{{ cust.name }} ({{ cust.gstin || 'Unregistered' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Dispatch Godown / Warehouse</label>
              <select [(ngModel)]="newDc.godownId">
                <option value="">Select Warehouse...</option>
                @for (g of godowns; track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Primary' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Challan Date</label>
              <input type="date" [(ngModel)]="newDc.challanDate" />
            </div>

            <div class="form-group">
              <label>Vehicle No</label>
              <input type="text" [(ngModel)]="newDc.vehicleNo" placeholder="e.g. MH-02-CP-8899" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 14px;">
            <div class="form-group">
              <label>Driver Contact / Details</label>
              <input type="text" [(ngModel)]="newDc.driverContact" placeholder="Driver name & phone" />
            </div>
            <div class="form-group">
              <label>Dispatch Destination</label>
              <input type="text" [(ngModel)]="newDc.dispatchAddress" placeholder="Customer site address" />
            </div>
          </div>

          <!-- PULL PENDING ORDERS TRIGGER -->
          @if (newDc.customerLedgerId) {
            <div class="pull-orders-box">
              <div class="pull-orders-info">
                <i class="pi pi-link"></i>
                <span>Pull pending dispatch items from approved Sales Orders</span>
              </div>
              <button class="btn-sm btn-outline" type="button" (click)="pullPendingOrders()" [disabled]="loadingPendingOrders">
                @if (loadingPendingOrders) {
                  <i class="pi pi-spin pi-spinner"></i> Loading...
                } @else {
                  <i class="pi pi-download"></i> Load Pending SO Lines
                }
              </button>
            </div>
          }

          <!-- ITEMS SECTION -->
          <div class="items-section">
            <div class="section-title-row">
              <h3>Dispatched Goods (Stock Deduction)</h3>
              <button class="btn-sm btn-outline" type="button" (click)="addItemRow()">
                <i class="pi pi-plus"></i> Add Item
              </button>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 35%">Product / Item</th>
                  <th style="width: 15%">Dispatch Qty</th>
                  <th style="width: 15%">Unit Rate (₹)</th>
                  <th style="width: 20%">Remarks / SO Ref</th>
                  <th style="width: 15%">Total</th>
                  <th style="width: 4%"></th>
                </tr>
              </thead>
              <tbody>
                @for (row of newDc.items; track $index; let i = $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="row.itemId" (change)="onItemSelect(row)">
                        <option value="">Select Item...</option>
                        @for (it of itemsList; track it.id) {
                          <option [value]="it.id">{{ it.name }} (Stock: {{ it.currentStock || 0 }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        [(ngModel)]="row.dispatchedQty"
                        (input)="recalculateTotals()"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        [(ngModel)]="row.rate"
                        (input)="recalculateTotals()"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="row.remarks"
                        placeholder="e.g. Box 1 of 2"
                      />
                    </td>
                    <td class="font-bold">
                      ₹{{ (row.dispatchedQty * row.rate) | number:'1.2-2' }}
                    </td>
                    <td class="text-right">
                      @if (newDc.items.length > 1) {
                        <button class="btn-icon text-danger" (click)="removeItemRow(i)">
                          <i class="pi pi-trash"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="stock-alert-note">
              <i class="pi pi-info-circle"></i>
              <span>Saving this Delivery Challan creates an immediate <strong>StockLedger OUT</strong> movement and decrements item on-hand inventory.</span>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitChallan()" [disabled]="submitting || !isValidChallan()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Dispatching Stock...
              } @else {
                <i class="pi pi-check"></i> Post Dispatch &amp; Deduct Stock
              }
            </button>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedChallan) {
        <!-- VIEW DELIVERY CHALLAN FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Challan #{{ selectedChallan.voucherNo }}</h1>
            <span class="badge" [ngClass]="getStatusBadge(selectedChallan.status)">
              {{ formatStatus(selectedChallan.status) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()">
              <i class="pi pi-print"></i> Print Challan
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Customer</span>
              <strong>{{ selectedChallan.customerLedger?.name }}</strong>
              <p>{{ selectedChallan.dispatchAddress || 'Customer registered address' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Dispatch Details</span>
              <p><strong>Date:</strong> {{ selectedChallan.challanDate }}</p>
              <p><strong>Godown:</strong> {{ selectedChallan.godown?.name }}</p>
            </div>
            <div class="info-block">
              <span class="label">Transport Logistics</span>
              <p><strong>Vehicle:</strong> {{ selectedChallan.vehicleNo || 'Not specified' }}</p>
              <p><strong>Contact:</strong> {{ selectedChallan.driverContact || 'N/A' }}</p>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: var(--surface-700)">Dispatched Line Items</h4>
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Dispatched Qty</th>
                <th>Invoiced Qty</th>
                <th>Pending to Invoice</th>
                <th>Rate</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of selectedChallan.items; track item.id) {
                <tr>
                  <td>
                    <strong>{{ item.item?.name }}</strong>
                    <div style="font-size: 0.75rem; color: var(--surface-500)">{{ item.item?.sku }}</div>
                  </td>
                  <td class="font-bold">{{ item.dispatchedQty }} {{ item.unit?.code || 'NOS' }}</td>
                  <td class="text-success font-bold">{{ item.invoicedQty }}</td>
                  <td class="font-bold" [class.text-orange]="(item.dispatchedQty - item.invoicedQty) > 0">
                    {{ item.dispatchedQty - item.invoicedQty }}
                  </td>
                  <td>₹{{ item.rate | number:'1.2-2' }}</td>
                  <td class="text-right font-bold">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page { display: flex; flex-direction: column; gap: 20px; }
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
    
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .zeno-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
    .filter-card { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .filter-group { position: relative; width: 320px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); }
    .filter-group input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .status-tabs { display: flex; gap: 6px; background: var(--surface-100); padding: 4px; border-radius: 8px; }
    .status-tabs button { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; color: var(--surface-600); cursor: pointer; transition: all 0.2s; }
    .status-tabs button.active { background: #fff; color: var(--primary-700); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
    .badge-pending { background: #FEF3C7; color: #D97706; }
    .badge-part-invoiced { background: #E0E7FF; color: #4338CA; }
    .badge-cleared { background: #DCFCE7; color: #15803D; }

    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600); color: var(--primary-600); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .pull-orders-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .pull-orders-info { display: flex; align-items: center; gap: 8px; color: #1E40AF; font-size: 0.85rem; }

    .items-section { margin-top: 16px; }
    .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; }
    .items-table th { background: var(--surface-100); padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: var(--surface-600); }
    .items-table td { padding: 8px 10px; border-bottom: 1px solid var(--surface-200); }
    .items-table select, .items-table input { width: 100%; padding: 6px 8px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.85rem; }

    .stock-alert-note { margin-top: 16px; background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 10px 14px; border-radius: 8px; font-size: 0.825rem; display: flex; align-items: center; gap: 8px; }

    .detail-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .info-block { background: var(--surface-50); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-200); }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; display: block; margin-bottom: 4px; }
    .text-orange { color: #EA580C; }
    .text-success { color: #16A34A; }
  `]
})
export class DeliveryChallansComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  challans: any[] = [];
  customers: any[] = [];
  godowns: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  loadingPendingOrders = false;

  searchQuery = '';
  selectedStatus = '';
  selectedChallan: any = null;

  Number = Number;

  newDc: any = {
    customerLedgerId: '',
    godownId: '',
    challanDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driverContact: '',
    dispatchAddress: '',
    soIds: [] as string[],
    items: [
      { itemId: '', dispatchedQty: 1, rate: 0, remarks: '', soItemId: null }
    ]
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadChallans();
    this.loadMasters();
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get pendingCount(): number {
    return this.challans.filter(c => c.status === 'PENDING').length;
  }

  get clearedCount(): number {
    return this.challans.filter(c => c.status === 'CLEARED').length;
  }

  loadChallans() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getDeliveryChallans(this.companyId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => {
        this.challans = res || [];
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
    } else {
      this.godowns = [
        { id: this.tenantService.currentGodown()?.id || 'main-godown', name: 'Main Godown', code: 'MAIN' }
      ];
    }
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadChallans();
  }

  openCreateModal() {
    this.newDc = {
      customerLedgerId: '',
      godownId: this.godowns[0]?.id || '',
      challanDate: new Date().toISOString().split('T')[0],
      vehicleNo: '',
      driverContact: '',
      dispatchAddress: '',
      soIds: [],
      items: [
        { itemId: '', dispatchedQty: 1, rate: 0, remarks: '', soItemId: null }
      ]
    };
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedChallan = null;
    this.loadChallans();
  }

  onCustomerSelected() {
    const cust = this.customers.find(c => c.id === this.newDc.customerLedgerId);
    if (cust) {
      this.newDc.dispatchAddress = cust.addressLine1 || '';
    }
  }

  addItemRow() {
    this.newDc.items.push({
      itemId: '',
      dispatchedQty: 1,
      rate: 0,
      remarks: '',
      soItemId: null
    });
  }

  removeItemRow(index: number) {
    this.newDc.items.splice(index, 1);
  }

  onItemSelect(row: any) {
    const it = this.itemsList.find(i => i.id === row.itemId);
    if (it) {
      row.rate = Number(it.saleRate || 0);
    }
  }

  pullPendingOrders() {
    if (!this.newDc.customerLedgerId) return;
    this.loadingPendingOrders = true;
    this.salesService.getCustomerPendingOrders(this.newDc.customerLedgerId, this.companyId).subscribe({
      next: (orders) => {
        this.loadingPendingOrders = false;
        if (!orders || orders.length === 0) {
          alert('No pending sales orders found for this customer.');
          return;
        }

        const lines: any[] = [];
        const soIds: string[] = [];

        for (const order of orders) {
          soIds.push(order.id);
          for (const item of order.items || []) {
            const pendingQty = Number(item.orderedQty || 0) - Number(item.dispatchedQty || 0);
            if (pendingQty > 0) {
              lines.push({
                itemId: item.itemId,
                dispatchedQty: pendingQty,
                rate: Number(item.rate || 0),
                remarks: `From Order #${order.voucherNo}`,
                soItemId: item.id
              });
            }
          }
        }

        if (lines.length > 0) {
          this.newDc.items = lines;
          this.newDc.soIds = soIds;
        } else {
          alert('All items in open orders have already been dispatched.');
        }
      },
      error: () => {
        this.loadingPendingOrders = false;
      }
    });
  }

  recalculateTotals() {
    // triggers UI update for line totals
  }

  isValidChallan(): boolean {
    return (
      !!this.newDc.customerLedgerId &&
      !!this.newDc.godownId &&
      this.newDc.items.length > 0 &&
      this.newDc.items.every((i: any) => !!i.itemId && Number(i.dispatchedQty) > 0)
    );
  }

  submitChallan() {
    if (!this.isValidChallan()) return;
    this.submitting = true;
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newDc
    };

    this.salesService.createDeliveryChallan(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadChallans();
      },
      error: (err) => {
        this.submitting = false;
        alert(err?.error?.message || 'Failed to create delivery challan');
      }
    });
  }

  viewChallan(id: string) {
    this.salesService.getDeliveryChallanById(id).subscribe({
      next: (dc) => {
        this.selectedChallan = dc;
        this.viewMode = 'view';
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIALLY_INVOICED': return 'badge-part-invoiced';
      case 'CLEARED': return 'badge-cleared';
      default: return '';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || '';
  }
}
