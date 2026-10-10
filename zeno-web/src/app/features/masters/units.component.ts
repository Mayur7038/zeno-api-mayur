import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';
import { ZENO_UI_COMPONENTS } from '../../shared/ui';

interface UnitItem {
  id: string;
  name: string;
  code: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ZENO_UI_COMPONENTS],
  template: `
    <div class="p2p-page">
      <zeno-page-header title="Unit of Measure" subtitle="Define primary and compound units of measurement (PCS, KG, MTR, BOX).">
        <div actions>
          <zeno-button variant="primary" icon="pi pi-plus" (btnClick)="openCreateModal()">
            New Unit
          </zeno-button>
        </div>
      </zeno-page-header>

      <!-- TABLE & LIST CONTAINER -->
      <zeno-table
        [loading]="loading"
        [empty]="filteredUnits.length === 0"
        loadingMessage="Loading measurement units..."
        emptyMessage="No units found. Click 'New Unit' to create one."
      >
        <div toolbar-left>
          <zeno-search
            [(ngModel)]="searchQuery"
            (searchChange)="filterUnits()"
          ></zeno-search>
        </div>
        <div toolbar-right>
          <zeno-button
            variant="secondary"
            icon="pi pi-download"
            [disabled]="filteredUnits.length === 0"
            (btnClick)="exportUnits()"
            title="Export to CSV"
          >
            Export
          </zeno-button>
        </div>

        <table class="zeno-table">
          <thead>
            <tr>
              <th>Unit Name</th>
              <th>Symbol / Code</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filteredUnits; track u.id) {
              <tr>
                <td>
                  <div class="unit-name-cell">
                    <i class="pi pi-compass text-primary"></i>
                    <strong>{{ u.name }}</strong>
                  </div>
                </td>
                <td>
                  <span class="code-badge font-mono">{{ u.code }}</span>
                </td>
                <td>
                  @if (u.isActive) {
                    <zeno-badge type="success" icon="pi pi-check">Active</zeno-badge>
                  } @else {
                    <zeno-badge type="danger">Inactive</zeno-badge>
                  }
                </td>
                <td class="text-right actions-cell">
                  <zeno-button variant="icon" icon="pi pi-pencil" title="Edit Unit" (btnClick)="openEditModal(u)"></zeno-button>
                  <zeno-button variant="icon" icon="pi pi-trash" title="Delete Unit" (btnClick)="deleteUnit(u)" class="text-danger"></zeno-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </zeno-table>

      <!-- CREATE / EDIT MODAL -->
      <zeno-modal
        [isOpen]="showModal"
        [title]="editingUnit ? 'Edit Unit of Measure' : 'New Unit of Measure'"
        size="md"
        (close)="closeModal()"
      >
        @if (errorMessage) {
          <div class="alert alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <div class="zeno-form-grid-2">
          <zeno-form-group label="Unit Name" [required]="true" [span]="2">
            <zeno-input [(ngModel)]="formData.name"></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="Unit Code / Symbol" [required]="true">
            <zeno-input [(ngModel)]="formData.code" [uppercase]="true"></zeno-input>
          </zeno-form-group>

          <zeno-form-group label="Allowed Decimal Places" [required]="true">
            <zeno-select
              [(ngModel)]="formData.decimalPlaces"
              [options]="decimalOptions"
            ></zeno-select>
          </zeno-form-group>
        </div>

        <div footer>
          <zeno-button variant="secondary" (btnClick)="closeModal()">Cancel</zeno-button>
          <zeno-button variant="primary" icon="pi pi-check" [loading]="saving" (btnClick)="saveUnit()">
            {{ editingUnit ? 'Update Unit' : 'Create Unit' }}
          </zeno-button>
        </div>
      </zeno-modal>
    </div>
  `,
  styleUrl: './units.component.scss',
})
export class UnitsComponent implements OnInit {
  units: UnitItem[] = [];
  filteredUnits: UnitItem[] = [];
  loading = false;
  saving = false;
  searchQuery = '';

  showModal = false;
  editingUnit: UnitItem | null = null;
  errorMessage = '';
  readonly decimalOptions = [
    { label: '0 (Whole numbers e.g. Nos, Pcs)', value: 0 },
    { label: '1 decimal (e.g. 1.5)', value: 1 },
    { label: '2 decimals (e.g. 1.25 mtrs)', value: 2 },
    { label: '3 decimals (e.g. 1.250 kg)', value: 3 },
    { label: '4 decimals (high precision)', value: 4 },
  ];

  formData = {
    name: '',
    code: '',
    decimalPlaces: 0,
    isActive: true,
  };

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadUnits();
  }

  get activeUnitsCount() {
    return this.units.filter((u) => u.isActive).length;
  }

  get fractionalUnitsCount() {
    return this.units.filter((u) => u.decimalPlaces > 0).length;
  }

  loadUnits() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!companyId) {
      this.loading = false;
      return;
    }

    this.mastersService.getUnits(companyId).subscribe({
      next: (res) => {
        this.units = res || [];
        this.filterUnits();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterUnits() {
    let result = [...this.units];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q),
      );
    }
    this.filteredUnits = result;
  }

  openCreateModal() {
    this.editingUnit = null;
    this.formData = {
      name: '',
      code: '',
      decimalPlaces: 0,
      isActive: true,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(unit: UnitItem) {
    this.editingUnit = unit;
    this.formData = {
      name: unit.name,
      code: unit.code,
      decimalPlaces: unit.decimalPlaces,
      isActive: unit.isActive,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingUnit = null;
    this.errorMessage = '';
  }

  saveUnit() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Please enter a unit name.';
      return;
    }
    if (!this.formData.code.trim()) {
      this.errorMessage = 'Please enter a unit symbol / code.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      code: this.formData.code.toUpperCase().trim(),
      companyId,
    };

    if (this.editingUnit) {
      this.mastersService.updateUnit(this.editingUnit.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUnits();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update unit';
        },
      });
    } else {
      this.mastersService.createUnit(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUnits();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create unit';
        },
      });
    }
  }

  deleteUnit(unit: UnitItem) {
    if (!confirm(`Are you sure you want to delete unit "${unit.name}" (${unit.code})?`)) {
      return;
    }

    this.mastersService.deleteUnit(unit.id).subscribe({
      next: () => {
        this.loadUnits();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete unit');
      },
    });
  }

  exportUnits() {
    if (!this.filteredUnits || this.filteredUnits.length === 0) return;
    const headers = ['Unit Name', 'Symbol / Code', 'Allowed Decimal Places', 'Status'];
    const rows = this.filteredUnits.map((u) => [
      u.name || '',
      u.code || '',
      u.decimalPlaces ?? 0,
      u.isActive ? 'Active' : 'Inactive'
    ]);
    exportToCsv('Units_of_Measure', headers, rows);
    this.toast.success('Units exported successfully!', 'Export Complete');
  }
}
