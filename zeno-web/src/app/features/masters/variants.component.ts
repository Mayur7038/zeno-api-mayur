import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';
import { ZENO_UI_COMPONENTS } from '../../shared/ui';

export interface VariantDefinition {
  id: string;
  name: string;
  code: string;
  type: 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'DATE';
  options: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-variants',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ZENO_UI_COMPONENTS],
  template: `
    <div class="p2p-page">
      <zeno-page-header title="Variant Master" subtitle="Manage item variant definitions, attributes, and options (Size, Color, Material).">
        <div actions>
          <zeno-button variant="primary" icon="pi pi-plus" (btnClick)="openCreateModal()">
            New Variant
          </zeno-button>
        </div>
      </zeno-page-header>

      <!-- TABLE & LIST CONTAINER -->
      <zeno-table
        [loading]="loading"
        [empty]="filteredVariants.length === 0"
        loadingMessage="Loading variant master..."
        emptyMessage="No variants defined yet. Click 'New Variant' to configure variant dimensions."
      >
        <div toolbar-left>
          <zeno-search
            [(ngModel)]="searchQuery"
            (searchChange)="filterVariants()"
          ></zeno-search>
        </div>
        <div toolbar-right class="toolbar-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="min-width: 140px;">
            <zeno-select
              [(ngModel)]="typeFilter"
              [options]="typeFilterOptions"
              (selectChange)="filterVariants()"
            ></zeno-select>
          </div>
          <div style="min-width: 130px;">
            <zeno-select
              [(ngModel)]="statusFilter"
              [options]="statusFilterOptions"
              (selectChange)="filterVariants()"
            ></zeno-select>
          </div>
          <zeno-button
            variant="secondary"
            icon="pi pi-download"
            [disabled]="filteredVariants.length === 0"
            (btnClick)="exportVariants()"
            title="Export Variants"
          >
            Export
          </zeno-button>
        </div>

        <table class="zeno-table">
          <thead>
            <tr>
              <th>Variant Name</th>
              <th>Data Type</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v of filteredVariants; track v.id) {
              <tr>
                <td>
                  <div class="variant-name-cell">
                    <span class="type-icon-box" [ngClass]="v.type.toLowerCase()">
                      <i [class]="getTypeIcon(v.type)"></i>
                    </span>
                    <div>
                      <strong style="color: var(--surface-900); font-size: 0.9375rem;">{{ v.name }}</strong>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="type-badge" [ngClass]="v.type.toLowerCase()">
                    {{ formatTypeName(v.type) }}
                  </span>
                </td>
                <td>
                  @if (v.isActive) {
                    <zeno-badge type="success" icon="pi pi-check">Active</zeno-badge>
                  } @else {
                    <zeno-badge type="danger">Inactive</zeno-badge>
                  }
                </td>
                <td class="text-right actions-cell">
                  <zeno-button variant="icon" icon="pi pi-pencil" title="Edit Variant" (btnClick)="openEditModal(v)"></zeno-button>
                  <zeno-button variant="icon" icon="pi pi-trash" title="Delete Variant" (btnClick)="deleteVariant(v)" class="text-danger"></zeno-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </zeno-table>

      <!-- CREATE / EDIT MODAL -->
      <zeno-modal
        [isOpen]="showModal"
        [title]="editingVariant ? 'Edit Variant Master' : 'Create Variant Master'"
        size="md"
        (close)="closeModal()"
      >
        @if (errorMessage) {
          <div class="alert alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <div class="zeno-form-grid-2">
          <zeno-form-group label="Variant Name" [required]="true" [span]="2">
            <zeno-input
              [(ngModel)]="formData.name"
              (inputChange)="onNameChanged()"
            ></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="Variant Type" [required]="true" [span]="2">
            <zeno-select
              [(ngModel)]="formData.type"
              [options]="typeOptions"
              (selectChange)="onTypeChanged()"
            ></zeno-select>
          </zeno-form-group>

          <!-- DROPDOWN FIXED VALUES CONFIGURATION -->
          @if (formData.type === 'DROPDOWN') {
            <div class="form-group full-width dropdown-builder-box" style="grid-column: 1 / -1;">
              <div class="builder-header">
                <div>
                  <label class="required" style="margin: 0; font-weight: 700;">Fixed Dropdown Values</label>
                </div>
              </div>

              <!-- Input to add new value -->
              <div class="option-input-row" style="display: flex; gap: 8px; margin-top: 8px;">
                <zeno-input
                  [(ngModel)]="newOptionValue"
                  (keydown.enter)="$event.preventDefault(); addOptionValue()"
                ></zeno-input>
                <zeno-button variant="primary" icon="pi pi-plus" [disabled]="!newOptionValue.trim()" (btnClick)="addOptionValue()">
                  Add Value
                </zeno-button>
              </div>

              <!-- Options list chips -->
              <div class="chips-container" style="margin-top: 12px;">
                @for (opt of formData.options; track $index; let idx = $index) {
                  <div class="chip-item">
                    <span>{{ opt }}</span>
                    <button type="button" class="chip-remove" (click)="removeOptionValue(idx)" title="Remove value">
                      &times;
                    </button>
                  </div>
                }
                @if (formData.options.length === 0) {
                  <div class="chips-empty">
                    No values added yet. Type a value above to configure options for this dropdown.
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div footer>
          <zeno-button variant="secondary" (btnClick)="closeModal()">Cancel</zeno-button>
          <zeno-button
            variant="primary"
            icon="pi pi-check"
            [loading]="saving"
            [disabled]="saving || !formData.name"
            (btnClick)="saveVariant()"
          >
            {{ editingVariant ? 'Update Variant' : 'Create Variant' }}
          </zeno-button>
        </div>
      </zeno-modal>
    </div>
  `,
  styleUrl: './variants.component.scss',
})
export class VariantsComponent implements OnInit {
  variants: VariantDefinition[] = [];
  filteredVariants: VariantDefinition[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  typeFilter = 'ALL';
  statusFilter = 'ALL';
  showModal = false;
  editingVariant: VariantDefinition | null = null;
  errorMessage = '';

  readonly typeFilterOptions = [
    { label: 'All Types', value: 'ALL' },
    { label: 'Dropdown', value: 'DROPDOWN' },
    { label: 'Text', value: 'TEXT' },
    { label: 'Number', value: 'NUMBER' },
    { label: 'Date', value: 'DATE' },
  ];

  readonly statusFilterOptions = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  readonly typeOptions = [
    { label: 'Dropdown', value: 'DROPDOWN' },
    { label: 'Text', value: 'TEXT' },
    { label: 'Number', value: 'NUMBER' },
    { label: 'Date', value: 'DATE' },
  ];

  formData: {
    name: string;
    code: string;
    type: 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'DATE';
    options: string[];
    isActive: boolean;
  } = {
    name: '',
    code: '',
    type: 'DROPDOWN',
    options: [],
    isActive: true,
  };

  newOptionValue = '';

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.tenantService.loadHierarchy().subscribe({
      next: () => {
        this.loadVariants();
      },
    });
  }

