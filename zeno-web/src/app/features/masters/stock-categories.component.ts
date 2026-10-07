import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

interface StockCategoryItem {
  id: string;
  name: string;
  itemGroupId: string;
  itemGroup?: { id: string; name: string };
  gstRate: number;
  items?: any[];
  createdAt: string;
}

@Component({
  selector: 'app-stock-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="masters-page">
      <div class="page-header">
        <div>
          <h1>Stock Category</h1>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="pi pi-plus"></i> New Stock Category
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
              placeholder="Search category name..."
              [(ngModel)]="searchQuery"
              (input)="filterCategories()"
            />
          </div>
          <div class="toolbar-filters">
            <select [(ngModel)]="groupFilter" (change)="filterCategories()" class="form-select">
              <option value="ALL">All Stock Groups</option>
              @for (sg of stockGroups; track sg.id) {
                <option [value]="sg.id">{{ sg.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- TABLE -->
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Parent Stock Group</th>
              <th class="text-right">GST Rate</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  <i class="pi pi-spin pi-spinner"></i> Loading stock categories...
                </td>
              </tr>
            } @else if (filteredCategories.length === 0) {
              <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No stock categories found. Click "New Stock Category" to create one.
                </td>
              </tr>
            }
            @for (c of filteredCategories; track c.id) {
              <tr>
                <td>
                  <div class="category-name-cell">
                    <i class="pi pi-tag text-primary"></i>
                    <strong>{{ c.name }}</strong>
                  </div>
                </td>
                <td>
                  <span class="badge-pill badge-partial">
                    <i class="pi pi-folder"></i> {{ c.itemGroup?.name || 'Unassigned' }}
                  </span>
                </td>
                <td class="text-right font-mono font-bold" [style.color]="c.gstRate > 0 ? '#1e40af' : '#64748b'">
                  {{ c.gstRate }}%
                </td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" (click)="openEditModal(c)" title="Edit Category">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="btn-icon text-danger" (click)="deleteCategory(c)" title="Delete Category">
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
              <h3>{{ editingCategory ? 'Edit Stock Category' : 'New Stock Category' }}</h3>
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
                  <label class="required">Parent Stock Group</label>
                  <select [(ngModel)]="formData.itemGroupId" class="form-control">
                    <option value="" disabled>-- Select Stock Group --</option>
                    @for (sg of stockGroups; track sg.id) {
                      <option [value]="sg.id">{{ sg.name }} (GST {{ sg.gstRate }}%)</option>
                    }
                  </select>
                </div>

                <div class="form-group full-width">
                  <label class="required">Category Name</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    placeholder="e.g. Microcontrollers, Corrugated Boxes, Alloy Sheets"
                    class="form-control"
                  />
                </div>

                <div class="form-group full-width">
                  <label>Category-Level GST Rate (%)</label>
                  <select [(ngModel)]="formData.gstRate" class="form-control">
                    <option [ngValue]="0">0% (Exempt / Nil)</option>
                    <option [ngValue]="5">5%</option>
                    <option [ngValue]="12">12%</option>
                    <option [ngValue]="18">18%</option>
                    <option [ngValue]="28">28%</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="saveCategory()" [disabled]="saving">
                @if (saving) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingCategory ? 'Update Category' : 'Create Category' }}
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

    .category-name-cell { display: flex; align-items: center; gap: 10px; }
    .text-primary { color: #2563eb; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: var(--primary-600); }
    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class StockCategoriesComponent implements OnInit {
  categories: StockCategoryItem[] = [];
  filteredCategories: StockCategoryItem[] = [];
  stockGroups: any[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  groupFilter = 'ALL';

  showModal = false;
  editingCategory: StockCategoryItem | null = null;
  errorMessage = '';

  formData = {
    name: '',
    itemGroupId: '',
    gstRate: 18,
  };

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  get totalItemsClassified() {
    return this.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0);
  }

  loadData() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!companyId) {
      this.loading = false;
      return;
    }

    this.mastersService.getItemGroups(companyId).subscribe({
      next: (groups) => {
        this.stockGroups = groups || [];
        this.mastersService.getItemCategories(companyId).subscribe({
          next: (cats) => {
            this.categories = cats || [];
            this.filterCategories();
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

  filterCategories() {
    let result = [...this.categories];

    if (this.groupFilter !== 'ALL') {
      result = result.filter((c) => c.itemGroupId === this.groupFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.itemGroup && c.itemGroup.name.toLowerCase().includes(q)),
      );
    }

    this.filteredCategories = result;
  }

  openCreateModal() {
    this.editingCategory = null;
    this.formData = {
      name: '',
      itemGroupId: this.stockGroups.length > 0 ? this.stockGroups[0].id : '',
      gstRate: 18,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(cat: StockCategoryItem) {
    this.editingCategory = cat;
    this.formData = {
      name: cat.name,
      itemGroupId: cat.itemGroupId,
      gstRate: Number(cat.gstRate) || 0,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingCategory = null;
    this.errorMessage = '';
  }

  saveCategory() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please enter a category name.';
      return;
    }
    if (!this.formData.itemGroupId) {
      this.errorMessage = 'Please select a parent stock group.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      companyId,
    };

    if (this.editingCategory) {
      this.mastersService.updateItemCategory(this.editingCategory.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update stock category';
        },
      });
    } else {
      this.mastersService.createItemCategory(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create stock category';
        },
      });
    }
  }

  deleteCategory(cat: StockCategoryItem) {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    this.mastersService.deleteItemCategory(cat.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete stock category');
      },
    });
  }
}
