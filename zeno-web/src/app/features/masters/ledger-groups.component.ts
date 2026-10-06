import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

interface LedgerGroupItem {
  id: string;
  name: string;
  code?: string;
  nature: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
  parentId?: string;
  parent?: { id: string; name: string };
  isCreditorVendor: boolean;
  isDebtorCustomer: boolean;
  isPredefined: boolean;
  children?: LedgerGroupItem[];
}

@Component({
  selector: 'app-ledger-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="masters-page">
      <div class="page-header">
        <div>
          <h1>Ledger Group</h1>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="pi pi-plus"></i> New Ledger Group
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="pi pi-sitemap"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Total Groups</span>
            <span class="kpi-value">{{ groups.length }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><i class="pi pi-shield"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Predefined (Standard)</span>
            <span class="kpi-value">{{ predefinedCount }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><i class="pi pi-users"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Debtor / Creditor Groups</span>
            <span class="kpi-value">{{ partyGroupsCount }}</span>
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
              placeholder="Search by group name or code..."
              [(ngModel)]="searchQuery"
              (input)="filterGroups()"
            />
          </div>
          <div class="toolbar-filters">
            <select [(ngModel)]="natureFilter" (change)="filterGroups()" class="form-select">
              <option value="ALL">All Natures</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expenses</option>
            </select>
          </div>
        </div>

        <!-- GROUPS TABLE -->
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Code</th>
              <th>Nature</th>
              <th>Parent Group</th>
              <th>Party Role</th>
              <th>Type</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  <i class="pi pi-spin pi-spinner"></i> Loading ledger groups...
                </td>
              </tr>
            } @else if (filteredGroups.length === 0) {
              <tr>
                <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No ledger groups match your filter criteria.
                </td>
              </tr>
            }
            @for (g of filteredGroups; track g.id) {
              <tr>
                <td>
                  <div class="group-name-cell">
                    <i class="pi pi-folder" [style.color]="getNatureColor(g.nature)"></i>
                    <strong>{{ g.name }}</strong>
                  </div>
                </td>
                <td class="font-mono">{{ g.code || '—' }}</td>
                <td>
                  <span class="badge-pill" [ngClass]="getNatureBadge(g.nature)">
                    {{ g.nature }}
                  </span>
                </td>
                <td>{{ g.parent?.name || 'Primary Group' }}</td>
                <td>
                  @if (g.isDebtorCustomer) {
                    <span class="badge-pill badge-partial">Debtor (Customer)</span>
                  } @else if (g.isCreditorVendor) {
                    <span class="badge-pill badge-warning">Creditor (Vendor)</span>
                  } @else {
                    <span style="color: var(--surface-400);">—</span>
                  }
                </td>
                <td>
                  @if (g.isPredefined) {
                    <span class="badge-pill badge-cleared"><i class="pi pi-lock"></i> Standard</span>
                  } @else {
                    <span class="badge-pill badge-custom">Custom</span>
                  }
                </td>
                <td class="text-right actions-cell">
                  <button class="btn-icon" (click)="openEditModal(g)" title="Edit Group">
                    <i class="pi pi-pencil"></i>
                  </button>
                  @if (!g.isPredefined) {
                    <button class="btn-icon text-danger" (click)="deleteGroup(g)" title="Delete Custom Group">
                      <i class="pi pi-trash"></i>
                    </button>
                  }
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
              <h3>{{ editingGroup ? 'Edit Ledger Group' : 'New Ledger Group' }}</h3>
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
                  <label class="required">Group Name</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    placeholder="e.g. Secured Loans, Direct Factory Overheads"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Group Code</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.code"
                    placeholder="e.g. SEC-LN"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="required">Nature of Group</label>
                  <select [(ngModel)]="formData.nature" class="form-control">
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>

                <div class="form-group full-width">
                  <label>Parent Group (Leave blank if Primary)</label>
                  <select [(ngModel)]="formData.parentId" class="form-control">
                    <option [ngValue]="null">-- Primary (No Parent) --</option>
                    @for (p of availableParents; track p.id) {
                      <option [value]="p.id">{{ p.name }} ({{ p.nature }})</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="saveGroup()" [disabled]="saving">
                @if (saving) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingGroup ? 'Update Group' : 'Create Group' }}
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

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); gap: 16px; flex-wrap: wrap; }
    .toolbar-search { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }
    .form-select { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; background: #fff; }

    .group-name-cell { display: flex; align-items: center; gap: 10px; }
    .badge-custom { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-warning { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    /* Modal Form */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 580px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: var(--primary-600); }
    .checkbox-row { display: flex; gap: 20px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; cursor: pointer; color: var(--surface-800); }
    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class LedgerGroupsComponent implements OnInit {
  groups: LedgerGroupItem[] = [];
  filteredGroups: LedgerGroupItem[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  natureFilter = 'ALL';

  showModal = false;
  editingGroup: LedgerGroupItem | null = null;
  errorMessage = '';

  formData: {
    name: string;
    code: string;
    nature: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
    parentId: string | null;
    isDebtorCustomer: boolean;
    isCreditorVendor: boolean;
  } = {
    name: '',
    code: '',
    nature: 'ASSET',
    parentId: null,
    isDebtorCustomer: false,
    isCreditorVendor: false,
  };

  constructor(
    private mastersService: MastersService,
    private tenantService: TenantService,
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  get predefinedCount() {
    return this.groups.filter((g) => g.isPredefined).length;
  }

  get partyGroupsCount() {
    return this.groups.filter((g) => g.isDebtorCustomer || g.isCreditorVendor).length;
  }

  get availableParents(): LedgerGroupItem[] {
    if (!this.editingGroup) return this.groups;
    return this.groups.filter((g) => g.id !== this.editingGroup?.id);
  }

  loadGroups() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    this.mastersService.getLedgerGroups(companyId || undefined).subscribe({
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

    if (this.natureFilter !== 'ALL') {
      result = result.filter((g) => g.nature === this.natureFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.code && g.code.toLowerCase().includes(q)),
      );
    }

    this.filteredGroups = result;
  }

  getNatureBadge(nature: string): string {
    switch (nature) {
      case 'ASSET':
        return 'badge-partial';
      case 'LIABILITY':
        return 'badge-warning';
      case 'INCOME':
        return 'badge-cleared';
      case 'EXPENSE':
        return 'badge-cancelled';
      default:
        return 'badge-partial';
    }
  }

  getNatureColor(nature: string): string {
    switch (nature) {
      case 'ASSET':
        return '#2563EB';
      case 'LIABILITY':
        return '#D97706';
      case 'INCOME':
        return '#16A34A';
      case 'EXPENSE':
        return '#DC2626';
      default:
        return '#64748B';
    }
  }

  openCreateModal() {
    this.editingGroup = null;
    this.formData = {
      name: '',
      code: '',
      nature: 'ASSET',
      parentId: null,
      isDebtorCustomer: false,
      isCreditorVendor: false,
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(group: LedgerGroupItem) {
    this.editingGroup = group;
    this.formData = {
      name: group.name,
      code: group.code || '',
      nature: group.nature,
      parentId: group.parentId || null,
      isDebtorCustomer: group.isDebtorCustomer,
      isCreditorVendor: group.isCreditorVendor,
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
      this.errorMessage = 'Please enter a group name.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      companyId,
      parentId: this.formData.parentId || null,
    };

    if (this.editingGroup) {
      this.mastersService.updateLedgerGroup(this.editingGroup.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadGroups();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to update ledger group';
        },
      });
    } else {
      this.mastersService.createLedgerGroup(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadGroups();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Failed to create ledger group';
        },
      });
    }
  }

  deleteGroup(group: LedgerGroupItem) {
    if (group.isPredefined) {
      alert('Standard predefined groups cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete custom group "${group.name}"?`)) {
      return;
    }

    this.mastersService.deleteLedgerGroup(group.id).subscribe({
      next: () => {
        this.loadGroups();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete ledger group');
      },
    });
  }
}