  loadVariants() {
    const compId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.loading = true;
    this.mastersService.getVariantDefinitions(compId || undefined).subscribe({
      next: (res) => {
        this.variants = Array.isArray(res) ? res : [];
        this.filterVariants();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterVariants() {
    let result = [...this.variants];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.code?.toLowerCase().includes(q) ||
          (v.options && v.options.some((o) => o.toLowerCase().includes(q))),
      );
    }

    if (this.typeFilter !== 'ALL') {
      result = result.filter((v) => v.type === this.typeFilter);
    }

    if (this.statusFilter === 'ACTIVE') {
      result = result.filter((v) => v.isActive);
    } else if (this.statusFilter === 'INACTIVE') {
      result = result.filter((v) => !v.isActive);
    }

    this.filteredVariants = result;
  }

  openCreateModal() {
    this.editingVariant = null;
    this.errorMessage = '';
    this.newOptionValue = '';
    this.formData = {
      name: '',
      code: '',
      type: 'DROPDOWN',
      options: [],
      isActive: true,
    };
    this.showModal = true;
  }

  openEditModal(variant: VariantDefinition) {
    this.editingVariant = variant;
    this.errorMessage = '';
    this.newOptionValue = '';
    this.formData = {
      name: variant.name,
      code: variant.code,
      type: variant.type,
      options: Array.isArray(variant.options) ? [...variant.options] : [],
      isActive: variant.isActive !== false,
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingVariant = null;
    this.errorMessage = '';
    this.newOptionValue = '';
  }

  onNameChanged() {
    if (!this.editingVariant && this.formData.name && (!this.formData.code || this.formData.code.length <= 4)) {
      this.formData.code = this.formData.name
        .substring(0, 4)
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
    }
  }

  onTypeChanged() {
    if (this.formData.type !== 'DROPDOWN') {
      // Clear options if switched away
    }
  }

  addOptionValue() {
    const val = this.newOptionValue.trim();
    if (!val) return;
    if (this.formData.options.some((o) => o.toLowerCase() === val.toLowerCase())) {
      this.toast.show('warning', `Value "${val}" is already added`, 'Duplicate Value');
      this.newOptionValue = '';
      return;
    }
    this.formData.options.push(val);
    this.newOptionValue = '';
  }

  removeOptionValue(index: number) {
    this.formData.options.splice(index, 1);
  }


  saveVariant() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Variant name is required.';
      return;
    }

    if (!this.formData.code || !this.formData.code.trim()) {
      this.formData.code = this.formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10) || 'VAR';
    }

    if (this.formData.type === 'DROPDOWN' && this.formData.options.length === 0) {
      this.errorMessage = 'Please add at least one fixed dropdown value (e.g. Red, Blue, Green).';
      return;
    }

    const compId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.saving = true;
    this.errorMessage = '';

    const payload = {
      ...this.formData,
      code: this.formData.code.toUpperCase().trim(),
      companyId: compId,
    };

    if (this.editingVariant) {
      this.mastersService.updateVariantDefinition(this.editingVariant.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadVariants();
          this.toast.show('success', `Variant "${payload.name}" updated successfully!`, 'Variant Updated');
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update variant';
          this.toast.show('error', this.errorMessage, 'Error');
        },
      });
    } else {
      this.mastersService.createVariantDefinition(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadVariants();
          this.toast.show('success', `Variant "${payload.name}" created successfully!`, 'Variant Created');
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create variant';
          this.toast.show('error', this.errorMessage, 'Error');
        },
      });
    }
  }

  deleteVariant(variant: VariantDefinition) {
    if (!confirm(`Are you sure you want to delete the variant "${variant.name}"?`)) return;

    this.mastersService.deleteVariantDefinition(variant.id).subscribe({
      next: () => {
        this.loadVariants();
        this.toast.show('success', `Variant "${variant.name}" deleted successfully.`, 'Variant Deleted');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete variant';
        this.toast.show('error', msg, 'Error');
      },
    });
  }


  getTypeIcon(type: string): string {
    switch (type) {
      case 'DROPDOWN':
        return 'pi pi-list';
      case 'TEXT':
        return 'pi pi-align-left';
      case 'NUMBER':
        return 'pi pi-hashtag';
      case 'DATE':
        return 'pi pi-calendar';
      default:
        return 'pi pi-sliders-v';
    }
  }

  formatTypeName(type: string): string {
    switch (type) {
      case 'DROPDOWN':
        return 'Dropdown';
      case 'TEXT':
        return 'Text';
      case 'NUMBER':
        return 'Number';
      case 'DATE':
        return 'Date';
      default:
        return type;
    }
  }

  exportVariants() {
    if (!this.filteredVariants || this.filteredVariants.length === 0) return;
    const headers = ['Variant Name', 'Code', 'Data Type', 'Status'];
    const rows = this.filteredVariants.map((v) => [
      v.name || '',
      v.code || '',
      v.type || '',
      v.isActive ? 'Active' : 'Inactive',
    ]);
    exportToCsv('Variant_Master', headers, rows);
    this.toast.show('success', 'Variant Master exported successfully!', 'Export Complete');
  }
}
