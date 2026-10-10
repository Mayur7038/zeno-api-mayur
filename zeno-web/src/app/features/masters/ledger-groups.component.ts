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
                <div class="form-group">
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

                <div class="form-group">
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
  styleUrl: './ledger-groups.component.scss',
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
