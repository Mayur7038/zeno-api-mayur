import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ZENO_UI_COMPONENTS } from '../../shared/ui';

interface StockCategoryItem {
  id: string;
  name: string;
  itemGroupId: string;
  itemGroup?: { id: string; name: string; gstRate?: number };
  gstRate: number;
  items?: any[];
  createdAt: string;
}

@Component({
  selector: 'app-stock-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ZENO_UI_COMPONENTS],
  template: `
    <div class="p2p-page">
      <zeno-page-header title="Stock Category" subtitle="Organize inventory items into sub-categories and brand lines.">
        <div actions>
          <zeno-button variant="primary" icon="pi pi-plus" (btnClick)="openCreateModal()">
            New Stock Category
          </zeno-button>
        </div>
      </zeno-page-header>

      <!-- TABLE & LIST CONTAINER -->
      <zeno-table
        [loading]="loading"
        [empty]="filteredCategories.length === 0"
        loadingMessage="Loading stock categories..."
        emptyMessage="No stock categories found. Click 'New Stock Category' to create one."
      >
        <div toolbar-left>
          <zeno-search
            [(ngModel)]="searchQuery"
            (searchChange)="filterCategories()"
          ></zeno-search>
        </div>
        <div toolbar-right>
          <div style="min-width: 220px;">
            <zeno-select
              [(ngModel)]="groupFilter"
              [options]="groupFilterOptions"
              (selectChange)="filterCategories()"
            ></zeno-select>
          </div>
        </div>

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
            @for (c of filteredCategories; track c.id) {
              <tr>
                <td>
                  <div class="category-name-cell">
                    <i class="pi pi-tag text-primary"></i>
                    <strong>{{ c.name }}</strong>
                  </div>
                </td>
                <td>
                  <zeno-badge type="primary" icon="pi pi-folder">
                    {{ c.itemGroup?.name || 'Unassigned' }}
                  </zeno-badge>
                </td>
                <td class="text-right font-mono font-bold" [style.color]="c.gstRate > 0 ? '#1e40af' : '#64748b'">
                  {{ getCategoryGstDisplay(c) }}
                </td>
                <td class="text-right actions-cell">
                  <zeno-button variant="icon" icon="pi pi-pencil" title="Edit Category" (btnClick)="openEditModal(c)"></zeno-button>
                  <zeno-button variant="icon" icon="pi pi-trash" title="Delete Category" (btnClick)="deleteCategory(c)" class="text-danger"></zeno-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </zeno-table>

      <!-- CREATE / EDIT MODAL -->
      <zeno-modal
        [isOpen]="showModal"
        [title]="editingCategory ? 'Edit Stock Category' : 'New Stock Category'"
        size="md"
        (close)="closeModal()"
      >
        @if (errorMessage) {
          <div class="alert alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <div class="zeno-form-grid-2">
          <zeno-form-group label="Parent Stock Group" [required]="true" [span]="2">
            <zeno-select
              [(ngModel)]="formData.itemGroupId"
              [options]="stockGroupOptions"
              [allowEmpty]="true"
              emptyLabel="-- Select Stock Group --"
            ></zeno-select>
          </zeno-form-group>

          <zeno-form-group label="Category Name" [required]="true" [span]="2">
            <zeno-input [(ngModel)]="formData.name"></zeno-input>
          </zeno-form-group>

          @if (isGstAtCategoryLevel) {
            <zeno-form-group label="Category-Level GST Rate (%)" [required]="true" [span]="2">
              <zeno-select
                [(ngModel)]="formData.gstRate"
                [options]="gstRateOptions"
              ></zeno-select>
            </zeno-form-group>
          } @else {
            <zeno-form-group label="GST Active Level" [span]="2">
              <div class="gst-managed-badge">
                <i class="pi pi-info-circle text-primary"></i>
                <span>{{ getGstLevelLabel() }}</span>
              </div>
            </zeno-form-group>
          }
        </div>

        <div footer>
          <zeno-button variant="secondary" (btnClick)="closeModal()">Cancel</zeno-button>
          <zeno-button variant="primary" icon="pi pi-check" [loading]="saving" (btnClick)="saveCategory()">
            {{ editingCategory ? 'Update Category' : 'Create Category' }}
          </zeno-button>
        </div>
      </zeno-modal>
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
    .gst-managed-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); min-height: 38px; }
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

  get groupFilterOptions() {
    return [
      { label: 'All Stock Groups', value: 'ALL' },
      ...this.stockGroups.map((sg) => ({ label: sg.name, value: sg.id })),
    ];
  }

  get stockGroupOptions() {
    return this.stockGroups.map((sg) => ({
      label: `${sg.name} (GST ${sg.gstRate || 0}%)`,
      value: sg.id,
    }));
  }

  readonly gstRateOptions = [
    { label: '0% (Exempt / Nil)', value: 0 },
    { label: '5%', value: 5 },
    { label: '12%', value: 12 },
    { label: '18%', value: 18 },
    { label: '28%', value: 28 },
  ];

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  get gstActiveLevel(): string {
    return this.tenantService.getGstActiveLevel();
  }

  get isGstAtCategoryLevel(): boolean {
    return this.gstActiveLevel === 'ITEM_CATEGORY';
  }

  getGstLevelLabel(): string {
    switch (this.gstActiveLevel) {
      case 'COMPANY':
        return `Company Level (${this.tenantService.getCompanyFlatGstRate()}% Global Flat Rate)`;
      case 'ITEM_GROUP':
        return `Inherited from Parent Stock Group (${this.getParentGroupGst()}%)`;
      case 'ITEM':
        return 'Item Master Level';
      default:
        return 'Item Category Level';
    }
  }

  getParentGroupGst(): number {
    const group = this.stockGroups.find((g) => g.id === this.formData.itemGroupId);
    return group?.gstRate || 0;
  }

  getCategoryGstDisplay(c: StockCategoryItem): string {
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      return `${c.gstRate || 0}%`;
    }
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      const grpRate = c.itemGroup?.gstRate ?? this.stockGroups.find((g) => g.id === c.itemGroupId)?.gstRate ?? 0;
      return `${grpRate}% (Group)`;
    }
    if (this.gstActiveLevel === 'COMPANY') {
      return `${this.tenantService.getCompanyFlatGstRate()}% (Company)`;
    }
    return 'At Item Master';
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
