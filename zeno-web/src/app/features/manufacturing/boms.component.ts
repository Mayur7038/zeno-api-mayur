import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManufacturingService } from '../../core/services/manufacturing.service';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';

interface BomLine {
  itemId: string;
  variantId?: string | null;
  consumedQty: number;
  unitRate: number;
  scrapPercentage: number;
  totalAmount: number;
  notes?: string;
}

@Component({
  selector: 'app-boms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manufacturing-page">
      @if (viewMode === 'list') {
        <div class="page-header">
          <div>
            <h1>Bill of Materials (BOM)</h1>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> New BOM Recipe
            </button>
          </div>
        </div>

        <!-- FILTER & TOOLBAR -->
        <div class="zeno-card">
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterBoms()"
              />
            </div>
            <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
              <select [(ngModel)]="statusFilter" (change)="filterBoms()" class="filter-select" style="min-width: 140px;">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <button class="btn-export" (click)="exportBoms()" [disabled]="filteredBoms.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <!-- BOM TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>BOM Code</th>
                <th>Recipe Name</th>
                <th>Finished Product</th>
                <th class="text-right">Produced Qty</th>
                <th class="text-center">Components</th>
                <th class="text-right">Total Est. Cost</th>
                <th class="text-right">Unit Cost</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    <i class="pi pi-spin pi-spinner"></i> Loading BOM recipes...
                  </td>
                </tr>
              } @else if (filteredBoms.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No Bill of Materials recipes found. Click "New BOM Recipe" to create one.
                  </td>
                </tr>
              }
              @for (b of filteredBoms; track b.id) {
                <tr>
                  <td class="font-mono font-bold">{{ b.bomNo }}</td>
                  <td>
                    <strong>{{ b.name }}</strong>
                  </td>
                  <td>
                    <span class="badge-pill badge-partial">
                      <i class="pi pi-box"></i> {{ b.finishedItem?.name || '—' }}
                    </span>
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ b.producedQty }} {{ b.finishedItem?.unit?.code || 'Units' }}
                  </td>
                  <td class="text-center">
                    <span class="badge-pill badge-custom">
                      {{ b.items?.length || 0 }} items
                    </span>
                  </td>
                  <td class="text-right font-mono font-bold" style="color: #1e40af;">
                    ₹{{ b.totalCost | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono" style="color: #047857;">
                    ₹{{ (b.totalCost / (b.producedQty || 1)) | number:'1.2-2' }}
                  </td>
                  <td>
                    @if (b.isActive) {
                      <span class="badge-pill badge-cleared"><i class="pi pi-check"></i> Active</span>
                    } @else {
                      <span class="badge-pill badge-cancelled">Inactive</span>
                    }
                  </td>
                  <td class="text-right actions-cell">
                    <button class="btn-icon" (click)="viewBomDetails(b)" title="View Recipe Details">
                      <i class="pi pi-eye"></i>
                    </button>
                    <button class="btn-icon" (click)="openEditPage(b)" title="Edit Recipe">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon text-danger" (click)="deleteBom(b)" title="Delete BOM">
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- FULL PAGE CREATE / EDIT BOM RECIPE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>{{ editingBom ? 'Edit Bill of Materials' : 'New Bill of Materials' }}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="saveBom()" [disabled]="saving">
              @if (saving) {
                <i class="pi pi-spin pi-spinner"></i> Saving...
              } @else {
                <i class="pi pi-check"></i> {{ editingBom ? 'Update BOM Recipe' : 'Save BOM Recipe' }}
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          @if (errorMessage) {
            <div class="alert alert-error">
              <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
            </div>
          }

          <!-- TOP SECTION: HEADER INFO -->
          <div class="form-grid-3">
            <div class="form-group">
              <label class="required">Finished Product to Assemble</label>
              <select [(ngModel)]="formData.finishedItemId" class="form-control">
                <option value="" disabled>-- Select Finished Good --</option>
                @for (it of items; track it.id) {
                  <option [value]="it.id">{{ it.name }} ({{ it.sku || 'No SKU' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Recipe Name</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>BOM Code / Reference</label>
              <input
                type="text"
                [(ngModel)]="formData.bomNo"
                class="form-control font-mono"
              />
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 16px;">
            <div class="form-group">
              <label class="required">Output Batch Qty</label>
              <input
                type="number"
                [(ngModel)]="formData.producedQty"
                min="1"
                (input)="recalculateTotals()"
                class="form-control font-mono"
              />
            </div>

            <div class="form-group">
              <label>Est. Direct Labor Cost (₹)</label>
              <input
                type="number"
                [(ngModel)]="formData.estimatedLaborCost"
                min="0"
                (input)="recalculateTotals()"
                class="form-control font-mono"
              />
            </div>

            <div class="form-group">
              <label>Est. Manufacturing Overhead (₹)</label>
              <input
                type="number"
                [(ngModel)]="formData.estimatedOverheadCost"
                min="0"
                (input)="recalculateTotals()"
                class="form-control font-mono"
              />
            </div>
          </div>

          <!-- COMPONENT LINES SECTION -->
          <div class="section-title-bar">
            <span>Raw Material Components & Ingredients</span>
            <button type="button" class="btn-sm btn-outline" (click)="addComponentLine()">
              <i class="pi pi-plus"></i> Add Component
            </button>
          </div>

          <div class="lines-table-wrap">
            <table class="zeno-table lines-table">
              <thead>
                <tr>
                  <th style="width: 38%;">Raw Material Item</th>
                  <th style="width: 16%;" class="text-right">Consumed Qty</th>
                  <th style="width: 16%;" class="text-right">Unit Rate ₹</th>
                  <th style="width: 12%;" class="text-right">Scrap %</th>
                  <th style="width: 14%;" class="text-right">Subtotal ₹</th>
                  <th style="width: 4%;"></th>
                </tr>
              </thead>
              <tbody>
                @if (lines.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center" style="padding: 24px; color: var(--surface-500);">
                      No raw material components added yet. Click "+ Add Component" above.
                    </td>
                  </tr>
                }
                @for (line of lines; track $index; let idx = $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="line.itemId" (change)="onItemSelect(line)" class="form-control">
                        <option value="" disabled>-- Select Raw Material --</option>
                        @for (it of items; track it.id) {
                          <option [value]="it.id">{{ it.name }} (Stock: {{ it.currentStock }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.consumedQty"
                        min="0.001"
                        (input)="updateLineTotal(line)"
                        class="form-control text-right font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.unitRate"
                        min="0"
                        (input)="updateLineTotal(line)"
                        class="form-control text-right font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="line.scrapPercentage"
                        min="0"
                        max="100"
                        (input)="updateLineTotal(line)"
                        class="form-control text-right font-mono"
                      />
                    </td>
                    <td class="text-right font-mono font-bold">
                      ₹{{ line.totalAmount | number:'1.2-2' }}
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-icon text-danger" (click)="removeComponentLine(idx)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- TOTAL COST SUMMARY FOOTER -->
          <div class="cost-summary-box">
            <div class="cost-item">
              <span class="cost-label">Raw Materials:</span>
              <span class="cost-val">₹{{ rawMaterialTotal | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Direct Labor:</span>
              <span class="cost-val">₹{{ (formData.estimatedLaborCost || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Overheads:</span>
              <span class="cost-val">₹{{ (formData.estimatedOverheadCost || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item total-highlight">
              <span class="cost-label">Total Recipe Cost:</span>
              <span class="cost-val font-bold">₹{{ grandTotalCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item unit-highlight">
              <span class="cost-label">Cost per Assembled Unit:</span>
              <span class="cost-val font-bold font-mono">₹{{ (grandTotalCost / (formData.producedQty || 1)) | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedBom) {
        <!-- FULL PAGE VIEW BOM RECIPE -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>BOM Recipe: {{ selectedBom.name }}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-secondary" (click)="openEditPage(selectedBom)"><i class="pi pi-pencil"></i> Edit Recipe</button>
            <button class="btn-primary" onclick="window.print()"><i class="pi pi-print"></i> Print Recipe</button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">BOM Code</span>
              <span class="value font-mono font-bold">{{ selectedBom.bomNo }}</span>
            </div>
            <div class="info-block">
              <span class="label">Finished Product</span>
              <span class="value font-bold">{{ selectedBom.finishedItem?.name }}</span>
            </div>
            <div class="info-block">
              <span class="label">Output Batch Qty</span>
              <span class="value font-mono">{{ selectedBom.producedQty }} {{ selectedBom.finishedItem?.unit?.code || 'Units' }}</span>
            </div>
            <div class="info-block">
              <span class="label">Unit Cost</span>
              <span class="value font-mono font-bold" style="color: #047857;">
                ₹{{ (selectedBom.totalCost / (selectedBom.producedQty || 1)) | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <div class="section-title-bar" style="margin-top: 24px;">
            <span>Component Consumption Bill</span>
          </div>

          <table class="zeno-table" style="border: 1px solid var(--surface-200); border-radius: 8px;">
            <thead>
              <tr>
                <th>Component Name</th>
                <th class="text-right">Consumed Qty</th>
                <th class="text-right">Unit Rate ₹</th>
                <th class="text-right">Scrap %</th>
                <th class="text-right">Subtotal ₹</th>
              </tr>
            </thead>
            <tbody>
              @for (it of selectedBom.items; track it.id) {
                <tr>
                  <td class="font-bold">{{ it.item?.name }}</td>
                  <td class="text-right font-mono">{{ it.consumedQty }} {{ it.item?.unit?.code || '' }}</td>
                  <td class="text-right font-mono">₹{{ it.unitRate | number:'1.2-2' }}</td>
                  <td class="text-right font-mono">{{ it.scrapPercentage }}%</td>
                  <td class="text-right font-mono font-bold">₹{{ it.totalAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="cost-summary-box" style="margin-top: 20px;">
            <div class="cost-item">
              <span class="cost-label">Total Recipe Cost:</span>
              <span class="cost-val font-bold" style="color: #1e40af;">₹{{ selectedBom.totalCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Output Batch:</span>
              <span class="cost-val font-bold">{{ selectedBom.producedQty }} {{ selectedBom.finishedItem?.unit?.code || 'Units' }}</span>
            </div>
            <div class="cost-item unit-highlight">
              <span class="cost-label">Cost per Assembled Unit:</span>
              <span class="cost-val font-bold font-mono">₹{{ (selectedBom.totalCost / (selectedBom.producedQty || 1)) | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manufacturing-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: var(--radius-sm, 6px); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
    .btn-back:hover { background: var(--surface-200); color: var(--surface-900); }
    .form-page-card { padding: 24px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); }
    .toolbar-search { position: relative; flex: 1; max-width: 440px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }

    .badge-custom { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; background: #fff; }
    .form-control:focus { border-color: var(--primary-600); }

    .section-title-bar { display: flex; justify-content: space-between; align-items: center; margin: 20px 0 10px 0; font-weight: 700; color: var(--surface-800); font-size: 0.9375rem; border-bottom: 2px solid var(--surface-100); padding-bottom: 6px; }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; font-weight: 600; cursor: pointer; }
    .btn-outline { background: #fff; border: 1px solid var(--primary-600, #2563EB); color: var(--primary-600, #2563EB); }
    .btn-outline:hover { background: var(--primary-50, #eff6ff); }

    .lines-table-wrap { border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
    .lines-table td { padding: 8px 10px; }
    .lines-table .form-control { padding: 6px 8px; }

    .cost-summary-box { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .cost-item { display: flex; flex-direction: column; gap: 2px; }
    .cost-label { font-size: 0.75rem; color: var(--surface-500); text-transform: uppercase; font-weight: 600; }
    .cost-val { font-size: 1rem; color: var(--surface-800); }
    .total-highlight .cost-val { color: #1e40af; font-size: 1.15rem; }
    .unit-highlight .cost-val { color: #047857; font-size: 1.15rem; }

    .detail-card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: var(--surface-50); padding: 14px; border-radius: 8px; }
    .info-block { display: flex; flex-direction: column; gap: 3px; }
    .info-block .label { font-size: 0.75rem; color: var(--surface-500); text-transform: uppercase; font-weight: 600; }
    .info-block .value { font-size: 0.9375rem; color: var(--surface-900); }
    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class BomsComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  boms: any[] = [];
  filteredBoms: any[] = [];
  items: any[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  statusFilter = 'ALL';

  editingBom: any | null = null;
  selectedBom: any | null = null;
  errorMessage = '';

  formData = {
    name: '',
    bomNo: '',
    finishedItemId: '',
    producedQty: 1,
    estimatedLaborCost: 0,
    estimatedOverheadCost: 0,
    isActive: true,
  };

  lines: BomLine[] = [];

  constructor(
    private manufacturingService: ManufacturingService,
    private mastersService: MastersService,
    private tenantService: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  get uniqueFinishedProductsCount() {
    const ids = new Set(this.boms.map((b) => b.finishedItemId));
    return ids.size;
  }

  get averageCost() {
    if (this.boms.length === 0) return 0;
    const sum = this.boms.reduce((acc, b) => acc + (Number(b.totalCost) || 0), 0);
    return sum / this.boms.length;
  }

  get rawMaterialTotal(): number {
    return this.lines.reduce((acc, l) => acc + (Number(l.totalAmount) || 0), 0);
  }

  get grandTotalCost(): number {
    return (
      this.rawMaterialTotal +
      (Number(this.formData.estimatedLaborCost) || 0) +
      (Number(this.formData.estimatedOverheadCost) || 0)
    );
  }

  loadData() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!companyId) {
      this.loading = false;
      return;
    }

    this.mastersService.getItems(companyId).subscribe({
      next: (items) => {
        this.items = items || [];
        this.manufacturingService.getBoms(companyId).subscribe({
          next: (boms) => {
            this.boms = boms || [];
            this.filterBoms();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterBoms() {
    let result = [...this.boms];
    if (this.statusFilter === 'ACTIVE') {
      result = result.filter((b) => b.isActive);
    } else if (this.statusFilter === 'INACTIVE') {
      result = result.filter((b) => !b.isActive);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.bomNo?.toLowerCase().includes(q) ||
          b.finishedItem?.name?.toLowerCase().includes(q),
      );
    }
    this.filteredBoms = result;
  }

  exportBoms() {
    if (!this.filteredBoms || this.filteredBoms.length === 0) return;
    const headers = ['BOM Code', 'Recipe Name', 'Finished Product', 'Produced Qty', 'Components Count', 'Total Est Cost', 'Status'];
    const rows = this.filteredBoms.map((b) => [
      b.bomNo || '',
      b.name || '',
      b.finishedItem?.name || '',
      b.outputQty || 1,
      b.items?.length || 0,
      b.totalEstimatedCost || 0,
      b.isActive ? 'Active' : 'Inactive'
    ]);
    exportToCsv('BOM_Recipes', headers, rows);
    this.toast.success('BOM recipes exported successfully!', 'Export Complete');
  }

  addComponentLine() {
    this.lines.push({
      itemId: '',
      consumedQty: 1,
      unitRate: 0,
      scrapPercentage: 0,
      totalAmount: 0,
    });
  }

  removeComponentLine(idx: number) {
    this.lines.splice(idx, 1);
  }

  onItemSelect(line: BomLine) {
    const it = this.items.find((i) => i.id === line.itemId);
    if (it) {
      line.unitRate = Number(it.purchaseRate) || Number(it.saleRate) || 0;
      this.updateLineTotal(line);
    }
  }

  updateLineTotal(line: BomLine) {
    const qty = Number(line.consumedQty) || 0;
    const rate = Number(line.unitRate) || 0;
    const scrapPct = Number(line.scrapPercentage) || 0;
    const gross = qty * rate;
    line.totalAmount = gross + gross * (scrapPct / 100);
  }

  recalculateTotals() {
    // triggers getter update
  }

  openCreatePage() {
    this.editingBom = null;
    this.formData = {
      name: '',
      bomNo: '',
      finishedItemId: this.items.length > 0 ? this.items[0].id : '',
      producedQty: 1,
      estimatedLaborCost: 0,
      estimatedOverheadCost: 0,
      isActive: true,
    };
    this.lines = [];
    this.addComponentLine();
    this.errorMessage = '';
    this.viewMode = 'create';
  }

  openEditPage(bom: any) {
    this.editingBom = bom;
    this.formData = {
      name: bom.name,
      bomNo: bom.bomNo,
      finishedItemId: bom.finishedItemId,
      producedQty: Number(bom.producedQty) || 1,
      estimatedLaborCost: Number(bom.estimatedLaborCost) || 0,
      estimatedOverheadCost: Number(bom.estimatedOverheadCost) || 0,
      isActive: bom.isActive,
    };
    this.lines = (bom.items || []).map((it: any) => ({
      itemId: it.itemId,
      variantId: it.variantId,
      consumedQty: Number(it.consumedQty) || 1,
      unitRate: Number(it.unitRate) || 0,
      scrapPercentage: Number(it.scrapPercentage) || 0,
      totalAmount: Number(it.totalAmount) || 0,
      notes: it.notes,
    }));
    this.errorMessage = '';
    this.viewMode = 'create';
  }

  viewBomDetails(bom: any) {
    this.manufacturingService.getBomById(bom.id).subscribe({
      next: (res) => {
        this.selectedBom = res;
        this.viewMode = 'view';
      },
      error: () => {
        this.selectedBom = bom;
        this.viewMode = 'view';
      },
    });
  }

  backToList() {
    this.viewMode = 'list';
    this.editingBom = null;
    this.selectedBom = null;
    this.errorMessage = '';
  }

  saveBom() {
    if (!this.formData.finishedItemId) {
      this.errorMessage = 'Please select a finished product.';
      return;
    }
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please enter a recipe name.';
      return;
    }
    if (this.lines.length === 0 || !this.lines.some((l) => l.itemId)) {
      this.errorMessage = 'Please add at least one component raw material.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      companyId,
      items: this.lines.filter((l) => l.itemId),
    };

    if (this.editingBom) {
      this.manufacturingService.updateBom(this.editingBom.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.success(`BOM Recipe "${this.formData.name}" updated successfully!`, 'BOM Updated');
          this.backToList();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update BOM';
          this.toast.error(this.errorMessage, 'Update Failed');
        },
      });
    } else {
      this.manufacturingService.createBom(payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.success(`BOM Recipe "${this.formData.name}" created successfully!`, 'BOM Created');
          this.backToList();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create BOM';
          this.toast.error(this.errorMessage, 'Creation Failed');
        },
      });
    }
  }

  deleteBom(bom: any) {
    if (!confirm(`Are you sure you want to delete BOM "${bom.name}"?`)) {
      return;
    }

    this.manufacturingService.deleteBom(bom.id).subscribe({
      next: () => {
        this.toast.success(`BOM Recipe "${bom.name}" deleted successfully.`, 'BOM Deleted');
        this.loadData();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete BOM';
        this.toast.error(msg, 'Deletion Failed');
        alert(msg);
      },
    });
  }
}
