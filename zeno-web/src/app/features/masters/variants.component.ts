import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

interface VariantItem {
  id: string;
  name: string;
  sku?: string;
  itemId: string;
  item?: { id: string; name: string; sku?: string };
  attributes?: Record<string, string>;
  purchaseRate?: number;
  saleRate?: number;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-variants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="masters-page">
      <div class="page-header">
        <div>
          <h1>Variant</h1>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="pi pi-plus"></i> New Variant
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="pi pi-sliders-v"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Total Variants</span>
            <span class="kpi-value">{{ variants.length }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><i class="pi pi-box"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Parent Items Configured</span>
            <span class="kpi-value">{{ itemsWithVariantsCount }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><i class="pi pi-check-circle"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Active SKUs</span>
            <span class="kpi-value">{{ activeVariantsCount }}</span>
          </div>
        </div>
      </div>

      <!-- FILTER & TOOLBAR -->
      <div class="zeno-card">
        <div class="table-toolbar">
          <div class="toolbar-search">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search variant name or SKU..."
              [(ngModel)]="searchQuery"
              (input)="filterVariants()"
            />
          </div>
          <div class="toolbar-filters">
            <select [(ngModel)]="itemFilter" (change)="filterVariants()" class="form-select">
              <option value="ALL">All Items</option>
              @for (it of items; track it.id) {
                <option [value]="it.id">{{ it.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- TABLE -->
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Variant Name</th>
              <th>Parent Item</th>
              <th>SKU</th>
              <th>Attributes</th>
              <th class="text-right">Purchase Rate ₹</th>
              <th class="text-right">Sale Rate ₹</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  <i class="pi pi-spin pi-spinner"></i> Loading item variants...
                </td>
              </tr>
            } @else if (filteredVariants.length === 0) {
              <tr>
                <td colspan="8" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No variants found. Click "New Item Variant" to configure variants.
                </td>
              </tr>
            }
            @for (v of filteredVariants; track v.id) {
              <tr>
                <td>
                  <div class="variant-name-cell">
                    <i class="pi pi-sliders-v text-primary"></i>
                    <strong>{{ v.name }}</strong>
                  </div>
                </td>
                <td>
                  <span class="font-bold">{{ v.item?.name || '—' }}</span>
                </td>
                <td class="font-mono">{{ v.sku || '—' }}</td>
                <td>
                  <div class="attr-badges">
                    @for (attr of getAttributeList(v.attributes); track attr.key) {
                      <span class="attr-pill">
                        <strong>{{ attr.key }}:</strong> {{ attr.val }}
                      </span>
                    }
                    @if (!v.attributes || getAttributeList(v.attributes).length === 0) {
                      <span style="color: var(--surface-400);">—</span>
                    }
                  </div>
                </td>
                <td class="text-right font-mono">
                  {{ v.purchaseRate ? ('₹' + v.purchaseRate) : '—' }}
                </td>
                <td class="text-right font-mono font-bold" style="color: #1e40af;">
                  {{ v.saleRate ? ('₹' + v.saleRate) : '—' }}
                </td>
                <td>
                  @if (v.isActive) {
                    <span class="badge-pill badge-cleared"><i class="pi pi-check"></i> Active</span>
                  } @else {
                    <span class="badge-pill badge-cancelled">Inactive</span>
                  }
                </td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" (click)="openEditModal(v)" title="Edit Variant">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="btn-icon text-danger" (click)="deleteVariant(v)" title="Delete Variant">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- CREATE / EDIT MODAL -->
      @if (showModal) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingVariant ? 'Edit Item Variant' : 'New Item Variant' }}</h3>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>

            <div class="modal-body">
              @if (errorMessage) {
                <div class="alert alert-error">
                  <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
                </div>
              }

              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="required">Parent Product</label>
                  <select [(ngModel)]="formData.itemId" class="form-control">
                    <option value="" disabled>-- Select Product --</option>
                    @for (it of items; track it.id) {
                      <option [value]="it.id">{{ it.name }} ({{ it.sku || 'No SKU' }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="required">Variant Name</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    placeholder="e.g. XL - Black, 128GB - Blue"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Variant SKU Code</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.sku"
                    placeholder="e.g. TSH-BLK-XL"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Purchase Rate (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.purchaseRate"
                    placeholder="0.00"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Sale Rate (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.saleRate"
                    placeholder="0.00"
                    class="form-control"
                  />
                </div>

                <!-- DYNAMIC ATTRIBUTES (Key-Value) -->
                <div class="form-group full-width" style="margin-top: 8px;">
                  <div class="attr-header">
                    <label>Variant Attributes (Size, Color, Material, etc.)</label>
                    <button type="button" class="btn-sm-outline" (click)="addAttributeRow()">
                      <i class="pi pi-plus"></i> Add Attribute
                    </button>
                  </div>

                  @for (row of attributeRows; track $index; let idx = $index) {
                    <div class="attr-row">
                      <input
                        type="text"
                        [(ngModel)]="row.key"
                        placeholder="Key (e.g. Size)"
                        class="form-control"
                      />
                      <input
                        type="text"
                        [(ngModel)]="row.val"
                        placeholder="Value (e.g. XL)"
                        class="form-control"
                      />
                      <button type="button" class="btn-icon text-danger" (click)="removeAttributeRow(idx)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  }
                  @if (attributeRows.length === 0) {
                    <div class="attr-empty">No custom attributes added. Click "+ Add Attribute".</div>
                  }
                </div>

                <div class="form-group full-width" style="margin-top: 6px;">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="formData.isActive" />
                    Variant is Active
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="saveVariant()" [disabled]="saving">
                @if (saving) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingVariant ? 'Update Variant' : 'Create Variant' }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .masters-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .header-actions { display: flex; gap: 10px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); gap: 16px; }
    .toolbar-search { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }
    .form-select { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; background: #fff; }

    .variant-name-cell { display: flex; align-items: center; gap: 10px; }
    .text-primary { color: #2563eb; }

    .attr-badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .attr-pill { background: #f1f5f9; color: #334155; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: var(--primary-600); }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; cursor: pointer; color: var(--surface-800); }

    .attr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .btn-sm-outline { background: #fff; border: 1px solid var(--surface-300); border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; cursor: pointer; font-weight: 600; color: var(--primary-600); }
    .btn-sm-outline:hover { background: var(--surface-50); }
    .attr-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px; }
    .attr-empty { font-size: 0.8125rem; color: var(--surface-500); padding: 8px; background: var(--surface-50); border-radius: 6px; text-align: center; }

    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class VariantsComponent implements OnInit {
  variants: VariantItem[] = [];
  filteredVariants: VariantItem[] = [];
  items: any[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  itemFilter = 'ALL';

  showModal = false;
  editingVariant: VariantItem | null = null;
  errorMessage = '';

  formData: {
    name: string;
    sku: string;
    itemId: string;
    purchaseRate: number | null;
    saleRate: number | null;
    isActive: boolean;
  } = {
    name: '',
    sku: '',
    itemId: '',
    purchaseRate: null,
    saleRate: null,
    isActive: true,
  };

  attributeRows: { key: string; val: string }[] = [];

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  get itemsWithVariantsCount() {
    const itemIds = new Set(this.variants.map((v) => v.itemId));
    return itemIds.size;
  }

  get activeVariantsCount() {
    return this.variants.filter((v) => v.isActive).length;
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
        this.mastersService.getVariants(companyId).subscribe({
          next: (vars) => {
            this.variants = vars || [];
            this.filterVariants();
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

  filterVariants() {
    let result = [...this.variants];

    if (this.itemFilter !== 'ALL') {
      result = result.filter((v) => v.itemId === this.itemFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.sku && v.sku.toLowerCase().includes(q)) ||
          (v.item && v.item.name.toLowerCase().includes(q)),
      );
    }

    this.filteredVariants = result;
  }

  getAttributeList(attrs?: Record<string, string>): { key: string; val: string }[] {
    if (!attrs) return [];
    return Object.entries(attrs).map(([key, val]) => ({ key, val }));
  }

  addAttributeRow() {
    this.attributeRows.push({ key: '', val: '' });
  }

  removeAttributeRow(idx: number) {
    this.attributeRows.splice(idx, 1);
  }

  openCreateModal() {
    this.editingVariant = null;
    this.formData = {
      name: '',
      sku: '',
      itemId: this.items.length > 0 ? this.items[0].id : '',
      purchaseRate: null,
      saleRate: null,
      isActive: true,
    };
    this.attributeRows = [{ key: 'Size', val: '' }, { key: 'Color', val: '' }];
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(v: VariantItem) {
    this.editingVariant = v;
    this.formData = {
      name: v.name,
      sku: v.sku || '',
      itemId: v.itemId,
      purchaseRate: v.purchaseRate || null,
      saleRate: v.saleRate || null,
      isActive: v.isActive,
    };

    if (v.attributes) {
      this.attributeRows = Object.entries(v.attributes).map(([key, val]) => ({ key, val }));
    } else {
      this.attributeRows = [];
    }

    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingVariant = null;
    this.errorMessage = '';
  }

  saveVariant() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please enter a variant name.';
      return;
    }
    if (!this.formData.itemId) {
      this.errorMessage = 'Please select a parent item.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const attributesMap: Record<string, string> = {};
    for (const r of this.attributeRows) {
      if (r.key.trim() && r.val.trim()) {
        attributesMap[r.key.trim()] = r.val.trim();
      }
    }

    const payload = {
      ...this.formData,
      attributes: Object.keys(attributesMap).length > 0 ? attributesMap : null,
    };

    if (this.editingVariant) {
      this.mastersService.updateVariant(this.editingVariant.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update variant';
        },
      });
    } else {
      this.mastersService.createVariant(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create variant';
        },
      });
    }
  }

  deleteVariant(v: VariantItem) {
    if (!confirm(`Are you sure you want to delete variant "${v.name}"?`)) {
      return;
    }

    this.mastersService.deleteVariant(v.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete variant');
      },
    });
  }
}
