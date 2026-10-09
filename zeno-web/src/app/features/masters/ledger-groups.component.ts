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

export interface LedgerGroupNode extends LedgerGroupItem {
  level: number;
  hasChildren: boolean;
  childCount: number;
  childrenList: LedgerGroupNode[];
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

      <!-- FILTER & TOOLBAR -->
      <div class="zeno-card">
        <div class="table-toolbar">
          <div class="toolbar-search">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
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

            @if (hasAnySubGroups) {
              <button type="button" class="btn-text-tool" (click)="expandAll()" title="Expand all sub-groups">
                <i class="pi pi-angle-double-down"></i> Expand All
              </button>
              <button type="button" class="btn-text-tool" (click)="collapseAll()" title="Collapse all sub-groups">
                <i class="pi pi-angle-double-up"></i> Collapse All
              </button>
            }
          </div>
        </div>

        <!-- GROUPS TABLE -->
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Nature</th>
              <th>Parent Group</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  <i class="pi pi-spin pi-spinner"></i> Loading ledger groups...
                </td>
              </tr>
            } @else if (displayedRows.length === 0) {
              <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--surface-500);">
                  No ledger groups match your filter criteria.
                </td>
              </tr>
            }
            @for (g of displayedRows; track g.id) {
              <tr [class.child-row]="g.level > 0">
                <td>
                  <div class="group-name-cell" [style.padding-left.px]="g.level * 24">
                    @if (g.hasChildren) {
                      <button
                        type="button"
                        class="btn-expand-toggle"
                        (click)="toggleExpand(g.id, $event)"
                        [title]="isExpanded(g.id) ? 'Collapse sub-groups' : 'Expand sub-groups'"
                      >
                        <i [class]="isExpanded(g.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                      </button>
                      <i
                        [class]="isExpanded(g.id) ? 'pi pi-folder-open folder-icon' : 'pi pi-folder folder-icon'"
                        [style.color]="getNatureColor(g.nature)"
                        (click)="toggleExpand(g.id, $event)"
                        style="cursor: pointer;"
                        [title]="isExpanded(g.id) ? 'Click to collapse' : 'Click to expand'"
                      ></i>
                    } @else {
                      @if (g.level > 0) {
                        <span class="tree-branch-line">└─</span>
                      } @else {
                        <span class="expand-spacer"></span>
                      }
                      <i class="pi pi-folder folder-icon" [style.color]="getNatureColor(g.nature)"></i>
                    }

                    <span
                      class="group-name-text"
                      [class.parent-group-bold]="g.hasChildren"
                      (click)="g.hasChildren ? toggleExpand(g.id, $event) : null"
                      [style.cursor]="g.hasChildren ? 'pointer' : 'default'"
                    >
                      {{ g.name }}
                    </span>

                    @if (g.hasChildren) {
                      <span class="sub-group-count-badge" (click)="toggleExpand(g.id, $event)" [title]="isExpanded(g.id) ? 'Click to collapse' : 'Click to expand'">
                        {{ g.childCount }} {{ g.childCount === 1 ? 'sub-group' : 'sub-groups' }}
                      </span>
                    }
                  </div>
                </td>
                <td>
                  <span class="badge-pill" [ngClass]="getNatureBadge(g.nature)">
                    {{ g.nature }}
                  </span>
                </td>
                <td>
                  @if (g.parent?.name) {
                    <span class="parent-pill">
                      <i class="pi pi-folder"></i> {{ g.parent?.name }}
                    </span>
                  } @else {
                    <span style="color: var(--surface-500);">Primary Group</span>
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
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Group Code</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.code"
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
                  <select [(ngModel)]="formData.parentId" (change)="onParentChange()" class="form-control">
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

    .group-name-cell { display: flex; align-items: center; gap: 8px; }
    .btn-expand-toggle {
      background: none; border: none; width: 22px; height: 22px; display: inline-flex;
      align-items: center; justify-content: center; cursor: pointer; color: var(--surface-500);
      border-radius: 4px; padding: 0; transition: all 0.15s ease; font-size: 0.75rem;
      &:hover { background-color: var(--surface-100); color: var(--surface-900); }
    }
    .expand-spacer { width: 22px; display: inline-block; flex-shrink: 0; }
    .tree-branch-line { color: var(--surface-400); font-family: monospace; font-weight: 700; font-size: 0.85rem; margin-right: 4px; display: inline-block; }
    .folder-icon { font-size: 1.1rem; transition: transform 0.15s ease; }
    .group-name-text { color: var(--surface-900); font-size: 0.875rem; font-weight: 600; }
    .parent-group-bold { font-weight: 700; }
    .sub-group-count-badge {
      font-size: 0.7rem; font-weight: 600; color: var(--primary-700); background: #eff6ff;
      border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 12px; cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: #dbeafe; }
    }
    .parent-pill {
      display: inline-flex; align-items: center; gap: 5px; font-size: 0.8125rem; color: var(--surface-700); font-weight: 500;
      i { font-size: 0.75rem; color: var(--surface-400); }
    }
    .btn-text-tool {
      display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: #fff;
      border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.8125rem; font-weight: 600;
      color: var(--surface-600); cursor: pointer; transition: all 0.15s ease;
      &:hover { background: var(--surface-50); color: var(--primary-600); border-color: var(--primary-400); }
    }
    .child-row td { background-color: #fafbfc; }
    .child-row:hover td { background-color: #f1f5f9; }

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
  displayedRows: LedgerGroupNode[] = [];
  expandedGroupIds = new Set<string>();
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
        const raw = res || [];
        const seen = new Set<string>();
        this.groups = raw.filter((g: any) => {
          const key = (g.name || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        this.filterGroups();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get hasAnySubGroups(): boolean {
    return this.groups.some((g) => {
      const pId = g.parentId || g.parent?.id;
      return !!pId && this.groups.some((parent) => parent.id === pId);
    });
  }

  isExpanded(id: string): boolean {
    if (this.searchQuery.trim()) {
      return true;
    }
    return this.expandedGroupIds.has(id);
  }

  toggleExpand(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedGroupIds.has(id)) {
      this.expandedGroupIds.delete(id);
    } else {
      this.expandedGroupIds.add(id);
    }
    this.filterGroups();
  }

  expandAll() {
    for (const g of this.groups) {
      this.expandedGroupIds.add(g.id);
    }
    this.filterGroups();
  }

  collapseAll() {
    this.expandedGroupIds.clear();
    this.filterGroups();
  }

  onParentChange() {
    if (this.formData.parentId) {
      const parent = this.groups.find((g) => g.id === this.formData.parentId);
      if (parent) {
        this.formData.nature = parent.nature;
      }
    }
  }

  filterGroups() {
    // 1. Index all groups by id
    const groupMap = new Map<string, LedgerGroupItem>();
    this.groups.forEach((g) => groupMap.set(g.id, g));

    // 2. Identify child groups and root groups
    const childrenMap = new Map<string, LedgerGroupItem[]>();
    const rootGroups: LedgerGroupItem[] = [];

    for (const g of this.groups) {
      const pId = g.parentId || g.parent?.id;
      if (pId && groupMap.has(pId)) {
        if (!childrenMap.has(pId)) {
          childrenMap.set(pId, []);
        }
        childrenMap.get(pId)!.push(g);
      } else {
        rootGroups.push(g);
      }
    }

    // 3. Sort root groups alphabetically by name
    rootGroups.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Recursive tree builder
    const buildTree = (item: LedgerGroupItem, level: number): LedgerGroupNode => {
      const rawChildren = childrenMap.get(item.id) || [];
      rawChildren.sort((a, b) => a.name.localeCompare(b.name));
      const childrenList = rawChildren.map((c) => buildTree(c, level + 1));
      return {
        ...item,
        level,
        hasChildren: childrenList.length > 0,
        childCount: childrenList.length,
        childrenList,
      };
    };

    const tree = rootGroups.map((r) => buildTree(r, 0));

    // 5. Filter tree based on search query and nature filter
    const q = this.searchQuery.trim().toLowerCase();
    const nature = this.natureFilter;

    const matchesDirectly = (node: LedgerGroupNode): boolean => {
      const natureMatch = nature === 'ALL' || node.nature === nature;
      const queryMatch = !q || node.name.toLowerCase().includes(q) || Boolean(node.code && node.code.toLowerCase().includes(q));
      return Boolean(natureMatch && queryMatch);
    };

    const filterNode = (node: LedgerGroupNode): LedgerGroupNode | null => {
      const direct = matchesDirectly(node);
      const filteredChildren = node.childrenList
        .map((c) => filterNode(c))
        .filter((c): c is LedgerGroupNode => c !== null);

      if (direct || filteredChildren.length > 0) {
        return {
          ...node,
          hasChildren: filteredChildren.length > 0,
          childCount: filteredChildren.length,
          childrenList: filteredChildren,
        };
      }
      return null;
    };

    const filteredTree = tree
      .map((root) => filterNode(root))
      .filter((r): r is LedgerGroupNode => r !== null);

    // 6. Flatten to displayedRows
    const rows: LedgerGroupNode[] = [];
    const isSearching = q.length > 0;

    const flatten = (node: LedgerGroupNode) => {
      rows.push(node);
      const expanded = isSearching || this.expandedGroupIds.has(node.id);
      if (node.hasChildren && expanded) {
        for (const child of node.childrenList) {
          flatten(child);
        }
      }
    };

    for (const root of filteredTree) {
      flatten(root);
    }

    this.displayedRows = rows;
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
    if (group.parentId) {
      this.expandedGroupIds.add(group.parentId);
    }
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

    if (this.formData.parentId) {
      this.expandedGroupIds.add(this.formData.parentId);
    }

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
