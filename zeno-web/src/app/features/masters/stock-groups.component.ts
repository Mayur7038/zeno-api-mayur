import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ZENO_UI_COMPONENTS } from '../../shared/ui';

interface StockGroupItem {
  id: string;
  name: string;
  code?: string;
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
    <div class="p2p-page">
      <zeno-page-header title="Stock Group" subtitle="Manage item categories, HSN/SAC codes, and default GST tax classifications.">
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
              <th>Group Code</th>
              @if (isGstAtGroupLevel) {
                <th>HSN / SAC</th>
                <th class="text-right">GST Rate</th>
              }
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
                <td class="font-mono text-secondary">{{ g.code || '—' }}</td>
                @if (isGstAtGroupLevel) {
                  <td class="font-mono">{{ g.hsnSac || '—' }}</td>
                  <td class="text-right font-mono font-bold" [style.color]="g.gstRate > 0 ? '#1e40af' : '#64748b'">
                    {{ getGroupGstDisplay(g) }}
                  </td>
                }
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
          <zeno-form-group label="Group Name" [required]="true">
            <zeno-input [(ngModel)]="formData.name" placeholder="e.g. Raw Materials"></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="Group Code">
            <zeno-input [(ngModel)]="formData.code" placeholder="e.g. GRP-001"></zeno-input>
          </zeno-form-group>

          @if (isGstAtGroupLevel) {
            <zeno-form-group label="HSN / SAC Code">
              <zeno-input [(ngModel)]="formData.hsnSac" placeholder="e.g. 8471"></zeno-input>
            </zeno-form-group>

            <zeno-form-group label="Group GST Rate (%)" [required]="true">
              <zeno-select
                [(ngModel)]="formData.gstRate"
                [options]="gstRateOptions"
              ></zeno-select>
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
  styleUrl: './stock-groups.component.scss',
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
    code: '',
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
          (g.code && g.code.toLowerCase().includes(q)) ||
          (g.hsnSac && g.hsnSac.toLowerCase().includes(q)),
      );
    }
    this.filteredGroups = result;
  }

  openCreateModal() {
    this.editingGroup = null;
    this.formData = {
      name: '',
      code: '',
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
      code: group.code || '',
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
