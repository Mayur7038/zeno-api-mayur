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
    <div class="zeno-page-container">
      <zeno-page-header title="Variant Master">
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
        <div toolbar-right>
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
              <th>Code</th>
              <th>Data Type</th>
              <th>Fixed Values / Dropdown Options</th>
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
                  <span class="font-mono badge-code">{{ v.code || '—' }}</span>
                </td>
                <td>
                  <span class="type-badge" [ngClass]="v.type.toLowerCase()">
                    {{ formatTypeName(v.type) }}
                  </span>
                </td>
                <td>
                  @if (v.type === 'DROPDOWN' && v.options && v.options.length > 0) {
                    <div class="options-tags">
                      @for (opt of v.options; track $index) {
                        <span class="val-pill">{{ opt }}</span>
                      }
                      <span class="opt-count">({{ v.options.length }} values)</span>
                    </div>
                  } @else if (v.type === 'DROPDOWN') {
                    <span style="color: var(--surface-400); font-style: italic;">No options defined</span>
                  } @else {
                    <span style="color: var(--surface-400); font-size: 0.8125rem;">Dynamic input ({{ v.type | lowercase }})</span>
                  }
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
          <zeno-form-group label="Variant Name" [required]="true">
            <zeno-input
              [(ngModel)]="formData.name"
              (inputChange)="onNameChanged()"
            ></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="Variant Code" [required]="true">
            <zeno-input
              [(ngModel)]="formData.code"
              [uppercase]="true"
              [mono]="true"
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

          <zeno-form-group [span]="2">
            <zeno-checkbox [(ngModel)]="formData.isActive" label="Variant is Active (available in product creation)"></zeno-checkbox>
          </zeno-form-group>
        </div>

        <div footer>
          <zeno-button variant="secondary" (btnClick)="closeModal()">Cancel</zeno-button>
          <zeno-button
            variant="primary"
            icon="pi pi-check"
            [loading]="saving"
            [disabled]="saving || !formData.name || !formData.code"
            (btnClick)="saveVariant()"
          >
            {{ editingVariant ? 'Update Variant' : 'Create Variant' }}
          </zeno-button>
        </div>
      </zeno-modal>
    </div>
  `,
  styles: [`
    .masters-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .header-actions { display: flex; gap: 10px; }
    .text-secondary { color: var(--surface-500); }

    .table-toolbar { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); gap: 16px; }
    .toolbar-search { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }
    .toolbar-filters { display: flex; align-items: center; gap: 10px; }
    .form-select { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; background: #fff; }

    .variant-name-cell { display: flex; align-items: center; gap: 12px; }
    .type-icon-box {
      width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9375rem;
      &.dropdown { background: #EEF2FF; color: #4F46E5; }
      &.text { background: #F0FDF4; color: #16A34A; }
      &.number { background: #FEF3C7; color: #D97706; }
      &.date { background: #FDF2F8; color: #DB2777; }
    }

    .badge-code { background: var(--surface-100); padding: 3px 8px; border-radius: 4px; font-weight: 700; color: var(--surface-800); }
    
    .type-badge {
      display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
      &.dropdown { background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; }
      &.text { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
      &.number { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
      &.date { background: #FDF2F8; color: #BE185D; border: 1px solid #FBCFE8; }
    }

    .options-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; max-width: 450px; }
    .val-pill { background: #F1F5F9; color: #1E293B; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; border: 1px solid #CBD5E1; }
    .opt-count { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    .btn-export {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border: 1px solid var(--surface-300); border-radius: 6px;
      font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); cursor: pointer; transition: all 0.2s;
      &:hover:not(:disabled) { background: var(--surface-50); border-color: var(--primary-500); color: var(--primary-600); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 580px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); overflow: hidden; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--surface-200); display: flex; justify-content: space-between; align-items: center; h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--surface-900); } .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--surface-400); &:hover { color: var(--surface-700); } } }
    .modal-body { padding: 20px; max-height: calc(85vh - 120px); overflow-y: auto; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid var(--surface-200); display: flex; justify-content: flex-end; gap: 10px; background: var(--surface-50); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: var(--primary-600); }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; cursor: pointer; color: var(--surface-800); }

    .dropdown-builder-box {
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .builder-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .option-input-row { display: flex; gap: 8px; }
    .chips-container { display: flex; flex-wrap: wrap; gap: 8px; min-height: 48px; background: #fff; padding: 10px; border: 1px solid #E2E8F0; border-radius: 6px; align-items: center; }
    .chip-item {
      display: inline-flex; align-items: center; gap: 6px; background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE;
      padding: 4px 10px; border-radius: 16px; font-size: 0.8125rem; font-weight: 600;
    }
    .chip-remove {
      background: none; border: none; font-size: 1.1rem; line-height: 1; cursor: pointer; color: #6366F1; padding: 0;
      &:hover { color: #DC2626; }
    }
    .chips-empty { font-size: 0.8125rem; color: var(--surface-400); font-style: italic; width: 100%; text-align: center; }

    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
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
    if (!this.formData.code.trim()) {
      this.errorMessage = 'Variant code is required.';
      return;
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
    const headers = ['Variant Name', 'Code', 'Data Type', 'Fixed Values / Options', 'Status'];
    const rows = this.filteredVariants.map((v) => [
      v.name || '',
      v.code || '',
      v.type || '',
      Array.isArray(v.options) ? v.options.join('; ') : '',
      v.isActive ? 'Active' : 'Inactive',
    ]);
    exportToCsv('Variant_Master', headers, rows);
    this.toast.show('success', 'Variant Master exported successfully!', 'Export Complete');
  }
}
