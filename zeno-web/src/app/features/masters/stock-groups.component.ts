import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ZENO_UI_COMPONENTS } from '../../shared/ui';

interface StockGroupItem {
  id: string;
  name: string;
  hsnSac?: string;
  gstRate: number;
  categories?: any[];
  items?: any[];
  createdAt: string;
}

@Component({
  selector: 'app-stock-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ZENO_UI_COMPONENTS],
  template: `
    <div class="zeno-page-container">
      <zeno-page-header title="Stock Group">
        <div actions>
          <zeno-button variant="primary" icon="pi pi-plus" (btnClick)="openCreateModal()">
            New Stock Group
          </zeno-button>
        </div>
      </zeno-page-header>

      <!-- TABLE & LIST CONTAINER -->
      <zeno-table
        [loading]="loading"
        [empty]="filteredGroups.length === 0"
        loadingMessage="Loading stock groups..."
        emptyMessage="No stock groups found. Click 'New Stock Group' to create one."
      >
        <div toolbar-left>
          <zeno-search
            [(ngModel)]="searchQuery"
            (searchChange)="filterGroups()"
          ></zeno-search>
        </div>

        <table class="zeno-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>HSN / SAC</th>
              <th class="text-right">GST Rate</th>
              <th class="text-center">Categories Linked</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (g of filteredGroups; track g.id) {
              <tr>
                <td>
                  <div class="group-name-cell">
                    <i class="pi pi-folder text-primary"></i>
                    <strong>{{ g.name }}</strong>
                  </div>
                </td>
                <td class="font-mono">{{ g.hsnSac || '—' }}</td>
                <td class="text-right font-mono font-bold" [style.color]="g.gstRate > 0 ? '#1e40af' : '#64748b'">
                  {{ getGroupGstDisplay(g) }}
                </td>
                <td class="text-center">
                  <zeno-badge type="primary">
                    {{ g.categories?.length || 0 }} categories
                  </zeno-badge>
                </td>
                <td class="text-right actions-cell">
                  <zeno-button variant="icon" icon="pi pi-pencil" title="Edit Stock Group" (btnClick)="openEditModal(g)"></zeno-button>
                  <zeno-button variant="icon" icon="pi pi-trash" title="Delete Stock Group" (btnClick)="deleteGroup(g)" class="text-danger"></zeno-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </zeno-table>

      <!-- CREATE / EDIT MODAL -->
      <zeno-modal
        [isOpen]="showModal"
        [title]="editingGroup ? 'Edit Stock Group' : 'New Stock Group'"
        size="md"
        (close)="closeModal()"
      >
        @if (errorMessage) {
          <div class="alert alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <div class="zeno-form-grid-2">
          <zeno-form-group label="Group Name" [required]="true" [span]="2">
            <zeno-input [(ngModel)]="formData.name"></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="HSN / SAC Code">
            <zeno-input [(ngModel)]="formData.hsnSac"></zeno-input>
          </zeno-form-group>

          @if (isGstAtGroupLevel) {
            <zeno-form-group label="Group GST Rate (%)" [required]="true">
              <zeno-select
                [(ngModel)]="formData.gstRate"
                [options]="gstRateOptions"
              ></zeno-select>
            </zeno-form-group>
          } @else {
            <zeno-form-group label="GST Active Level">
              <div class="gst-managed-badge">
                <i class="pi pi-info-circle text-primary"></i>
                <span>{{ getGstLevelLabel() }}</span>
              </div>
            </zeno-form-group>
          }
        </div>

        <div footer>
          <zeno-button variant="secondary" (btnClick)="closeModal()">Cancel</zeno-button>
          <zeno-button variant="primary" icon="pi pi-check" [loading]="saving" (btnClick)="saveGroup()">
            {{ editingGroup ? 'Update Group' : 'Create Group' }}
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

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); }
    .toolbar-search { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }

    .group-name-cell { display: flex; align-items: center; gap: 10px; }
    .text-primary { color: #2563eb; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
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
export class StockGroupsComponent implements OnInit {
  groups: StockGroupItem[] = [];
  filteredGroups: StockGroupItem[] = [];
  loading = false;
  saving = false;
  searchQuery = '';

  showModal = false;
  editingGroup: StockGroupItem | null = null;
  errorMessage = '';

  formData = {
    name: '',
    hsnSac: '',
    gstRate: 18,
  };

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
    this.loadGroups();
  }

  get gstActiveLevel(): string {
    return this.tenantService.getGstActiveLevel();
  }

  get isGstAtGroupLevel(): boolean {
    return this.gstActiveLevel === 'ITEM_GROUP';
  }

  getGstLevelLabel(): string {
    switch (this.gstActiveLevel) {
      case 'COMPANY':
        return `Company Level (${this.tenantService.getCompanyFlatGstRate()}% Global Flat Rate)`;
      case 'ITEM_CATEGORY':
        return 'Item Category Level';
      case 'ITEM':
        return 'Item Master Level';
      default:
        return 'Stock Group Level';
    }
  }

  getGroupGstDisplay(g: StockGroupItem): string {
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      return `${g.gstRate || 0}%`;
    }
    if (this.gstActiveLevel === 'COMPANY') {
      return `${this.tenantService.getCompanyFlatGstRate()}% (Company)`;
    }
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      return 'At Category';
    }
    return 'At Item Master';
  }

  get taxedGroupsCount() {
    return this.groups.filter((g) => Number(g.gstRate) > 0).length;
  }

  get totalSubCategories() {
    return this.groups.reduce((acc, g) => acc + (g.categories?.length || 0), 0);
  }

  loadGroups() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!companyId) {
      this.loading = false;
      return;
    }

    this.mastersService.getItemGroups(companyId).subscribe({
      next: (res) => {
        this.groups = res || [];
        this.filterGroups();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterGroups() {
    let result = [...this.groups];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.hsnSac && g.hsnSac.toLowerCase().includes(q)),
      );
    }
    this.filteredGroups = result;
  }

  openCreateModal() {
    this.editingGroup = null;
    this.formData = {
      name: '',
      hsnSac: '',
      gstRate: 18,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(group: StockGroupItem) {
    this.editingGroup = group;
    this.formData = {
      name: group.name,
      hsnSac: group.hsnSac || '',
      gstRate: Number(group.gstRate) || 0,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingGroup = null;
    this.errorMessage = '';
  }

  saveGroup() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please enter a stock group name.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      companyId,
    };

    if (this.editingGroup) {
      this.mastersService.updateItemGroup(this.editingGroup.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadGroups();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update stock group';
        },
      });
    } else {
      this.mastersService.createItemGroup(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadGroups();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create stock group';
        },
      });
    }
  }

  deleteGroup(group: StockGroupItem) {
    if (!confirm(`Are you sure you want to delete stock group "${group.name}"?`)) {
      return;
    }

    this.mastersService.deleteItemGroup(group.id).subscribe({
      next: () => {
        this.loadGroups();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete stock group');
      },
    });
  }
}
