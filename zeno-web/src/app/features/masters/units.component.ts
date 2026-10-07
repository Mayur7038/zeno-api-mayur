import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="masters-page">
      <div class="page-header">
        <div>
          <h1>Unit</h1>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="pi pi-plus"></i> New Unit
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
              placeholder="Search by unit name or code..."
              [(ngModel)]="searchQuery"
              (input)="filterUnits()"
            />
          </div>
        </div>

        <!-- TABLE -->
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Unit Name</th>
              <th>Symbol / Code</th>
              <th class="text-center">Allowed Decimal Places</th>
              <th>Precision Rule</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  <i class="pi pi-spin pi-spinner"></i> Loading measurement units...
                </td>
              </tr>
            } @else if (filteredUnits.length === 0) {
              <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No units found. Click "New Unit of Measure" to create one.
                </td>
              </tr>
            }
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
                <td class="text-center font-mono font-bold">
                  {{ u.decimalPlaces }}
                </td>
                <td>
                  @if (u.decimalPlaces === 0) {
                    <span class="badge-pill badge-partial">Integer / Discrete (e.g. 1, 2)</span>
                  } @else {
                    <span class="badge-pill badge-custom">Fractional (up to {{ u.decimalPlaces }} decimals)</span>
                  }
                </td>
                <td>
                  @if (u.isActive) {
                    <span class="badge-pill badge-cleared"><i class="pi pi-check"></i> Active</span>
                  } @else {
                    <span class="badge-pill badge-cancelled">Inactive</span>
                  }
                </td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" (click)="openEditModal(u)" title="Edit Unit">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="btn-icon text-danger" (click)="deleteUnit(u)" title="Delete Unit">
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
              <h3>{{ editingUnit ? 'Edit Unit of Measure' : 'New Unit of Measure' }}</h3>
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
                  <label class="required">Unit Name</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    placeholder="e.g. Kilograms, Pieces, Meters, Liters, Boxes"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="required">Unit Code / Symbol</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.code"
                    placeholder="e.g. KG, PCS, MTR, LTR, BOX"
                    class="form-control"
                    style="text-transform: uppercase;"
                  />
                </div>

                <div class="form-group">
                  <label class="required">Allowed Decimal Places</label>
                  <select [(ngModel)]="formData.decimalPlaces" class="form-control">
                    <option [ngValue]="0">0 (Whole numbers e.g. Nos, Pcs)</option>
                    <option [ngValue]="1">1 decimal (e.g. 1.5)</option>
                    <option [ngValue]="2">2 decimals (e.g. 1.25 mtrs)</option>
                    <option [ngValue]="3">3 decimals (e.g. 1.250 kg)</option>
                    <option [ngValue]="4">4 decimals (high precision)</option>
                  </select>
                </div>

                <div class="form-group full-width" style="margin-top: 6px;">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="formData.isActive" />
                    Unit is Active and available for invoicing & POs
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="saveUnit()" [disabled]="saving">
                @if (saving) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingUnit ? 'Update Unit' : 'Create Unit' }}
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

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); }
    .toolbar-search { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }

    .unit-name-cell { display: flex; align-items: center; gap: 10px; }
    .text-primary { color: #2563eb; }
    .code-badge { background: #f1f5f9; color: #334155; padding: 4px 8px; border-radius: 4px; font-size: 0.8125rem; font-weight: 700; }
    .badge-custom { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

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
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; cursor: pointer; color: var(--surface-800); }
    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
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

  formData = {
    name: '',
    code: '',
    decimalPlaces: 0,
    isActive: true,
  };

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
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
}
