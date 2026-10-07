import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../core/services/toast.service';
import { INDIAN_STATES } from '../../core/constants/states.constant';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="settings-page">
      <!-- HEADER -->
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" (click)="roleViewMode !== 'list' && activeTab === 'roles' ? backToRoleList() : goHome()" [title]="roleViewMode !== 'list' && activeTab === 'roles' ? 'Back to Roles List' : 'Back to Home / Dashboard'">
            <i class="pi pi-arrow-left"></i>
          </button>
          <h1>{{ getActiveTabTitle() }}</h1>
        </div>
        <div class="header-actions">
          @if (activeTab === 'company') {
            <button class="btn-primary" (click)="saveCompanyProfile()" [disabled]="savingCompany">
              <i class="pi pi-check"></i> {{ savingCompany ? 'Saving...' : 'Save Company Profile' }}
            </button>
          } @else if (activeTab === 'branches') {
            <button class="btn-primary" (click)="openCreateBranchModal()">
              <i class="pi pi-plus"></i> Add New Branch
            </button>
          } @else if (activeTab === 'warehouses') {
            <button class="btn-primary" (click)="openCreateWarehouseModal()">
              <i class="pi pi-plus"></i> Add New Warehouse
            </button>
          } @else if (activeTab === 'roles') {
            @if (roleViewMode === 'list') {
              <button class="btn-primary" (click)="startCreateRole()">
                <i class="pi pi-plus"></i> Create New Role
              </button>
            } @else if (roleViewMode === 'create') {
              <button class="btn-secondary" (click)="backToRoleList()">
                <i class="pi pi-arrow-left"></i> Back to Roles
              </button>
              <button class="btn-primary" (click)="submitCreateRole()" [disabled]="savingRole || !newRole.name.trim()">
                <i class="pi pi-check"></i> {{ savingRole ? 'Creating...' : 'Create Role & Save' }}
              </button>
            } @else {
              <button class="btn-secondary" (click)="backToRoleList()">
                <i class="pi pi-arrow-left"></i> Back to Roles
              </button>
              <button class="btn-primary" (click)="saveRolePermissions(selectedRole)" [disabled]="savingRole || !selectedRole">
                <i class="pi pi-check"></i> {{ savingRole ? 'Saving...' : 'Save Role & Privileges' }}
              </button>
            }
          } @else if (activeTab === 'users') {
            <button class="btn-primary" (click)="openNewUserModal()">
              <i class="pi pi-user-plus"></i> Add User
            </button>
          } @else {
            <button class="btn-primary" (click)="saveSettings()" [disabled]="saving || savingRole">
              <i class="pi pi-check"></i> {{ saving || savingRole ? 'Saving...' : 'Save Configuration' }}
            </button>
          }
        </div>
      </div>

      @if (saveSuccess) {
        <div class="alert-success">
          <i class="pi pi-check-circle"></i>
          <span>{{ saveMessage || 'Configuration saved successfully! All transactional engines and parameters refreshed.' }}</span>
        </div>
      }

      <!-- TAB 1: FEATURE TOGGLES -->
      @if (activeTab === 'toggles') {
        <div class="zeno-card padded-card">
          <div class="card-title">Modular System Capabilities</div>

          <div class="toggle-grid">
            @for (toggle of toggles; track toggle.featureKey) {
              <div class="toggle-card" [class.enabled]="toggle.isEnabled">
                <div class="toggle-content">
                  <div class="toggle-icon-wrap">
                    <i [class]="getFeatureIcon(toggle.featureKey)"></i>
                  </div>
                  <div>
                    <div class="toggle-title">{{ formatFeatureName(toggle.featureKey) }}</div>
                    <div class="toggle-desc">{{ getFeatureDescription(toggle.featureKey) }}</div>
                  </div>
                </div>
                <div class="toggle-switch-container">
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      [checked]="toggle.isEnabled" 
                      (change)="toggleFeature(toggle, $event)"
                    />
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-status-text">{{ toggle.isEnabled ? 'Active' : 'Disabled' }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: USER ROLE & PERMISSION -->
      @if (activeTab === 'roles') {
        <!-- VIEW 1: ROLES LIST PAGE (DEFAULT) -->
        @if (roleViewMode === 'list') {
          <div class="roles-list-view">
            <!-- STATS / KPI SUMMARY CARDS -->
            <div class="roles-stats-grid">
              <div class="kpi-card" (click)="roleTypeFilter = 'all'" [class.kpi-selected]="roleTypeFilter === 'all'" style="cursor: pointer;">
                <div class="kpi-icon-wrap primary">
                  <i class="pi pi-shield"></i>
                </div>
                <div class="kpi-info">
                  <div class="kpi-value">{{ roles.length }}</div>
                  <div class="kpi-label">Defined Roles</div>
                </div>
              </div>

              <div class="kpi-card" (click)="roleTypeFilter = 'system'" [class.kpi-selected]="roleTypeFilter === 'system'" style="cursor: pointer;">
                <div class="kpi-icon-wrap system">
                  <i class="pi pi-lock"></i>
                </div>
                <div class="kpi-info">
                  <div class="kpi-value">{{ getSystemRolesCount() }}</div>
                  <div class="kpi-label">System Predefined</div>
                </div>
              </div>

              <div class="kpi-card" (click)="roleTypeFilter = 'custom'" [class.kpi-selected]="roleTypeFilter === 'custom'" style="cursor: pointer;">
                <div class="kpi-icon-wrap custom">
                  <i class="pi pi-sparkles"></i>
                </div>
                <div class="kpi-info">
                  <div class="kpi-value">{{ getCustomRolesCount() }}</div>
                  <div class="kpi-label">Custom Tenant Roles</div>
                </div>
              </div>

              <div class="kpi-card">
                <div class="kpi-icon-wrap users">
                  <i class="pi pi-users"></i>
                </div>
                <div class="kpi-info">
                  <div class="kpi-value">{{ users.length }}</div>
                  <div class="kpi-label">Tenant Users</div>
                </div>
              </div>
            </div>

            <!-- SEARCH, FILTERS & ACTION BAR -->
            <div class="roles-toolbar zeno-card">
              <div class="search-input-wrap">
                <i class="pi pi-search"></i>
                <input 
                  type="text" 
                  [(ngModel)]="roleSearchQuery" 
                  placeholder="Search roles by title, keyword, or duties..." 
                />
                @if (roleSearchQuery) {
                  <button class="clear-search-btn" (click)="roleSearchQuery = ''">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </div>

              <div class="filter-pills-group">
                <button 
                  type="button" 
                  class="filter-pill" 
                  [class.active]="roleTypeFilter === 'all'" 
                  (click)="roleTypeFilter = 'all'"
                >
                  All ({{ roles.length }})
                </button>
                <button 
                  type="button" 
                  class="filter-pill" 
                  [class.active]="roleTypeFilter === 'system'" 
                  (click)="roleTypeFilter = 'system'"
                >
                  <i class="pi pi-lock"></i> System ({{ getSystemRolesCount() }})
                </button>
                <button 
                  type="button" 
                  class="filter-pill" 
                  [class.active]="roleTypeFilter === 'custom'" 
                  (click)="roleTypeFilter = 'custom'"
                >
                  <i class="pi pi-sparkles"></i> Custom ({{ getCustomRolesCount() }})
                </button>
              </div>
            </div>

            <!-- ROLES DATA TABLE -->
            <div class="zeno-card roles-table-card">
              <div class="roles-table-wrap">
                <table class="zeno-table roles-table">
                  <thead>
                    <tr>
                      <th style="min-width: 220px;">Role & Classification</th>
                      <th style="min-width: 260px;">Functional Duties / Scope</th>
                      <th style="min-width: 220px;">Privilege Coverage</th>
                      <th style="min-width: 140px; text-align: center;">Assigned Users</th>
                      <th style="min-width: 240px; text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of filteredRoles(); track r.id) {
                      <tr class="role-row">
                        <td>
                          <div class="role-cell-title">
                            <div class="role-avatar" [class.system]="r.isSystem">
                              <i [class]="r.isSystem ? 'pi pi-shield' : 'pi pi-user'"></i>
                            </div>
                            <div class="role-text-info">
                              <div class="role-row-name">{{ r.name }}</div>
                              @if (r.isSystem) {
                                <span class="badge-system">
                                  <i class="pi pi-lock"></i> SYSTEM
                                </span>
                              } @else {
                                <span class="badge-custom">
                                  <i class="pi pi-sparkles"></i> CUSTOM
                                </span>
                              }
                            </div>
                          </div>
                        </td>
                        <td>
                          <p class="role-row-desc">{{ r.description || 'Predefined system role for ' + r.name }}</p>
                        </td>
                        <td>
                          <div class="privilege-coverage-cell">
                            <div class="privilege-count-line">
                              <span class="priv-count"><strong>{{ (r.permissions || []).length }}</strong> / {{ totalPrivilegesCount }}</span>
                              <span class="priv-pct">{{ getPrivilegePercentage(r) }}%</span>
                            </div>
                            <div class="priv-progress-bar">
                              <div class="priv-progress-fill" [style.width.%]="getPrivilegePercentage(r)"></div>
                            </div>
                            <div class="priv-categories-tags">
                              @for (cat of getRoleCategoryBreakdown(r); track cat) {
                                <span class="cat-micro-tag">{{ cat }}</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td style="text-align: center;">
                          <div class="users-count-badge" [class.has-users]="getUserCountForRole(r.id) > 0">
                            <i class="pi pi-users"></i>
                            <span>{{ getUserCountForRole(r.id) }} users</span>
                          </div>
                        </td>
                        <td style="text-align: right;">
                          <div class="role-actions-row">
                            <button 
                              type="button" 
                              class="btn-action-primary" 
                              (click)="startConfigurePermissions(r)"
                              title="Configure Module Permissions & Privileges"
                            >
                              <i class="pi pi-sliders-h"></i> Permissions
                            </button>
                            <button 
                              type="button" 
                              class="btn-action-secondary" 
                              (click)="cloneRole(r)"
                              title="Clone this role into a new custom role"
                            >
                              <i class="pi pi-copy"></i>
                            </button>
                            <button 
                              type="button" 
                              class="btn-action-secondary" 
                              (click)="openEditRoleModal(r)"
                              title="Edit Role Name & Note"
                            >
                              <i class="pi pi-pencil"></i>
                            </button>
                            @if (!r.isSystem) {
                              <button 
                                type="button" 
                                class="btn-action-danger" 
                                (click)="confirmDeleteRole(r)"
                                title="Delete Custom Role"
                              >
                                <i class="pi pi-trash"></i>
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                    @if (filteredRoles().length === 0) {
                      <tr>
                        <td colspan="5" class="empty-state-cell">
                          <div class="empty-state-content">
                            <i class="pi pi-filter-slash empty-icon"></i>
                            <h4>No matching roles found</h4>
                            <p>Try modifying your search query or reset the filter.</p>
                            <button class="btn-secondary btn-sm" (click)="roleSearchQuery = ''; roleTypeFilter = 'all'">
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- VIEW 2: CREATE NEW ROLE PAGE -->
        @else if (roleViewMode === 'create') {
          <div class="role-create-view">
            <!-- ROLE DETAILS FORM CARD -->
            <div class="zeno-card role-form-card">
              <div class="card-title">1. Role Definition & Baseline Template</div>

              <div class="role-form-grid">
                <div class="form-group">
                  <label>Role Name <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="newRole.name" 
                    placeholder="e.g. Sales Executive, Inventory Auditor, Junior Accountant" 
                    autofocus
                  />
                </div>

                <div class="form-group">
                  <label>Clone Base Privileges (Optional Template)</label>
                  <select [(ngModel)]="createBaseRoleId" (change)="onBaseRoleChanged()">
                    <option value="">-- Start with Blank Permissions --</option>
                    @for (r of roles; track r.id) {
                      <option [value]="r.id">
                        Clone from: {{ r.name }} ({{ (r.permissions || []).length }} privileges)
                      </option>
                    }
                  </select>
                </div>

                <div class="form-group full-width">
                  <label>Role Description & Functional Scope</label>
                  <textarea 
                    rows="2" 
                    [(ngModel)]="newRole.description" 
                    placeholder="Specify functional duties, reporting hierarchy, and module access scope..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- PERMISSION MATRIX FOR NEW ROLE -->
            <div class="zeno-card matrix-editor-card">
              <div class="card-title">2. Configure Module Permissions</div>

              <!-- MATRIX TOOLBAR -->
              <div class="matrix-filter-bar">
                <div class="matrix-search">
                  <i class="pi pi-search"></i>
                  <input 
                    type="text" 
                    [(ngModel)]="moduleSearchQuery" 
                    placeholder="Filter modules (e.g. Sales, Invoice, Ledger)..." 
                  />
                  @if (moduleSearchQuery) {
                    <button class="clear-search-btn" (click)="moduleSearchQuery = ''">
                      <i class="pi pi-times"></i>
                    </button>
                  }
                </div>

                <div class="category-tabs">
                  @for (cat of categoryOptions; track cat.key) {
                    <button 
                      type="button" 
                      class="cat-tab" 
                      [class.active]="selectedCategoryFilter === cat.key" 
                      (click)="selectedCategoryFilter = cat.key"
                    >
                      {{ cat.label }} ({{ cat.count }})
                    </button>
                  }
                </div>

                <div class="matrix-bulk-actions">
                  <button type="button" class="btn-bulk" (click)="grantAllViewOnly(newRole)" title="Grant Read-Only View to all modules">
                    <i class="pi pi-eye"></i> View Only
                  </button>
                  <button type="button" class="btn-bulk" (click)="grantFullAccess(newRole)" title="Grant all actions across all modules">
                    <i class="pi pi-check-circle"></i> Grant All
                  </button>
                  <button type="button" class="btn-bulk text-danger" (click)="revokeAllPermissions(newRole)" title="Clear all granted privileges">
                    <i class="pi pi-ban"></i> Revoke All
                  </button>
                </div>
              </div>

              <!-- MATRIX TABLE -->
              <div class="matrix-table-wrap">
                <table class="zeno-table matrix-table">
                  <thead>
                    <tr>
                      <th style="min-width: 220px;">Module & Resource</th>
                      <th style="min-width: 130px;">Category</th>
                      @for (act of permissionActions; track act.key) {
                        <th style="text-align: center; width: 95px;">
                          <div class="th-action-col">
                            <span>{{ act.label }}</span>
                            <button 
                              type="button" 
                              class="btn-th-col-toggle" 
                              (click)="toggleColumnAll(newRole, act.key)"
                              [title]="'Toggle ' + act.label + ' column for all modules'"
                            >
                              <i class="pi pi-sort-alt"></i>
                            </button>
                          </div>
                        </th>
                      }
                      <th style="text-align: center; width: 100px;">Grant Row</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (mod of filteredPermissionModules(); track mod.key) {
                      <tr [class.row-highlight]="isModuleActive(newRole, mod.key)">
                        <td class="module-cell">
                          <div class="module-identity">
                            <div class="module-icon">
                              <i [class]="mod.icon || 'pi pi-folder'"></i>
                            </div>
                            <div class="module-text">
                              <span class="module-name">{{ mod.label }}</span>
                              <span class="module-key font-mono">{{ mod.key }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="category-pill" [ngClass]="'cat-' + mod.category.toLowerCase()">{{ mod.category }}</span>
                        </td>
                        @for (act of permissionActions; track act.key) {
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              class="perm-checkbox"
                              [checked]="hasPermission(newRole, mod.key, act.key)"
                              (change)="togglePermission(newRole, mod.key, act.key)"
                            />
                          </td>
                        }
                        <td style="text-align: center;">
                          <button 
                            type="button" 
                            class="btn-toggle-all"
                            [class.btn-all-active]="isModuleFullyGranted(newRole, mod.key)"
                            (click)="toggleAllModulePermissions(newRole, mod.key)"
                            title="Toggle all 6 privileges for this module"
                          >
                            {{ isModuleFullyGranted(newRole, mod.key) ? 'Clear' : 'Toggle' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- VIEW 3: MANAGE PERMISSIONS MATRIX VIEW -->
        @else if (roleViewMode === 'permissions' && selectedRole) {
          <div class="role-permissions-view">
            <!-- SUB-NAV / BREADCRUMB -->
            <div class="view-subnav">
              <button type="button" class="btn-subnav-back" (click)="backToRoleList()">
                <i class="pi pi-arrow-left"></i> Back to Roles List
              </button>
              <div class="subnav-title-wrap">
                <span class="subnav-title">{{ selectedRole.name }}</span>
                @if (selectedRole.isSystem) {
                  <span class="badge-system"><i class="pi pi-lock"></i> SYSTEM PREDEFINED</span>
                } @else {
                  <span class="badge-custom"><i class="pi pi-sparkles"></i> CUSTOM ROLE</span>
                }
              </div>
            </div>

            <!-- ROLE DETAILS / NOTES CARD -->
            <div class="zeno-card role-edit-header-card">
              <div class="role-header-content">
                <div class="role-meta-row">
                  @if (!selectedRole.isSystem) {
                    <div class="form-group" style="flex: 1; max-width: 320px;">
                      <label>Role Name *</label>
                      <input type="text" [(ngModel)]="selectedRole.name" placeholder="Role Name *" />
                    </div>
                  }
                  <div class="form-group" style="flex: 2;">
                    <label>Role Note / Functional Scope</label>
                    <input 
                      type="text" 
                      [(ngModel)]="selectedRole.description" 
                      placeholder="Add role note or functional description..." 
                    />
                  </div>
                </div>

                <div class="role-privilege-summary-bar">
                  <div class="summary-stat">
                    <span class="stat-number">{{ (selectedRole.permissions || []).length }}</span>
                    <span class="stat-text">of {{ totalPrivilegesCount }} Privileges Active ({{ getPrivilegePercentage(selectedRole) }}%)</span>
                  </div>
                  <div class="summary-progress">
                    <div class="summary-progress-fill" [style.width.%]="getPrivilegePercentage(selectedRole)"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MATRIX TOOLBAR -->
            <div class="matrix-filter-bar zeno-card">
              <div class="matrix-search">
                <i class="pi pi-search"></i>
                <input 
                  type="text" 
                  [(ngModel)]="moduleSearchQuery" 
                  placeholder="Filter modules (e.g. Sales, Invoice, Ledger, Inventory)..." 
                />
                @if (moduleSearchQuery) {
                  <button class="clear-search-btn" (click)="moduleSearchQuery = ''">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </div>

              <div class="category-tabs">
                @for (cat of categoryOptions; track cat.key) {
                  <button 
                    type="button" 
                    class="cat-tab" 
                    [class.active]="selectedCategoryFilter === cat.key" 
                    (click)="selectedCategoryFilter = cat.key"
                  >
                    {{ cat.label }} ({{ cat.count }})
                  </button>
                }
              </div>

              <div class="matrix-bulk-actions">
                <button type="button" class="btn-bulk" (click)="grantAllViewOnly(selectedRole)" title="Grant Read-Only View to all modules">
                  <i class="pi pi-eye"></i> View Only
                </button>
                <button type="button" class="btn-bulk" (click)="grantFullAccess(selectedRole)" title="Grant all actions across all modules">
                  <i class="pi pi-check-circle"></i> Grant All
                </button>
                <button type="button" class="btn-bulk text-danger" (click)="revokeAllPermissions(selectedRole)" title="Clear all granted privileges">
                  <i class="pi pi-ban"></i> Revoke All
                </button>
              </div>
            </div>

            <!-- PERMISSION MATRIX TABLE -->
            <div class="zeno-card matrix-card">
              <div class="matrix-table-wrap">
                <table class="zeno-table matrix-table">
                  <thead>
                    <tr>
                      <th style="min-width: 220px;">Module & Resource</th>
                      <th style="min-width: 130px;">Category</th>
                      @for (act of permissionActions; track act.key) {
                        <th style="text-align: center; width: 95px;">
                          <div class="th-action-col">
                            <span>{{ act.label }}</span>
                            <button 
                              type="button" 
                              class="btn-th-col-toggle" 
                              (click)="toggleColumnAll(selectedRole, act.key)"
                              [title]="'Toggle ' + act.label + ' column for all modules'"
                            >
                              <i class="pi pi-sort-alt"></i>
                            </button>
                          </div>
                        </th>
                      }
                      <th style="text-align: center; width: 100px;">Grant Row</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (mod of filteredPermissionModules(); track mod.key) {
                      <tr [class.row-highlight]="isModuleActive(selectedRole, mod.key)">
                        <td class="module-cell">
                          <div class="module-identity">
                            <div class="module-icon">
                              <i [class]="mod.icon || 'pi pi-folder'"></i>
                            </div>
                            <div class="module-text">
                              <span class="module-name">{{ mod.label }}</span>
                              <span class="module-key font-mono">{{ mod.key }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="category-pill" [ngClass]="'cat-' + mod.category.toLowerCase()">{{ mod.category }}</span>
                        </td>
                        @for (act of permissionActions; track act.key) {
                          <td style="text-align: center;">
                            <input 
                              type="checkbox" 
                              class="perm-checkbox"
                              [checked]="hasPermission(selectedRole, mod.key, act.key)"
                              (change)="togglePermission(selectedRole, mod.key, act.key)"
                            />
                          </td>
                        }
                        <td style="text-align: center;">
                          <button 
                            type="button" 
                            class="btn-toggle-all"
                            [class.btn-all-active]="isModuleFullyGranted(selectedRole, mod.key)"
                            (click)="toggleAllModulePermissions(selectedRole, mod.key)"
                            title="Toggle all 6 privileges for this module"
                          >
                            {{ isModuleFullyGranted(selectedRole, mod.key) ? 'Clear' : 'Toggle' }}
                          </button>
                        </td>
                      </tr>
                    }
                    @if (filteredPermissionModules().length === 0) {
                      <tr>
                        <td colspan="8" class="empty-state-cell">
                          <div class="empty-state-content">
                            <i class="pi pi-search empty-icon"></i>
                            <h4>No modules match your filter</h4>
                            <p>Adjust your search query or category filter above.</p>
                            <button class="btn-secondary btn-sm" (click)="moduleSearchQuery = ''; selectedCategoryFilter = 'ALL'">
                              Reset Filter
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- STICKY BOTTOM SAVE ACTIONS -->
            <div class="sticky-save-bar">
              <div class="save-bar-info">
                <i class="pi pi-check-circle"></i>
                <span>Role: <strong>{{ selectedRole.name }}</strong> &bull; <strong>{{ (selectedRole.permissions || []).length }}</strong> active privileges</span>
              </div>
              <div class="save-bar-actions">
                <button type="button" class="btn-secondary" (click)="backToRoleList()">Back to Roles</button>
                <button 
                  type="button" 
                  class="btn-primary" 
                  (click)="saveRolePermissions(selectedRole)" 
                  [disabled]="savingRole"
                >
                  <i class="pi pi-check"></i> {{ savingRole ? 'Saving...' : 'Save Role & Privileges' }}
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- TAB 2.5: USERS -->
      @if (activeTab === 'users') {
        <div class="zeno-card">
          <div class="card-header-flex">
            <div class="card-title">User Directory & Role Assignments ({{ users.length }})</div>
          </div>
          <div class="zeno-card-table-wrap">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th style="min-width: 200px;">Assigned Role</th>
                  <th>Status</th>
                  <th>Created On</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users; track u.id) {
                  <tr>
                    <td class="font-bold">{{ u.fullName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.phone || '—' }}</td>
                    <td>
                      <select 
                        class="user-role-select" 
                        [(ngModel)]="u.roleId"
                        (change)="changeUserRole(u, $event)"
                      >
                        <option [value]="null">-- No Role Assigned --</option>
                        <option value="">-- No Role Assigned --</option>
                        @for (r of roles; track r.id) {
                          <option [value]="r.id">{{ r.name }}</option>
                        }
                      </select>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        class="badge-pill" 
                        [ngClass]="u.isActive ? 'badge-cleared' : 'badge-cancelled'"
                        (click)="toggleUserStatus(u)"
                      >
                        {{ u.isActive ? 'Active' : 'Inactive' }}
                      </button>
                    </td>
                    <td class="font-mono text-muted">{{ u.createdAt | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: DEFAULT LEDGER MAPPINGS (3 FIELDS PER LINE) -->
      @if (activeTab === 'mappings') {
        <div class="config-sections-wrapper">
          <!-- SECTION 1: SALES & PURCHASES (3 FIELDS PER LINE) -->
          <div class="zeno-card padded-card">
            <div class="card-title">Core Sales & Purchase Accounts</div>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Default Sales Account (Income) *</label>
                <select [(ngModel)]="settings.defaultSalesLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Sales Return Account (Inward)</label>
                <select [(ngModel)]="settings.defaultSalesReturnLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Purchase Account (Expense) *</label>
                <select [(ngModel)]="settings.defaultPurchaseLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Purchase Return Account (Outward)</label>
                <select [(ngModel)]="settings.defaultPurchaseReturnLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Round-Off Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Freight & Forwarding Ledger</label>
                <select [(ngModel)]="settings.defaultFreightLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 2: GST STATUTORY TAX LEDGERS (3 FIELDS PER LINE) -->
          <div class="zeno-card padded-card">
            <div class="card-title">GST Statutory Input & Output Tax Ledgers</div>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Input CGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultCgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Output CGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultCgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Input SGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultSgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Output SGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultSgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Input IGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultIgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Output IGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultIgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Input Cess Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultCessInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Output Cess Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultCessOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Tax Round-Off Adjustment Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 3: LIQUID SETTLEMENT & ADJUSTMENTS (3 FIELDS PER LINE) -->
          <div class="zeno-card padded-card">
            <div class="card-title">Settlement Funds, Cash & Bank Accounts</div>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Default Cash-in-Hand Ledger</label>
                <select [(ngModel)]="settings.defaultCashLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Operating Bank Ledger</label>
                <select [(ngModel)]="settings.defaultBankLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Discount Allowed (Expense)</label>
                <select [(ngModel)]="settings.defaultDiscountAllowedLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Discount Received (Income)</label>
                <select [(ngModel)]="settings.defaultDiscountLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Round-Off Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Default Freight & Forwarding Ledger</label>
                <select [(ngModel)]="settings.defaultFreightLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: VOUCHER NUMBER CONFIGURATION -->
      @if (activeTab === 'vouchers') {
        <div class="zeno-card">
          <div class="card-header-flex">
            <div class="card-title">Voucher Numbering Series & Rules</div>
          </div>

          <div class="zeno-card-table-wrap">
            <table class="zeno-table">
              <thead>
                <tr>
                  <th style="min-width: 170px;">Voucher Type</th>
                  <th style="width: 110px;">Prefix</th>
                  <th style="width: 95px;">Start No.</th>
                  <th style="width: 100px;">Padding</th>
                  <th style="width: 120px;">Suffix</th>
                  <th style="width: 130px;">Reset Cycle</th>
                  <th style="width: 90px; text-align: center;">Auto</th>
                  <th style="min-width: 160px;">Live Sample Preview</th>
                </tr>
              </thead>
              <tbody>
                @for (v of voucherKeys; track v.key) {
                  <tr>
                    <td class="font-bold">
                      <div class="voucher-name-group">
                        <span class="voucher-title">{{ v.name }}</span>
                        <span class="voucher-code-badge font-mono">{{ v.key }}</span>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="table-input" 
                        [(ngModel)]="getVoucherItem(v.key).prefix" 
                        placeholder="e.g. INV-"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        class="table-input" 
                        [(ngModel)]="getVoucherItem(v.key).startingNumber" 
                        min="1"
                      />
                    </td>
                    <td>
                      <select class="table-input" [(ngModel)]="getVoucherItem(v.key).padding">
                        <option [value]="3">3 (001)</option>
                        <option [value]="4">4 (0001)</option>
                        <option [value]="5">5 (00001)</option>
                        <option [value]="6">6 (000001)</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="table-input" 
                        [(ngModel)]="getVoucherItem(v.key).suffix" 
                        placeholder="/25-26"
                      />
                    </td>
                    <td>
                      <select class="table-input" [(ngModel)]="getVoucherItem(v.key).resetFrequency">
                        <option value="YEARLY">Yearly (FY)</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="NEVER">Continuous</option>
                      </select>
                    </td>
                    <td style="text-align: center;">
                      <input 
                        type="checkbox" 
                        class="perm-checkbox" 
                        [(ngModel)]="getVoucherItem(v.key).isAuto" 
                      />
                    </td>
                    <td>
                      <span class="voucher-preview-pill font-mono">
                        {{ getVoucherPreview(v.key) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 5: SALES CONFIGURATION -->
      @if (activeTab === 'sales') {
        <div class="config-sections-wrapper">
          <!-- INVOICING & CREDIT POLICIES -->
          <div class="zeno-card padded-card">
            <div class="card-title">Sales Invoicing & Statutory Compliance</div>
            
            <div class="config-grid">
              <div class="form-group">
                <label>Default Customer Credit Period (Days)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.salesSettings.defaultCreditPeriod" 
                  placeholder="30" 
                  min="0"
                />
              </div>

              <div class="form-group">
                <label>E-Way Bill Generation Threshold (₹)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.salesSettings.ewayBillThreshold" 
                  placeholder="50000" 
                  min="0"
                />
              </div>

              <div class="form-group">
                <label>Customer Credit Limit Enforcement</label>
                <select [(ngModel)]="settings.salesSettings.creditLimitAction">
                  <option value="WARN">Show Warning Alert on Exceeding</option>
                  <option value="BLOCK">Strict Block (Prevent Invoice Creation)</option>
                  <option value="IGNORE">No Verification</option>
                </select>
              </div>

              <div class="form-group">
                <label>Default Sales Invoice Print Template</label>
                <select [(ngModel)]="settings.salesSettings.printTemplate">
                  <option value="TAX_INVOICE_GST">Standard GST Tax Invoice (A4)</option>
                  <option value="COMPACT_2COL">Compact 2-Column Template</option>
                  <option value="THERMAL_80MM">Thermal POS Receipt (80mm)</option>
                  <option value="EXPORT_INVOICE">Export & Commercial Invoice</option>
                </select>
              </div>
            </div>

            <div class="toggles-sublist">
              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Automatic Invoice Round-Off</span>
                  <span class="toggle-row-desc">Automatically round final payable amount to the nearest whole rupee</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.salesSettings.enableRoundOff" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Allow Negative Stock Invoicing</span>
                  <span class="toggle-row-desc">Permit billing and dispatch even if warehouse quantity is zero or negative</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.salesSettings.allowNegativeStockSale" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Allow Billing Below Purchase Cost</span>
                  <span class="toggle-row-desc">Permit selling prices lower than latest acquisition cost / moving average</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.salesSettings.allowSalesBelowCost" />
                  <span class="slider round"></span>
                </label>
              </div>
            </div>

            <div class="form-group full-width-field" style="margin-top: 18px;">
              <label>Default Terms & Conditions (Appended on Invoices)</label>
              <textarea 
                rows="3" 
                [(ngModel)]="settings.salesSettings.termsAndConditions"
                placeholder="Enter standard commercial terms..."
              ></textarea>
            </div>
          </div>
        </div>
      }

      <!-- TAB 6: PURCHASE CONFIGURATION -->
      @if (activeTab === 'purchase') {
        <div class="config-sections-wrapper">
          <div class="zeno-card padded-card">
            <div class="card-title">Procurement Policies & Verification</div>
            
            <div class="config-grid">
              <div class="form-group">
                <label>PO Approval Authority Threshold (₹)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.purchaseSettings.poApprovalThreshold" 
                  placeholder="100000" 
                  min="0"
                />
              </div>

              <div class="form-group">
                <label>Maximum Price Variance Tolerance (%)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.purchaseSettings.strictPriceVariancePercent" 
                  placeholder="5" 
                  min="0" 
                  max="100"
                />
              </div>

              <div class="form-group">
                <label>Default Vendor Credit Period (Days)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.purchaseSettings.defaultVendorCreditDays" 
                  placeholder="30" 
                  min="0"
                />
              </div>
            </div>

            <div class="toggles-sublist">
              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Enforce Three-Way Matching (PO ↔ GRN ↔ Bill)</span>
                  <span class="toggle-row-desc">Block vendor bill posting if quantities exceed verified warehouse GRN counts</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.purchaseSettings.enforceThreeWayMatch" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Auto-Generate GRN on Purchase Order Approval</span>
                  <span class="toggle-row-desc">Automatically create pending warehouse receiving document when PO is issued</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.purchaseSettings.autoGrnFromPo" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Auto-Generate Vendor Bill on GRN Completion</span>
                  <span class="toggle-row-desc">Draft purchase invoice immediately upon complete physical receiving</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.purchaseSettings.autoInvoiceFromGrn" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Auto ITC Reversal on Debit Notes</span>
                  <span class="toggle-row-desc">Automatically debit GST Input Tax Credit when generating purchase returns</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.purchaseSettings.debitNoteAutoItcReversal" />
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 7: INVENTORY CONFIGURATION -->
      @if (activeTab === 'inventory') {
        <div class="config-sections-wrapper">
          <div class="zeno-card padded-card">
            <div class="card-title">Warehouse & Inventory Management Controls</div>
            
            <div class="config-grid">
              <div class="form-group">
                <label>Default Stock Valuation Method</label>
                <select [(ngModel)]="settings.inventorySettings.valuationMethod">
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="WEIGHTED_AVG">Weighted Average Cost (WAC)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Negative Stock Enforcement</label>
                <select [(ngModel)]="settings.inventorySettings.allowNegativeStock">
                  <option [ngValue]="false">Strict Block (Prevent negative stock)</option>
                  <option [ngValue]="true">Allowed with Warning Notification</option>
                </select>
              </div>
            </div>

            <div class="toggles-sublist">
              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Mandatory Batch & Lot Tracking</span>
                  <span class="toggle-row-desc">Require batch number and manufacturing date on all warehouse receipts</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.inventorySettings.mandatoryBatchTracking" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Mandatory Serial / IMEI Number Tracking</span>
                  <span class="toggle-row-desc">Enforce unique individual serial tracking for high-value items</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.inventorySettings.mandatorySerialNumber" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Auto-Generate Product Barcodes</span>
                  <span class="toggle-row-desc">Automatically create unique EAN-13 barcodes when creating new items</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.inventorySettings.autoGenerateBarcodes" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Low Stock Alert Notifications</span>
                  <span class="toggle-row-desc">Notify storekeeper when stock falls below minimum reorder point</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.inventorySettings.lowStockAlertEnabled" />
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-card-row">
                <div class="toggle-row-info">
                  <span class="toggle-row-title">Two-Step Godown Transfer Verification</span>
                  <span class="toggle-row-desc">Require dispatch and receipt confirmation for multi-branch warehouse transfers</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="settings.inventorySettings.godownTransferVerification" />
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 8: GST & TAX MANAGEMENT (COMBINED HIERARCHY + SLABS IN SAME PAGE WITH TABS) -->
      @if (activeTab === 'gst' || activeTab === 'taxes') {
        <div class="roles-container">
          <!-- SUB-NAV: HIERARCHY VS SLABS MASTER -->
          <div class="roles-subnav-bar">
            <div class="subnav-pills">
              <button 
                class="subnav-pill" 
                [class.active]="gstSubTab === 'hierarchy'" 
                (click)="gstSubTab = 'hierarchy'"
              >
                <i class="pi pi-sitemap"></i> GST Resolution Hierarchy
              </button>
              <button 
                class="subnav-pill" 
                [class.active]="gstSubTab === 'slabs'" 
                (click)="gstSubTab = 'slabs'"
              >
                <i class="pi pi-percentage"></i> Tax Slabs Master ({{ taxMasters.length }})
              </button>
            </div>
            @if (gstSubTab === 'slabs') {
              <button class="btn-primary" (click)="openTaxModal()">
                <i class="pi pi-plus"></i> Add Tax Slab
              </button>
            }
          </div>

          <!-- SUB-MODE 1: GST RESOLUTION HIERARCHY -->
          @if (gstSubTab === 'hierarchy') {
            <div class="zeno-card padded-card">
              <div class="card-title">GST Active Resolution Hierarchy</div>

              <div class="gst-levels-grid">
                <div 
                  class="level-card" 
                  [class.selected]="settings.gstActiveLevel === 'COMPANY'"
                  (click)="settings.gstActiveLevel = 'COMPANY'"
                >
                  <div class="radio-indicator">
                    <i class="pi" [ngClass]="settings.gstActiveLevel === 'COMPANY' ? 'pi-check-circle' : 'pi-circle'"></i>
                  </div>
                  <div class="level-info">
                    <span class="level-title">Company Level</span>
                    <span class="level-badge badge-company">Global Fallback</span>
                    <p>Flat tax slab applied globally to all transactions unless overridden.</p>
                  </div>
                </div>

                <div 
                  class="level-card" 
                  [class.selected]="settings.gstActiveLevel === 'ITEM_GROUP'"
                  (click)="settings.gstActiveLevel = 'ITEM_GROUP'"
                >
                  <div class="radio-indicator">
                    <i class="pi" [ngClass]="settings.gstActiveLevel === 'ITEM_GROUP' ? 'pi-check-circle' : 'pi-circle'"></i>
                  </div>
                  <div class="level-info">
                    <span class="level-title">Item Group Level</span>
                    <span class="level-badge badge-group">Recommended for Retail</span>
                    <p>Tax slab assigned by category group (e.g. Raw Materials, Electronics, Apparel).</p>
                  </div>
                </div>

                <div 
                  class="level-card" 
                  [class.selected]="settings.gstActiveLevel === 'ITEM_CATEGORY'"
                  (click)="settings.gstActiveLevel = 'ITEM_CATEGORY'"
                >
                  <div class="radio-indicator">
                    <i class="pi" [ngClass]="settings.gstActiveLevel === 'ITEM_CATEGORY' ? 'pi-check-circle' : 'pi-circle'"></i>
                  </div>
                  <div class="level-info">
                    <span class="level-title">Item Category Level</span>
                    <span class="level-badge badge-category">Mid Granularity</span>
                    <p>Specific sub-categories inherit standardized statutory GST rates.</p>
                  </div>
                </div>

                <div 
                  class="level-card" 
                  [class.selected]="settings.gstActiveLevel === 'ITEM'"
                  (click)="settings.gstActiveLevel = 'ITEM'"
                >
                  <div class="radio-indicator">
                    <i class="pi" [ngClass]="settings.gstActiveLevel === 'ITEM' ? 'pi-check-circle' : 'pi-circle'"></i>
                  </div>
                  <div class="level-info">
                    <span class="level-title">Item Master Level (Default)</span>
                    <span class="level-badge badge-item">Maximum Precision</span>
                    <p>Every individual SKU defines its own HSN Code, GST %, and Cess %.</p>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <!-- SUB-MODE 2: TAX SLABS MASTER -->
            <div class="zeno-card">
              <div class="card-header-flex">
                <div class="card-title">Statutory GST Tax Slabs</div>
              </div>

              <div class="zeno-card-table-wrap">
                <table class="zeno-table">
                  <thead>
                    <tr>
                      <th>Tax Slab Name</th>
                      <th>Total Rate (%)</th>
                      <th>CGST Rate</th>
                      <th>SGST Rate</th>
                      <th>IGST Rate</th>
                      <th>Cess Rate</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tax of taxMasters; track tax.id) {
                      <tr>
                        <td class="font-bold">{{ tax.taxName }}</td>
                        <td><span class="badge-pill badge-rate">{{ tax.taxRate }}%</span></td>
                        <td>{{ tax.cgstRate || (tax.taxRate / 2) }}%</td>
                        <td>{{ tax.sgstRate || (tax.taxRate / 2) }}%</td>
                        <td>{{ tax.igstRate || tax.taxRate }}%</td>
                        <td>{{ tax.cessRate || 0 }}%</td>
                        <td class="text-muted">{{ tax.description || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: COMPANY PROFILE (TABBED CONFIGURATION) -->
      @if (activeTab === 'company') {
        <div class="company-profile-wrapper">
          <!-- SUB-TABS NAVIGATION -->
          <div class="company-subnav-tabs">
            <button 
              type="button" 
              class="subnav-tab" 
              [class.active]="companySubTab === 'basic'" 
              (click)="companySubTab = 'basic'"
            >
              <i class="pi pi-id-card"></i>
              <span>Basic Details</span>
            </button>
            <button 
              type="button" 
              class="subnav-tab" 
              [class.active]="companySubTab === 'address'" 
              (click)="companySubTab = 'address'"
            >
              <i class="pi pi-map-marker"></i>
              <span>Address Details</span>
            </button>
            <button 
              type="button" 
              class="subnav-tab" 
              [class.active]="companySubTab === 'gst'" 
              (click)="companySubTab = 'gst'"
            >
              <i class="pi pi-percentage"></i>
              <span>GST & Tax Registration</span>
            </button>
            <button 
              type="button" 
              class="subnav-tab" 
              [class.active]="companySubTab === 'contact'" 
              (click)="companySubTab = 'contact'"
            >
              <i class="pi pi-phone"></i>
              <span>Contact Information</span>
            </button>
            <button 
              type="button" 
              class="subnav-tab" 
              [class.active]="companySubTab === 'logo'" 
              (click)="companySubTab = 'logo'"
            >
              <i class="pi pi-image"></i>
              <span>Logo & Branding</span>
            </button>
          </div>

          <!-- TAB 1: BASIC DETAILS -->
          @if (companySubTab === 'basic') {
            <div class="zeno-card padded-card">
              <div class="card-title">Basic Organizational Information</div>

              <div class="form-grid-2col">
                <div class="form-group">
                  <label>Company Legal Name <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.legalName" 
                    placeholder="e.g. Apex Technologies Private Limited" 
                  />
                </div>

                <div class="form-group">
                  <label>Trade / Brand Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.tradeName" 
                    placeholder="e.g. Apex Tech" 
                  />
                </div>

                <div class="form-group">
                  <label>Company Code <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.code" 
                    placeholder="e.g. APEX-01" 
                    class="font-mono uppercase" 
                  />
                </div>

                <div class="form-group">
                  <label>Business Entity Type</label>
                  <select [(ngModel)]="companyForm.businessType">
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                    <option value="Trust / Society / Non-Profit">Trust / Society / Non-Profit</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Financial Year Starts From <span class="required">*</span></label>
                  <input 
                    type="date" 
                    [(ngModel)]="companyForm.financialYearStart" 
                  />
                </div>

                <div class="form-group">
                  <label>Financial Year Ends On <span class="required">*</span></label>
                  <input 
                    type="date" 
                    [(ngModel)]="companyForm.financialYearEnd" 
                  />
                </div>

                <div class="form-group">
                  <label>Books Begin From <span class="required">*</span></label>
                  <input 
                    type="date" 
                    [(ngModel)]="companyForm.booksBeginFrom" 
                  />
                </div>

                <div class="form-group">
                  <label>Base Currency Code</label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.currencyCode" 
                    placeholder="INR" 
                    class="font-mono" 
                  />
                </div>
              </div>
            </div>
          }

          <!-- TAB 2: ADDRESS DETAILS -->
          @if (companySubTab === 'address') {
            <div class="addresses-layout-grid">
              <!-- BILLING ADDRESS CARD -->
              <div class="zeno-card padded-card">
                <div class="card-title"><i class="pi pi-home"></i> Registered Billing Address</div>

                <div class="form-grid-4col">
                  <div class="form-group">
                    <label>Address Line 1 <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.billingAddress.addressLine1" 
                      placeholder="Floor, Building, Plot / Street Number" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Address Line 2</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.billingAddress.addressLine2" 
                      placeholder="Landmark, Area, Industrial Zone" 
                    />
                  </div>

                  <div class="form-group">
                    <label>City <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.billingAddress.city" 
                      placeholder="e.g. Mumbai" 
                    />
                  </div>

                  <div class="form-group">
                    <label>State <span class="required">*</span></label>
                    <select [(ngModel)]="companyForm.billingAddress.state" (change)="onCompanyBillingStateChange()">
                      <option value="">-- Select State --</option>
                      @for (s of indianStates; track s.code) {
                        <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Pincode / Postal Code <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.billingAddress.pincode" 
                      placeholder="e.g. 400021" 
                      class="font-mono" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Country</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.billingAddress.country" 
                      placeholder="India" 
                    />
                  </div>
                </div>
              </div>

              <!-- SHIPPING ADDRESS CARD -->
              <div class="zeno-card padded-card">
                <div class="card-header-flex">
                  <div class="card-title"><i class="pi pi-truck"></i> Primary Shipping / Plant Address</div>
                  <button type="button" class="btn-secondary btn-sm" (click)="copyBillingToShipping()">
                    <i class="pi pi-copy"></i> Copy from Billing
                  </button>
                </div>

                <div class="form-grid-4col">
                  <div class="form-group">
                    <label>Address Line 1 <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.shippingAddress.addressLine1" 
                      placeholder="Gate / Warehouse, Plot / Sector" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Address Line 2</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.shippingAddress.addressLine2" 
                      placeholder="Industrial Area, Logistic Park" 
                    />
                  </div>

                  <div class="form-group">
                    <label>City <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.shippingAddress.city" 
                      placeholder="e.g. Navi Mumbai" 
                    />
                  </div>

                  <div class="form-group">
                    <label>State <span class="required">*</span></label>
                    <select [(ngModel)]="companyForm.shippingAddress.state">
                      <option value="">-- Select State --</option>
                      @for (s of indianStates; track s.code) {
                        <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Pincode / Postal Code <span class="required">*</span></label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.shippingAddress.pincode" 
                      placeholder="e.g. 410208" 
                      class="font-mono" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Country</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.shippingAddress.country" 
                      placeholder="India" 
                    />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- TAB 3: GST & TAX REGISTRATION -->
          @if (companySubTab === 'gst') {
            <div class="zeno-card padded-card">
              <div class="card-title">GST & Statutory Tax Identifiers</div>

              <div class="form-grid-2col">
                <div class="form-group">
                  <label>GST Registration Type</label>
                  <select [(ngModel)]="companyForm.gstRegistrationType">
                    <option value="Regular">Regular / Normal Taxpayer</option>
                    <option value="Composition">Composition Scheme</option>
                    <option value="SEZ Unit">SEZ Unit (Zero Rated)</option>
                    <option value="SEZ Developer">SEZ Developer</option>
                    <option value="Deemed Export / EOU">Deemed Export / EOU</option>
                    <option value="Unregistered">Unregistered Entity</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>GSTIN (15-Digit GST Identification Number) <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.gstin" 
                    placeholder="27AABCU9603R1ZM" 
                    maxlength="15" 
                    class="font-mono uppercase font-bold" 
                  />
                </div>

                <div class="form-group">
                  <label>Permanent Account Number (PAN) <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.pan" 
                    placeholder="AABCU9603R" 
                    maxlength="10" 
                    class="font-mono uppercase font-bold" 
                  />
                </div>

                <div class="form-group">
                  <label>Jurisdiction State & State Code</label>
                  <select [(ngModel)]="companyForm.stateName">
                    <option value="">-- Select Jurisdiction State --</option>
                    @for (s of indianStates; track s.code) {
                      <option [value]="s.name + ' (' + s.code + ')'">{{ s.name }} ({{ s.code }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>GST Return Filing Frequency</label>
                  <select [(ngModel)]="companyForm.filingFrequency">
                    <option value="Monthly">Monthly (GSTR-1, GSTR-3B)</option>
                    <option value="Quarterly (QRMP)">Quarterly (QRMP Scheme with monthly IFF)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>TAN Number</label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.tanNumber" 
                    placeholder="e.g. MUMA12345E" 
                    class="font-mono uppercase" 
                  />
                </div>
              </div>
            </div>
          }

          <!-- TAB 4: CONTACT INFORMATION -->
          @if (companySubTab === 'contact') {
            <div class="zeno-card padded-card">
              <div class="card-title">Corporate Contact & Communication Directory</div>

              <div class="form-grid-2col">
                <div class="form-group">
                  <label>Primary Contact Person <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.contactDetails.contactPerson" 
                    placeholder="e.g. Rajesh Sharma" 
                  />
                </div>

                <div class="form-group">
                  <label>Official Accounts / Finance Email <span class="required">*</span></label>
                  <input 
                    type="email" 
                    [(ngModel)]="companyForm.contactDetails.email" 
                    placeholder="e.g. finance@apextechnologies.com" 
                  />
                </div>

                <div class="form-group">
                  <label>Primary Phone / Mobile <span class="required">*</span></label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.contactDetails.phone" 
                    placeholder="e.g. +91 98200 12345" 
                  />
                </div>

                <div class="form-group">
                  <label>Alternate / Landline Helpline</label>
                  <input 
                    type="text" 
                    [(ngModel)]="companyForm.contactDetails.alternatePhone" 
                    placeholder="e.g. 022-28493921" 
                  />
                </div>

                <div class="form-group">
                  <label>Official Corporate Website</label>
                  <input 
                    type="url" 
                    [(ngModel)]="companyForm.contactDetails.website" 
                    placeholder="e.g. https://www.apextechnologies.com" 
                  />
                </div>
              </div>
            </div>
          }

          <!-- TAB 5: LOGO & BRANDING -->
          @if (companySubTab === 'logo') {
            <div class="zeno-card padded-card">
              <div class="card-title">Logo, Brand Identity & Invoice Letterhead</div>

              <div class="branding-layout">
                <!-- LOGO PREVIEW BOX -->
                <div class="logo-preview-card">
                  <div class="logo-box">
                    @if (companyForm.logoUrl) {
                      <img [src]="companyForm.logoUrl" alt="Company Logo" class="logo-img" />
                    } @else {
                      <div class="logo-placeholder">
                        <i class="pi pi-building" style="font-size: 2.5rem; color: var(--primary-600);"></i>
                        <span>No Logo Set</span>
                      </div>
                    }
                  </div>
                  <div class="logo-meta">
                    <strong>{{ companyForm.legalName || 'Apex Technologies' }}</strong>
                    <span class="text-muted">{{ companyForm.extraDetails?.tagline || 'Enterprise ERP Profile' }}</span>
                  </div>
                </div>

                <!-- LOGO UPLOAD & BRANDING CONTROLS -->
                <div class="logo-controls">
                  <div class="form-group">
                    <label>Upload Company Logo</label>
                    <div 
                      class="logo-upload-dropzone" 
                      (click)="logoFileInput.click()"
                      (dragover)="$event.preventDefault()"
                      (drop)="onLogoDrop($event)"
                    >
                      <input 
                        #logoFileInput 
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" 
                        (change)="onLogoFileSelected($event)" 
                        style="display: none;" 
                      />
                      <div class="upload-icon-circle">
                        <i class="pi pi-cloud-upload"></i>
                      </div>
                      <div class="upload-texts">
                        <span class="upload-title">Click to upload logo or drag and drop</span>
                        <span class="upload-subtitle">PNG, JPG, SVG, or WEBP (Max 2MB)</span>
                      </div>
                    </div>

                    @if (companyForm.logoUrl) {
                      <div class="upload-actions">
                        <button type="button" class="btn-secondary btn-sm" (click)="logoFileInput.click()">
                          <i class="pi pi-upload"></i> Change Image
                        </button>
                        <button type="button" class="btn-secondary btn-sm text-danger" (click)="companyForm.logoUrl = ''">
                          <i class="pi pi-trash"></i> Remove Logo
                        </button>
                      </div>
                    }
                  </div>

                  <div class="form-group">
                    <label>Brand Tagline / Slogan</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyForm.extraDetails.tagline" 
                      placeholder="e.g. Engineered for Precision & Reliability" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Print Invoice Header Note</label>
                    <textarea 
                      rows="2" 
                      [(ngModel)]="companyForm.extraDetails.invoiceHeaderNote" 
                      placeholder="e.g. ISO 9001:2015 Certified Manufacturing Facility"
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label>Print Invoice Footer Declaration & Jurisdiction</label>
                    <textarea 
                      rows="2" 
                      [(ngModel)]="companyForm.extraDetails.invoiceFooterNote" 
                      placeholder="e.g. Certified that all particulars are true and correct. Subject to local jurisdiction."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: BRANCH MASTER (UNDER SETTINGS) -->
      @if (activeTab === 'branches') {
        <div class="warehouses-page-view">
          <!-- STATS / KPI SUMMARY CARDS -->
          <div class="warehouse-stats-grid">
            <div class="kpi-card">
              <div class="kpi-icon-wrap primary">
                <i class="pi pi-sitemap"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ branches.length }}</div>
                <div class="kpi-label">Registered Branches</div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap custom">
                <i class="pi pi-building"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ getHeadOfficeBranch()?.branchName || 'Main Branch' }}</div>
                <div class="kpi-label">Head Office (HQ)</div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap users">
                <i class="pi pi-warehouse"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ warehouses.length }}</div>
                <div class="kpi-label">Associated Godowns</div>
              </div>
            </div>
          </div>

          <!-- TOOLBAR: SEARCH & ADD -->
          <div class="warehouse-toolbar zeno-card">
            <div class="search-input-wrap">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="branchSearchQuery" 
                placeholder="Search branches by name, code, state, or address..." 
              />
              @if (branchSearchQuery) {
                <button class="clear-search-btn" (click)="branchSearchQuery = ''">
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>

            <button class="btn-primary" (click)="openCreateBranchModal()">
              <i class="pi pi-plus"></i> Add New Branch
            </button>
          </div>

          <!-- BRANCHES TABLE -->
          <div class="zeno-card warehouse-table-card">
            <div class="table-responsive">
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th style="min-width: 220px;">Branch Name & Code</th>
                    <th style="min-width: 140px;">Type / Status</th>
                    <th style="min-width: 180px;">State & Jurisdiction</th>
                    <th style="min-width: 260px;">Physical Address</th>
                    <th style="min-width: 130px; text-align: center;">Linked Godowns</th>
                    <th style="min-width: 110px; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @if (filteredBranches.length === 0) {
                    <tr>
                      <td colspan="6" class="text-center py-8 text-muted">
                        <i class="pi pi-sitemap" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                        No branches found matching your search.
                      </td>
                    </tr>
                  }
                  @for (b of filteredBranches; track b.id) {
                    <tr>
                      <td>
                        <div class="warehouse-cell">
                          <div class="wh-icon"><i class="pi pi-building"></i></div>
                          <div>
                            <strong class="wh-name">{{ b.branchName }}</strong>
                            <div class="wh-code font-mono">{{ b.branchCode }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        @if (b.isHeadOffice) {
                          <span class="badge-pill badge-system font-bold">
                            <i class="pi pi-star-fill"></i> Head Office
                          </span>
                        } @else {
                          <span class="badge-pill badge-custom">
                            <i class="pi pi-circle-fill" style="font-size: 0.5rem;"></i> Branch Office
                          </span>
                        }
                      </td>
                      <td>
                        <div class="branch-state-cell">
                          <span class="state-name-text">{{ b.stateName || 'Maharashtra' }}</span>
                          <span class="state-code-badge font-mono">{{ b.stateCode || '27' }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="wh-address">
                          {{ b.addressLine1 || '—' }}
                          @if (b.pincode) {
                            <div class="text-xs text-muted font-mono">PIN: {{ b.pincode }}</div>
                          }
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge-pill badge-primary">
                          <i class="pi pi-warehouse"></i> {{ getGodownsCountForBranch(b.id) }} Godowns
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons-wrap">
                          <button class="btn-icon" (click)="openEditBranchModal(b)" title="Edit Branch">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button class="btn-icon text-danger" (click)="openDeleteBranchModal(b)" title="Delete Branch" [disabled]="b.isHeadOffice && branches.length === 1">
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- MODAL: CREATE NEW BRANCH -->
          @if (createBranchModalVisible) {
            <div class="modal-backdrop">
              <div class="modal-dialog">
                <div class="modal-header">
                  <h3>Add New Company Branch</h3>
                  <button class="close-btn" (click)="createBranchModalVisible = false"><i class="pi pi-times"></i></button>
                </div>
                <div class="modal-body">
                  <div class="form-group">
                    <label>Branch Name <span class="required">*</span></label>
                    <input type="text" [(ngModel)]="newBranch.branchName" placeholder="e.g. Pune Regional Branch, Delhi Logistics Hub" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Branch Code <span class="required">*</span></label>
                      <input type="text" [(ngModel)]="newBranch.branchCode" placeholder="e.g. BR-PUN" class="font-mono uppercase" />
                    </div>
                    <div class="form-group">
                      <label>State <span class="required">*</span></label>
                      <select [(ngModel)]="newBranch.stateName" (change)="onNewBranchStateChange()">
                        @for (s of indianStates; track s.code) {
                          <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                        }
                      </select>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>State Code</label>
                      <input type="text" [(ngModel)]="newBranch.stateCode" class="font-mono" placeholder="27" />
                    </div>
                    <div class="form-group">
                      <label>Pincode / Postal Code</label>
                      <input type="text" [(ngModel)]="newBranch.pincode" placeholder="e.g. 411001" class="font-mono" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Street / Building Address</label>
                    <input type="text" [(ngModel)]="newBranch.addressLine1" placeholder="Plot / Suite / Landmark / Area" />
                  </div>
                  <div class="form-group flex-center-start" style="padding-top: 12px;">
                    <label class="switch-inline">
                      <input type="checkbox" [(ngModel)]="newBranch.isHeadOffice" />
                      <span>Primary Head Office (Corporate HQ)</span>
                    </label>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn-secondary" (click)="createBranchModalVisible = false">Cancel</button>
                  <button class="btn-primary" (click)="submitCreateBranch()" [disabled]="savingBranch || !newBranch.branchName.trim() || !newBranch.branchCode.trim()">
                    <i class="pi pi-check"></i> {{ savingBranch ? 'Saving...' : 'Save Branch' }}
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- MODAL: EDIT BRANCH -->
          @if (editBranchModalVisible && branchToEdit) {
            <div class="modal-backdrop">
              <div class="modal-dialog">
                <div class="modal-header">
                  <h3>Edit Branch Information</h3>
                  <button class="close-btn" (click)="editBranchModalVisible = false"><i class="pi pi-times"></i></button>
                </div>
                <div class="modal-body">
                  <div class="form-group">
                    <label>Branch Name <span class="required">*</span></label>
                    <input type="text" [(ngModel)]="branchToEdit.branchName" placeholder="Branch Name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Branch Code <span class="required">*</span></label>
                      <input type="text" [(ngModel)]="branchToEdit.branchCode" placeholder="Code" class="font-mono uppercase" />
                    </div>
                    <div class="form-group">
                      <label>State <span class="required">*</span></label>
                      <select [(ngModel)]="branchToEdit.stateName" (change)="onEditBranchStateChange()">
                        @for (s of indianStates; track s.code) {
                          <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                        }
                      </select>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>State Code</label>
                      <input type="text" [(ngModel)]="branchToEdit.stateCode" class="font-mono" placeholder="27" />
                    </div>
                    <div class="form-group">
                      <label>Pincode / Postal Code</label>
                      <input type="text" [(ngModel)]="branchToEdit.pincode" placeholder="Pincode" class="font-mono" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Street / Building Address</label>
                    <input type="text" [(ngModel)]="branchToEdit.addressLine1" placeholder="Address" />
                  </div>
                  <div class="form-group flex-center-start" style="padding-top: 12px;">
                    <label class="switch-inline">
                      <input type="checkbox" [(ngModel)]="branchToEdit.isHeadOffice" />
                      <span>Primary Head Office (Corporate HQ)</span>
                    </label>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn-secondary" (click)="editBranchModalVisible = false">Cancel</button>
                  <button class="btn-primary" (click)="submitEditBranch()" [disabled]="savingBranch || !branchToEdit.branchName.trim() || !branchToEdit.branchCode.trim()">
                    <i class="pi pi-check"></i> {{ savingBranch ? 'Updating...' : 'Save Changes' }}
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- MODAL: CONFIRM DELETE BRANCH -->
          @if (deleteBranchModalVisible && branchToDelete) {
            <div class="modal-backdrop">
              <div class="modal-dialog">
                <div class="modal-header">
                  <h3>Delete Branch</h3>
                  <button class="close-btn" (click)="deleteBranchModalVisible = false"><i class="pi pi-times"></i></button>
                </div>
                <div class="modal-body">
                  <div class="delete-dialog-content">
                    <i class="pi pi-exclamation-triangle warning-icon"></i>
                    <div>
                      <p>Are you sure you want to delete branch <strong>{{ branchToDelete.branchName }} ({{ branchToDelete.branchCode }})</strong>?</p>
                      <p class="text-sm text-muted">This branch has {{ getGodownsCountForBranch(branchToDelete.id) }} associated godown(s). Deleting it will permanently remove the branch record.</p>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn-secondary" (click)="deleteBranchModalVisible = false">Cancel</button>
                  <button class="btn-danger" (click)="confirmDeleteBranch()" [disabled]="savingBranch">
                    <i class="pi pi-trash"></i> {{ savingBranch ? 'Deleting...' : 'Confirm Delete' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: WAREHOUSE MASTER (AFTER COMPANY PROFILE) -->
      @if (activeTab === 'warehouses') {
        <div class="warehouses-page-view">
          <!-- STATS / KPI SUMMARY CARDS -->
          <div class="warehouse-stats-grid">
            <div class="kpi-card">
              <div class="kpi-icon-wrap primary">
                <i class="pi pi-warehouse"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ warehouses.length }}</div>
                <div class="kpi-label">Total Warehouses / Godowns</div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap custom">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ getActiveWarehousesCount() }}</div>
                <div class="kpi-label">Active Storage Facilities</div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap users">
                <i class="pi pi-sitemap"></i>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ getUniqueBranchesCount() }}</div>
                <div class="kpi-label">Associated Branches</div>
              </div>
            </div>
          </div>

          <!-- TOOLBAR: SEARCH & BRANCH FILTER -->
          <div class="warehouse-toolbar zeno-card">
            <div class="search-input-wrap">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="warehouseSearchQuery" 
                placeholder="Search warehouse by name, code, city, or contact..." 
              />
              @if (warehouseSearchQuery) {
                <button class="clear-search-btn" (click)="warehouseSearchQuery = ''">
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>

            <div class="warehouse-filters">
              <label><i class="pi pi-filter"></i> Branch:</label>
              <select [(ngModel)]="warehouseBranchFilter">
                <option value="ALL">All Branches</option>
                @for (b of tenant.branches(); track b.id) {
                  <option [value]="b.id">{{ b.branchName }} ({{ b.branchCode }})</option>
                }
              </select>
            </div>
          </div>

          <!-- WAREHOUSES TABLE -->
          <div class="zeno-card warehouse-table-card">
            <div class="table-responsive">
              <table class="zeno-table">
                <thead>
                  <tr>
                    <th style="min-width: 220px;">Warehouse / Godown</th>
                    <th style="min-width: 160px;">Linked Branch</th>
                    <th style="min-width: 240px;">Physical Address</th>
                    <th style="min-width: 180px;">Contact Person</th>
                    <th style="min-width: 100px;">Status</th>
                    <th style="min-width: 110px; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @if (filteredWarehouses.length === 0) {
                    <tr>
                      <td colspan="6" class="text-center py-8 text-muted">
                        <i class="pi pi-warehouse" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                        No warehouses or storage facilities matched the criteria.
                      </td>
                    </tr>
                  }
                  @for (wh of filteredWarehouses; track wh.id) {
                    <tr>
                      <td>
                        <div class="warehouse-cell">
                          <div class="wh-icon"><i class="pi pi-box"></i></div>
                          <div>
                            <strong class="wh-name">{{ wh.name }}</strong>
                            <div class="wh-code font-mono">{{ wh.code }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge-pill badge-primary">
                          <i class="pi pi-map-marker"></i> {{ wh.branch?.branchName || 'Main Branch' }}
                        </span>
                      </td>
                      <td>
                        <div class="wh-address">
                          {{ wh.address || '—' }}
                          @if (wh.city || wh.pincode) {
                            <div class="text-xs text-muted">{{ wh.city }} {{ wh.state }} {{ wh.pincode }}</div>
                          }
                        </div>
                      </td>
                      <td>
                        <div>{{ wh.contactPerson || '—' }}</div>
                        @if (wh.contactPhone) {
                          <div class="text-xs font-mono text-muted">{{ wh.contactPhone }}</div>
                        }
                      </td>
                      <td>
                        <span class="badge-pill" [class.badge-active]="wh.isActive" [class.badge-inactive]="!wh.isActive">
                          {{ wh.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons-wrap">
                          <button class="btn-icon" (click)="openEditWarehouseModal(wh)" title="Edit Warehouse">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button class="btn-icon text-danger" (click)="openDeleteWarehouseModal(wh)" title="Delete Warehouse">
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MODAL: CREATE NEW WAREHOUSE -->
        @if (createWarehouseModalVisible) {
          <div class="modal-backdrop">
            <div class="modal-dialog">
              <div class="modal-header">
                <h3>Add New Warehouse / Godown</h3>
                <button class="close-btn" (click)="createWarehouseModalVisible = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label>Warehouse Name <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="newWarehouse.name" placeholder="e.g. Central Finished Goods Warehouse" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Warehouse Code <span class="required">*</span></label>
                    <input type="text" [(ngModel)]="newWarehouse.code" placeholder="e.g. WH-01" class="font-mono uppercase" />
                  </div>
                  <div class="form-group">
                    <label>Associated Branch <span class="required">*</span></label>
                    <select [(ngModel)]="newWarehouse.branchId">
                      @for (b of tenant.branches(); track b.id) {
                        <option [value]="b.id">{{ b.branchName }} ({{ b.branchCode }})</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Address Line</label>
                  <input type="text" [(ngModel)]="newWarehouse.address" placeholder="Plot / Shed / Logistic Hub Address" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>City</label>
                    <input type="text" [(ngModel)]="newWarehouse.city" placeholder="e.g. Mumbai" />
                  </div>
                  <div class="form-group">
                    <label>State</label>
                    <select [(ngModel)]="newWarehouse.state">
                      <option value="">-- Select State --</option>
                      @for (s of indianStates; track s.code) {
                        <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" [(ngModel)]="newWarehouse.pincode" placeholder="e.g. 400072" class="font-mono" />
                  </div>
                  <div class="form-group">
                    <label>Contact Person</label>
                    <input type="text" [(ngModel)]="newWarehouse.contactPerson" placeholder="Godown Manager Name" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Contact Phone</label>
                    <input type="text" [(ngModel)]="newWarehouse.contactPhone" placeholder="+91 98000 00000" />
                  </div>
                  <div class="form-group flex-center-start" style="padding-top: 24px;">
                    <label class="switch-inline">
                      <input type="checkbox" [(ngModel)]="newWarehouse.isActive" />
                      <span>Active Storage Facility</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" (click)="createWarehouseModalVisible = false">Cancel</button>
                <button class="btn-primary" (click)="submitCreateWarehouse()" [disabled]="savingWarehouse || !newWarehouse.name.trim() || !newWarehouse.code.trim()">
                  <i class="pi pi-check"></i> {{ savingWarehouse ? 'Creating...' : 'Save Warehouse' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL: EDIT WAREHOUSE -->
        @if (editWarehouseModalVisible && warehouseToEdit) {
          <div class="modal-backdrop">
            <div class="modal-dialog">
              <div class="modal-header">
                <h3>Edit Warehouse Information</h3>
                <button class="close-btn" (click)="editWarehouseModalVisible = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label>Warehouse Name <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="warehouseToEdit.name" placeholder="Warehouse Name" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Warehouse Code <span class="required">*</span></label>
                    <input type="text" [(ngModel)]="warehouseToEdit.code" placeholder="Code" class="font-mono uppercase" />
                  </div>
                  <div class="form-group">
                    <label>Associated Branch</label>
                    <select [(ngModel)]="warehouseToEdit.branchId">
                      @for (b of tenant.branches(); track b.id) {
                        <option [value]="b.id">{{ b.branchName }} ({{ b.branchCode }})</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Address</label>
                  <input type="text" [(ngModel)]="warehouseToEdit.address" placeholder="Address" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>City</label>
                    <input type="text" [(ngModel)]="warehouseToEdit.city" placeholder="City" />
                  </div>
                  <div class="form-group">
                    <label>State</label>
                    <select [(ngModel)]="warehouseToEdit.state">
                      <option value="">-- Select State --</option>
                      @for (s of indianStates; track s.code) {
                        <option [value]="s.name">{{ s.name }} ({{ s.code }})</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" [(ngModel)]="warehouseToEdit.pincode" placeholder="Pincode" class="font-mono" />
                  </div>
                  <div class="form-group">
                    <label>Contact Person</label>
                    <input type="text" [(ngModel)]="warehouseToEdit.contactPerson" placeholder="Contact Person" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Contact Phone</label>
                    <input type="text" [(ngModel)]="warehouseToEdit.contactPhone" placeholder="Phone" />
                  </div>
                  <div class="form-group flex-center-start" style="padding-top: 24px;">
                    <label class="switch-inline">
                      <input type="checkbox" [(ngModel)]="warehouseToEdit.isActive" />
                      <span>Active Storage Facility</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" (click)="editWarehouseModalVisible = false">Cancel</button>
                <button class="btn-primary" (click)="submitEditWarehouse()" [disabled]="savingWarehouse || !warehouseToEdit.name.trim()">
                  <i class="pi pi-check"></i> {{ savingWarehouse ? 'Updating...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL: CONFIRM DELETE WAREHOUSE -->
        @if (deleteWarehouseModalVisible && warehouseToDelete) {
          <div class="modal-backdrop">
            <div class="modal-dialog">
              <div class="modal-header">
                <h3>Delete Warehouse</h3>
                <button class="close-btn" (click)="deleteWarehouseModalVisible = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                <div class="delete-dialog-content">
                  <i class="pi pi-exclamation-triangle warning-icon"></i>
                  <div>
                    <p>Are you sure you want to delete warehouse <strong>{{ warehouseToDelete.name }} ({{ warehouseToDelete.code }})</strong>?</p>
                    <p class="text-sm text-muted">This will remove the godown definition from branch listings. Note that historical vouchers will retain their audit records.</p>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" (click)="deleteWarehouseModalVisible = false">Cancel</button>
                <button class="btn-danger" (click)="confirmDeleteWarehouse()" [disabled]="savingWarehouse">
                  <i class="pi pi-trash"></i> {{ savingWarehouse ? 'Deleting...' : 'Confirm Delete' }}
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- MODAL: EDIT ROLE DETAILS -->
      @if (editRoleModalVisible && editingRole) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Edit Role Information</h3>
              <button class="close-btn" (click)="editRoleModalVisible = false"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Role Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="editingRole.name" 
                  [disabled]="editingRole.isSystem" 
                  placeholder="Role Name *" 
                />
              </div>
              <div class="form-group">
                <label>Functional Duties / Description</label>
                <textarea 
                  rows="3" 
                  [(ngModel)]="editingRole.description" 
                  placeholder="Specify functional duties, reporting hierarchy, and notes..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="editRoleModalVisible = false">Cancel</button>
              <button class="btn-primary" (click)="submitEditRole()" [disabled]="savingRole || !editingRole.name.trim()">
                <i class="pi pi-check"></i> {{ savingRole ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CONFIRM DELETE CUSTOM ROLE -->
      @if (deleteRoleModalVisible && roleToDelete) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Delete Custom Role</h3>
              <button class="close-btn" (click)="deleteRoleModalVisible = false"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="delete-dialog-content">
                <div class="delete-icon-wrap">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div>
                  <p class="delete-msg">
                    Are you sure you want to delete role <strong>"{{ roleToDelete.name }}"</strong>?
                  </p>
                  @if (getUserCountForRole(roleToDelete.id) > 0) {
                    <div class="user-warning-box">
                      <i class="pi pi-users"></i>
                      <span>Warning: <strong>{{ getUserCountForRole(roleToDelete.id) }}</strong> active user(s) currently assigned to this role will lose these privileges.</span>
                    </div>
                  }
                  <p class="delete-subtext">This action cannot be undone. All custom permission mappings associated with this role will be permanently removed.</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="deleteRoleModalVisible = false">Cancel</button>
              <button class="btn-primary btn-danger-action" (click)="deleteRoleConfirmed()" [disabled]="deletingRole">
                <i class="pi pi-trash"></i> {{ deletingRole ? 'Deleting...' : 'Confirm Delete' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: ADD USER -->
      @if (showNewUserModal) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Add Authorized User</h3>
              <button class="close-btn" (click)="showNewUserModal = false"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" [(ngModel)]="newUser.fullName" placeholder="e.g. John Doe" />
              </div>
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="newUser.email" placeholder="john.doe@company.com" />
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" [(ngModel)]="newUser.phone" placeholder="+91 98765 43210" />
              </div>
              <div class="form-group">
                <label>Assign Role *</label>
                <select [(ngModel)]="newUser.roleId">
                  <option value="">-- Select Functional Role --</option>
                  @for (r of roles; track r.id) {
                    <option [value]="r.id">{{ r.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showNewUserModal = false">Cancel</button>
              <button class="btn-primary" (click)="submitNewUser()">Add User</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: ADD TAX SLAB -->
      @if (showTaxModal) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Create New GST Tax Slab</h3>
              <button class="close-btn" (click)="showTaxModal = false"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Tax Slab Name *</label>
                <input type="text" [(ngModel)]="newTax.taxName" placeholder="e.g. GST 18%, GST Exempt" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Total Rate (%) *</label>
                  <input type="number" step="0.01" [(ngModel)]="newTax.rate" placeholder="18.00" />
                </div>
                <div class="form-group">
                  <label>Cess Rate (%)</label>
                  <input type="number" step="0.01" [(ngModel)]="newTax.cessRate" placeholder="0.00" />
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" [(ngModel)]="newTax.description" placeholder="Standard rate for goods and taxable services..." />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showTaxModal = false">Cancel</button>
              <button class="btn-primary" (click)="submitTaxMaster()">Save Tax Slab</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 0;
      font-size: 0.875rem;
      animation: fadeIn 0.15s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .alert-success {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      animation: fadeIn 0.2s ease-in;
    }

    .header-back-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-back {
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      border-radius: var(--radius-sm);
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin: 0;
      }
    }

    .padded-card {
      padding: 24px;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--surface-900);
      margin-bottom: 16px;
    }

    .card-description {
      display: none;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--surface-200);

      .card-title { margin-bottom: 0; }
    }

    .padded-card .card-header-flex {
      padding: 0 0 14px 0;
      margin-bottom: 16px;
    }

    .card-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Buttons */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-600);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover:not(:disabled) {
        background: var(--primary-700);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.btn-sm {
        padding: 5px 12px;
        font-size: 0.8125rem;
      }
    }

    .btn-secondary {
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;

      &:hover {
        background: var(--surface-200);
      }
    }

    /* Toggles Grid */
    .toggle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .toggle-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      background: var(--surface-0);
      transition: all 0.15s ease;

      &.enabled {
        border-color: var(--primary-300);
        background: #f8fafc;
      }
    }

    .toggle-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .toggle-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background: var(--surface-100);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .toggle-title {
      font-weight: 600;
      color: var(--surface-900);
      font-size: 0.9375rem;
      margin-bottom: 2px;
    }

    .toggle-desc {
      font-size: 0.75rem;
      color: var(--surface-500);
      max-width: 250px;
      line-height: 1.35;
    }

    .toggle-switch-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .toggle-status-text {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
    }

    /* Switch Styling */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--surface-300);
      transition: 0.2s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    input:checked + .slider {
      background-color: var(--primary-600);
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    /* Roles & Permissions */
    .roles-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .roles-subnav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-200);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .subnav-pills {
      display: flex;
      gap: 8px;
    }

    .subnav-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      color: var(--surface-600);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      i {
        font-size: 0.9rem;
      }

      &:hover {
        background: var(--surface-100);
        color: var(--surface-900);
      }

      &.active {
        background: var(--primary-50);
        color: var(--primary-700);
        border-color: var(--primary-200);
        font-weight: 700;
      }
    }

    /* =========================================================
       USER ROLES & PERMISSIONS DESIGN SYSTEM
       ========================================================= */
    .roles-list-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* KPI Summary Cards Grid */
    .roles-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-subtle);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary-300);
        transform: translateY(-2px);
        box-shadow: var(--shadow-card);
      }

      &.kpi-selected {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 1px var(--primary-500);
        background: #f8fbff;
      }
    }

    .kpi-icon-wrap {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.primary {
        background: #eff6ff;
        color: #2563eb;
      }

      &.system {
        background: #f1f5f9;
        color: #475569;
      }

      &.custom {
        background: #ecfdf5;
        color: #059669;
      }

      &.users {
        background: #faf5ff;
        color: #9333ea;
      }
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--surface-900);
      line-height: 1.1;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 3px;
    }

    /* Roles Toolbar */
    .roles-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 20px;
      flex-wrap: wrap;
    }

    .search-input-wrap {
      position: relative;
      flex: 1;
      min-width: 240px;
      max-width: 380px;

      i.pi-search {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--surface-400);
        font-size: 0.875rem;
      }

      input {
        width: 100%;
        padding: 8px 32px 8px 34px;
        font-size: 0.8125rem;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        background: #ffffff;
        color: var(--surface-900);

        &:focus {
          border-color: var(--primary-500);
          outline: none;
        }
      }

      .clear-search-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--surface-400);
        cursor: pointer;
        font-size: 0.75rem;
        padding: 4px;

        &:hover {
          color: var(--surface-700);
        }
      }
    }

    .filter-pills-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-pill {
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-200);
      background: var(--surface-50);
      color: var(--surface-600);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-100);
        color: var(--surface-800);
      }

      &.active {
        background: var(--primary-600);
        color: #ffffff;
        border-color: var(--primary-600);
      }
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
    }

    /* Roles Table Card */
    .roles-table-card {
      padding: 0;
      overflow: hidden;
    }

    .roles-table-wrap {
      overflow-x: auto;
    }

    .roles-table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: var(--surface-50);
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--surface-600);
        padding: 12px 16px;
        border-bottom: 1px solid var(--surface-200);
        letter-spacing: 0.04em;
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--surface-100);
        font-size: 0.8125rem;
        vertical-align: middle;
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .role-row {
      transition: background 0.15s ease;

      &:hover {
        background: #fbfcfe;
      }
    }

    .role-cell-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      background: #eff6ff;
      color: #2563eb;
      flex-shrink: 0;

      &.system {
        background: #f1f5f9;
        color: #475569;
      }
    }

    .role-text-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .role-row-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--surface-900);
    }

    .badge-system {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.625rem;
      font-weight: 700;
      background: var(--surface-100);
      color: var(--surface-700);
      border: 1px solid var(--surface-200);
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      width: fit-content;
    }

    .badge-custom {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.625rem;
      font-weight: 700;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      width: fit-content;
    }

    .role-row-desc {
      font-size: 0.8125rem;
      color: var(--surface-600);
      margin: 0;
      line-height: 1.4;
      max-width: 360px;
    }

    .privilege-coverage-cell {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-width: 200px;
    }

    .privilege-count-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .priv-count {
      color: var(--surface-700);
      strong {
        color: var(--surface-900);
      }
    }

    .priv-pct {
      font-weight: 700;
      color: var(--primary-600);
    }

    .priv-progress-bar {
      height: 6px;
      background: var(--surface-100);
      border-radius: 999px;
      overflow: hidden;
    }

    .priv-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .priv-categories-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 2px;
    }

    .cat-micro-tag {
      font-size: 0.625rem;
      font-weight: 600;
      background: var(--surface-100);
      color: var(--surface-600);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .users-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--surface-500);
      padding: 4px 10px;
      background: var(--surface-100);
      border-radius: var(--radius-full);

      &.has-users {
        color: #0369a1;
        background: #f0f9ff;
      }
    }

    .role-actions-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-action-primary {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #2563eb;
        color: #ffffff;
        border-color: #2563eb;
      }
    }

    .btn-action-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      font-size: 0.8125rem;
      background: var(--surface-50);
      color: var(--surface-600);
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }
    }

    .btn-action-danger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      font-size: 0.8125rem;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #dc2626;
        color: #ffffff;
        border-color: #dc2626;
      }
    }

    .empty-state-cell {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .empty-icon {
        font-size: 2.25rem;
        color: var(--surface-400);
        margin-bottom: 4px;
      }

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--surface-800);
      }

      p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--surface-500);
      }
    }

    /* Sub-nav / Breadcrumb */
    .view-subnav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      margin-bottom: 16px;
      box-shadow: var(--shadow-subtle);
    }

    .btn-subnav-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 600;
      background: var(--surface-100);
      color: var(--surface-700);
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }
    }

    .subnav-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .subnav-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--surface-900);
    }

    /* Role Create & Edit Cards */
    .role-create-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 24px;
    }

    .role-permissions-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 72px; /* for sticky bottom bar */
    }

    .role-form-card,
    .role-edit-header-card {
      padding: 20px 24px;
      background: #ffffff;
    }

    .role-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 14px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .role-header-content {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .role-meta-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .role-privilege-summary-bar {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 14px;
      background: var(--surface-50);
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-200);
    }

    .summary-stat {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .stat-number {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-600);
    }

    .stat-text {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-600);
    }

    .summary-progress {
      height: 6px;
      background: var(--surface-200);
      border-radius: 999px;
      overflow: hidden;
    }

    .summary-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    /* Matrix Toolbar */
    .matrix-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 20px;
      flex-wrap: wrap;
    }

    .matrix-search {
      position: relative;
      flex: 1;
      min-width: 220px;
      max-width: 340px;

      i.pi-search {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--surface-400);
        font-size: 0.875rem;
      }

      input {
        width: 100%;
        padding: 8px 30px 8px 34px;
        font-size: 0.8125rem;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);

        &:focus {
          border-color: var(--primary-500);
          outline: none;
        }
      }

      .clear-search-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--surface-400);
        cursor: pointer;
        padding: 4px;
      }
    }

    .category-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .cat-tab {
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-200);
      background: var(--surface-50);
      color: var(--surface-600);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-100);
        color: var(--surface-800);
      }

      &.active {
        background: var(--primary-600);
        color: #ffffff;
        border-color: var(--primary-600);
      }
    }

    .matrix-bulk-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-bulk {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--surface-100);
      color: var(--surface-700);
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }

      &.text-danger {
        color: #dc2626;
        border-color: #fecaca;
        background: #fef2f2;

        &:hover {
          background: #dc2626;
          color: #ffffff;
        }
      }
    }

    /* Matrix Card & Table */
    .matrix-card,
    .matrix-editor-card {
      padding: 20px 24px;
      background: #ffffff;
    }

    .matrix-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      margin-top: 12px;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: var(--surface-50);
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--surface-600);
        padding: 10px 12px;
        border-bottom: 1px solid var(--surface-200);
        letter-spacing: 0.04em;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--surface-100);
        font-size: 0.8125rem;
        vertical-align: middle;
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .th-action-col {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .btn-th-col-toggle {
      background: none;
      border: none;
      color: var(--surface-400);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.75rem;

      &:hover {
        color: var(--primary-600);
        background: var(--surface-200);
      }
    }

    .module-cell {
      display: flex;
      align-items: center;
    }

    .module-identity {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .module-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      background: var(--surface-100);
      color: var(--surface-700);
      flex-shrink: 0;
    }

    .module-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .module-name {
      font-weight: 600;
      color: var(--surface-900);
      font-size: 0.8125rem;
    }

    .module-key {
      font-size: 0.625rem;
      color: var(--surface-400);
    }

    .category-pill {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--surface-600);
      background: var(--surface-100);
      padding: 3px 9px;
      border-radius: var(--radius-full);
      white-space: nowrap;
      border: 1px solid transparent;

      &.cat-masters {
        background: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
      }
      &.cat-transactions {
        background: #ecfdf5;
        color: #047857;
        border-color: #a7f3d0;
      }
      &.cat-reports {
        background: #f5f3ff;
        color: #6d28d9;
        border-color: #ddd6fe;
      }
      &.cat-administration {
        background: #fffbeb;
        color: #b45309;
        border-color: #fde68a;
      }
    }

    .branch-state-cell {
      display: flex;
      align-items: center;
      gap: 6px;

      .state-name-text {
        font-weight: 500;
        color: var(--surface-800);
      }

      .state-code-badge {
        font-size: 0.6875rem;
        background: var(--surface-100);
        color: var(--surface-600);
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
        border: 1px solid var(--surface-200);
      }
    }

    .perm-checkbox {
      width: 17px;
      height: 17px;
      accent-color: var(--primary-600);
      cursor: pointer;
    }

    .btn-toggle-all {
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
      }

      &.btn-all-active {
        background: #ecfdf5;
        color: #047857;
        border-color: #a7f3d0;
      }
    }

    .row-highlight {
      background: #fafcfe;
    }

    /* Sticky Bottom Save Bar */
    .sticky-save-bar {
      position: fixed;
      bottom: 0;
      left: 240px;
      right: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-top: 1px solid var(--surface-200);
      padding: 14px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
    }

    .save-bar-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--surface-700);

      i {
        font-size: 1.125rem;
        color: var(--primary-600);
      }
    }

    .save-bar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Delete Dialog Content */
    .delete-dialog-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 8px 0;
    }

    .delete-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .delete-msg {
      font-size: 0.9375rem;
      color: var(--surface-900);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .user-warning-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-sm);
      color: #b45309;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .delete-subtext {
      font-size: 0.75rem;
      color: var(--surface-500);
      line-height: 1.4;
      margin: 0;
    }

    .btn-danger-action {
      background: #dc2626 !important;
      border-color: #dc2626 !important;

      &:hover {
        background: #b91c1c !important;
        border-color: #b91c1c !important;
      }
    }

    /* User Directory Table */
    .user-role-select {
      padding: 5px 10px;
      font-size: 0.8125rem;
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      background: #ffffff;
      color: var(--surface-800);
      font-weight: 500;
    }

    .badge-pill {
      border: none;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease;

      &:hover {
        opacity: 0.85;
      }
    }

    .badge-cleared {
      background: #dcfce7;
      color: #15803d;
    }

    .badge-cancelled {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Form & Section Wrappers */
    .config-sections-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-weight: 600;
        font-size: 0.8125rem;
        color: var(--surface-800);
      }

      input, select, textarea {
        padding: 8px 12px;
        font-size: 0.8125rem;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        background: #ffffff;
        color: var(--surface-800);

        &:focus {
          border-color: var(--primary-500);
          outline: none;
          box-shadow: 0 0 0 2px var(--primary-100);
        }
      }
    }

    .full-width-field {
      grid-column: 1 / -1;
    }

    .voucher-name-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .voucher-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-800);
    }

    .voucher-code-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      background: var(--surface-100);
      color: var(--surface-600);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .table-input {
      width: 100%;
      padding: 6px 10px;
      font-size: 0.8125rem;
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      background: #ffffff;

      &:focus {
        border-color: var(--primary-500);
        outline: none;
      }
    }

    .voucher-preview-pill {
      display: inline-block;
      padding: 4px 10px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.8125rem;
    }

    /* Config Sections */
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .toggles-sublist {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-200);
    }

    .toggle-card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
    }

    .toggle-row-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toggle-row-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--surface-800);
    }

    .toggle-row-desc {
      font-size: 0.75rem;
      color: var(--surface-500);
    }

    /* GST Levels Grid */
    .gst-levels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .level-card {
      display: flex;
      gap: 14px;
      padding: 18px;
      border-radius: var(--radius-md);
      background: var(--surface-0);
      border: 2px solid var(--surface-200);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--primary-300);
      }

      &.selected {
        border-color: var(--primary-600);
        background: #f0f7ff;
      }

      .radio-indicator {
        font-size: 1.25rem;
        color: var(--primary-600);
        margin-top: 2px;
      }

      .level-title {
        font-weight: 700;
        font-size: 0.9375rem;
        color: var(--surface-900);
        display: block;
        margin-bottom: 4px;
      }

      .level-badge {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        margin-bottom: 8px;

        &.badge-company { background: #e0e7ff; color: #3730a3; }
        &.badge-group { background: #dbeafe; color: #1e40af; }
        &.badge-category { background: #fef3c7; color: #92400e; }
        &.badge-item { background: #d1fae5; color: #065f46; }
      }

      p {
        font-size: 0.8125rem;
        color: var(--surface-600);
        line-height: 1.4;
      }
    }

    /* STRICT 3 FIELDS PER ROW ON DEFAULT LEDGER MAPPING PAGE */
    .mapping-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .mapping-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    @media (max-width: 640px) {
      .mapping-grid {
        grid-template-columns: 1fr !important;
      }
    }

    .helper-text {
      display: none;
    }

    .badge-rate {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
    }

    /* Company Profile Grid */
    .company-profile-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 640px) {
      .company-profile-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: var(--surface-50);
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-200);

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .profile-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--surface-500);
    }

    .profile-value {
      font-size: 0.9375rem;
      color: var(--surface-800);
      font-weight: 500;

      &.bold {
        font-weight: 700;
        color: var(--surface-900);
      }
    }

    .code-badge {
      font-family: monospace;
      font-weight: 600;
      color: var(--primary-700);
      background: var(--primary-50);
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      width: fit-content;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      animation: fadeIn 0.15s ease-in;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      overflow: hidden;
      border: 1px solid var(--surface-200);
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--surface-200);

      h3 {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--surface-900);
      }

      .close-btn {
        background: transparent;
        border: none;
        color: var(--surface-500);
        cursor: pointer;
        font-size: 1rem;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);

        &:hover {
          background: var(--surface-100);
          color: var(--surface-900);
        }
      }
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      padding: 14px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--surface-50);
      border-top: 1px solid var(--surface-200);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Company Sub-tabs */
    .company-profile-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .company-subnav-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-200);
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .subnav-tab {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      color: var(--surface-600);
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.15s ease;

      i { font-size: 0.875rem; color: var(--surface-400); }

      &:hover {
        background: var(--surface-100);
        color: var(--surface-900);
      }

      &.active {
        background: var(--primary-50);
        color: var(--primary-700);
        border-color: var(--primary-200);
        i { color: var(--primary-600); }
      }
    }

    .form-grid-2col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px 24px;
      margin-top: 16px;
    }

    .form-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 14px;
    }

    .field-hint {
      display: none;
    }

    .addresses-layout-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    .form-grid-4col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px 20px;
      margin-top: 16px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    /* Branding & Logo */
    .branding-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 28px;
      margin-top: 16px;
      align-items: start;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .logo-preview-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      background: var(--surface-50);
      text-align: center;
    }

    .logo-box {
      width: 220px;
      height: 120px;
      padding: 10px;
      border-radius: var(--radius-md);
      border: 2px dashed var(--surface-300);
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }

    .logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .logo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--surface-400);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .logo-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      strong { font-size: 0.95rem; color: var(--surface-900); }
    }

    .logo-controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .logo-upload-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 24px 16px;
      border: 2px dashed var(--surface-300);
      border-radius: var(--radius-md);
      background: var(--surface-50);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;

      &:hover {
        border-color: var(--primary-500);
        background: var(--primary-50);

        .upload-icon-circle {
          background: var(--primary-600);
          color: #ffffff;
        }
      }
    }

    .upload-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--surface-200);
      color: var(--surface-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.2s ease;
    }

    .upload-texts {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .upload-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--surface-800);
    }

    .upload-subtitle {
      font-size: 0.75rem;
      color: var(--surface-500);
    }

    .upload-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    /* Warehouse Master Styles */
    .warehouses-page-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .warehouse-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .warehouse-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-200);

      @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .warehouse-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-600);

      select {
        padding: 6px 12px;
        border: 1px solid var(--surface-300);
        border-radius: var(--radius-sm);
        background: #ffffff;
        font-size: 0.8125rem;
        outline: none;
      }
    }

    .warehouse-table-card {
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-200);
      overflow: hidden;
    }

    .warehouse-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wh-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .wh-name {
      font-size: 0.875rem;
      color: var(--surface-900);
      display: block;
    }

    .wh-code {
      font-size: 0.72rem;
      color: var(--surface-500);
    }

    .wh-address {
      font-size: 0.8125rem;
      color: var(--surface-700);
      line-height: 1.4;
    }

    .badge-active {
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
    }

    .badge-inactive {
      background: #f1f5f9;
      color: #64748b;
      font-weight: 700;
    }

    .switch-inline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--surface-800);
      cursor: pointer;
    }

    .delete-dialog-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 10px 0;

      .warning-icon {
        font-size: 2rem;
        color: #dc2626;
      }
    }
  `],
})
export class SettingsComponent implements OnInit {
  readonly indianStates = INDIAN_STATES;
  activeTab: 'company' | 'branches' | 'warehouses' | 'toggles' | 'roles' | 'users' | 'mappings' | 'vouchers' | 'sales' | 'purchase' | 'inventory' | 'gst' | 'taxes' = 'company';
  gstSubTab: 'hierarchy' | 'slabs' = 'hierarchy';
  companySubTab: 'basic' | 'address' | 'gst' | 'contact' | 'logo' = 'basic';
  saving = false;
  savingCompany = false;
  savingWarehouse = false;
  saveSuccess = false;
  saveMessage = '';

  companyForm: any = {
    legalName: '',
    tradeName: '',
    code: '',
    businessType: 'Private Limited Company',
    financialYearStart: '2025-04-01',
    financialYearEnd: '2026-03-31',
    booksBeginFrom: '2025-04-01',
    currencyCode: 'INR',
    gstRegistrationType: 'Regular',
    gstin: '',
    pan: '',
    stateName: 'Maharashtra (27)',
    filingFrequency: 'Monthly',
    tanNumber: '',
    arnNumber: '',
    billingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    shippingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    contactDetails: {
      contactPerson: '',
      email: '',
      phone: '',
      alternatePhone: '',
      website: '',
    },
    logoUrl: '/zeno-books-logo.png',
    extraDetails: {
      tagline: 'Precision Accounting & Financial ERP',
      invoiceHeaderNote: '',
      invoiceFooterNote: '',
    },
  };

  // Branch Master State
  branches: any[] = [];
  branchSearchQuery: string = '';
  createBranchModalVisible = false;
  editBranchModalVisible = false;
  deleteBranchModalVisible = false;
  branchToEdit: any = null;
  branchToDelete: any = null;
  savingBranch = false;

  newBranch: any = {
    branchName: '',
    branchCode: '',
    stateCode: '27',
    stateName: 'Maharashtra',
    addressLine1: '',
    pincode: '',
    isHeadOffice: false,
  };

  // Warehouse Master State
  warehouses: any[] = [];
  warehouseSearchQuery: string = '';
  warehouseBranchFilter: string = 'ALL';
  createWarehouseModalVisible = false;
  editWarehouseModalVisible = false;
  deleteWarehouseModalVisible = false;
  warehouseToEdit: any = null;
  warehouseToDelete: any = null;

  newWarehouse: any = {
    name: '',
    code: '',
    branchId: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    contactPhone: '',
    isActive: true,
  };

  get currentCompany() {
    return this.tenant.currentCompany();
  }

  get currentBranch() {
    return this.tenant.currentBranch();
  }

  get companyDisplayName(): string {
    const c = this.currentCompany;
    if (c) {
      return c.legalName || c.tradeName || c.name || 'Apex Technologies Pvt Ltd';
    }
    const all = this.tenant.companies();
    if (all && all.length > 0) {
      return all[0].legalName || all[0].tradeName || all[0].name || 'Apex Technologies Pvt Ltd';
    }
    return 'Apex Technologies Pvt Ltd';
  }

  get branchDisplayName(): string {
    const b = this.currentBranch;
    if (b) {
      return b.branchName || b.name || 'Main Branch (HQ)';
    }
    const all = this.tenant.branches();
    if (all && all.length > 0) {
      return all[0].branchName || all[0].name || 'Main Branch (HQ)';
    }
    return 'Main Branch (HQ)';
  }

  get branchCodeDisplay(): string {
    const b = this.currentBranch;
    return b?.branchCode || b?.code || 'HQ-01';
  }

  get companyGstin(): string {
    return this.currentCompany?.gstin || this.tenant.companies()?.[0]?.gstin || '27AABCU9603R1ZM';
  }

  get companyPan(): string {
    return this.currentCompany?.pan || this.tenant.companies()?.[0]?.pan || 'AABCU9603R';
  }

  get branchState(): string {
    const b = this.currentBranch;
    return b?.stateName ? `${b.stateName} (${b.stateCode || '27'})` : 'Maharashtra (27)';
  }

  get branchAddress(): string {
    const b = this.currentBranch;
    return b?.addressLine1 ? `${b.addressLine1}${b.pincode ? ' - ' + b.pincode : ''}` : 'Corporate Headquarters, Nariman Point, Mumbai - 400021';
  }

  settings: any = {
    gstActiveLevel: 'ITEM',
    defaultPurchaseLedgerId: null,
    defaultSalesLedgerId: null,
    defaultSalesReturnLedgerId: null,
    defaultPurchaseReturnLedgerId: null,
    defaultCgstInputLedgerId: null,
    defaultSgstInputLedgerId: null,
    defaultIgstInputLedgerId: null,
    defaultCgstOutputLedgerId: null,
    defaultSgstOutputLedgerId: null,
    defaultIgstOutputLedgerId: null,
    defaultCessInputLedgerId: null,
    defaultCessOutputLedgerId: null,
    defaultCashLedgerId: null,
    defaultBankLedgerId: null,
    defaultDiscountLedgerId: null,
    defaultDiscountAllowedLedgerId: null,
    defaultRoundOffLedgerId: null,
    defaultFreightLedgerId: null,
    voucherConfig: {},
    salesSettings: {},
    purchaseSettings: {},
    inventorySettings: {},
  };

  // Pre-seed all system capability toggles including Sales Order & Delivery Challan
  toggles: any[] = [
    { featureKey: 'GST', isEnabled: true },
    { featureKey: 'PURCHASE_ORDER', isEnabled: true },
    { featureKey: 'GRN', isEnabled: true },
    { featureKey: 'SALES_ORDER', isEnabled: true },
    { featureKey: 'DELIVERY_CHALLAN', isEnabled: true },
    { featureKey: 'VARIANTS', isEnabled: true },
    { featureKey: 'RACK_BIN', isEnabled: true },
    { featureKey: 'MANUFACTURING', isEnabled: true },
    { featureKey: 'STOCK_TRANSFER', isEnabled: true },
    { featureKey: 'STOCK_ADJUSTMENT', isEnabled: true },
    { featureKey: 'PRICE_LIST', isEnabled: true },
  ];

  taxMasters: any[] = [];
  ledgers: any[] = [];

  // Roles & Permissions state
  roles: any[] = [];
  users: any[] = [];
  selectedRole: any = null;
  roleViewMode: 'list' | 'permissions' | 'create' = 'list';
  roleSearchQuery: string = '';
  roleTypeFilter: 'all' | 'system' | 'custom' = 'all';
  moduleSearchQuery: string = '';
  selectedCategoryFilter: string = 'ALL';
  createBaseRoleId: string = '';
  savingRole = false;
  showNewRoleModal = false;
  newRole: any = { name: '', description: '', permissions: [] };
  showNewUserModal = false;
  newUser = { fullName: '', email: '', phone: '', roleId: '' };

  editRoleModalVisible = false;
  editingRole: any = { id: '', name: '', description: '', isSystem: false };
  deleteRoleModalVisible = false;
  roleToDelete: any = null;
  deletingRole = false;

  showTaxModal = false;
  newTax: any = {
    taxName: '',
    rate: 18,
    cessRate: 0,
    description: '',
  };

  voucherKeys = [
    { key: 'PO', name: 'Purchase Order' },
    { key: 'GRN', name: 'Goods Receipt Note' },
    { key: 'PI', name: 'Purchase Invoice' },
    { key: 'PR', name: 'Purchase Return' },
    { key: 'VP', name: 'Vendor Payment' },
    { key: 'SO', name: 'Sales Order' },
    { key: 'DC', name: 'Delivery Challan' },
    { key: 'SI', name: 'Sales Invoice' },
    { key: 'SR', name: 'Sales Return' },
    { key: 'CR', name: 'Customer Receipt' },
    { key: 'PAYMENT', name: 'Payment Voucher' },
    { key: 'RECEIPT', name: 'Receipt Voucher' },
    { key: 'CONTRA', name: 'Contra Voucher' },
    { key: 'JOURNAL', name: 'Journal Voucher' },
    { key: 'DEBIT_NOTE', name: 'Debit Note' },
    { key: 'CREDIT_NOTE', name: 'Credit Note' },
    { key: 'PRODUCTION', name: 'Production Entry' },
    { key: 'BOM', name: 'Bill of Materials' },
  ];

  defaultVoucherConfigs: Record<string, any> = {
    PO: { prefix: 'PO-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    GRN: { prefix: 'GRN-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    PI: { prefix: 'PI-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    PR: { prefix: 'PR-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    VP: { prefix: 'VP-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    SO: { prefix: 'SO-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    DC: { prefix: 'DC-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    SI: { prefix: 'INV-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    SR: { prefix: 'SR-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    CR: { prefix: 'RCP-', suffix: '/25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    PAYMENT: { prefix: 'PAY/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    RECEIPT: { prefix: 'REC/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    CONTRA: { prefix: 'CTR/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    JOURNAL: { prefix: 'JRN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    DEBIT_NOTE: { prefix: 'DN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    CREDIT_NOTE: { prefix: 'CN/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    PRODUCTION: { prefix: 'PRD/', suffix: '25-26', startingNumber: 1, padding: 4, resetFrequency: 'YEARLY', isAuto: true },
    BOM: { prefix: 'BOM/', suffix: '', startingNumber: 1, padding: 3, resetFrequency: 'NEVER', isAuto: true },
  };

  permissionModules = [
    // Masters
    { key: 'LEDGER_GROUP', label: 'Ledger Groups', category: 'Masters', icon: 'pi pi-sitemap' },
    { key: 'LEDGER', label: 'Ledgers', category: 'Masters', icon: 'pi pi-file-edit' },
    { key: 'ITEM', label: 'Products & SKUs', category: 'Masters', icon: 'pi pi-tags' },
    { key: 'ITEM_GROUP', label: 'Stock Groups', category: 'Masters', icon: 'pi pi-folder' },
    { key: 'ITEM_CATEGORY', label: 'Stock Categories', category: 'Masters', icon: 'pi pi-tag' },
    { key: 'UNIT', label: 'Units of Measure', category: 'Masters', icon: 'pi pi-compass' },
    { key: 'VARIANT', label: 'Item Variants', category: 'Masters', icon: 'pi pi-sliders-v', featureKey: 'VARIANTS' },
    { key: 'RACK_BIN', label: 'Rack & Bin Locations', category: 'Masters', icon: 'pi pi-th-large', featureKey: 'RACK_BIN' },

    // Transactions - Procure to Pay
    { key: 'PURCHASE_ORDER', label: 'Purchase Orders', category: 'Transactions', icon: 'pi pi-shopping-bag', featureKey: 'PURCHASE_ORDER' },
    { key: 'GOODS_RECEIPT_NOTE', label: 'Goods Receipt (GRN)', category: 'Transactions', icon: 'pi pi-box', featureKey: 'GRN' },
    { key: 'PURCHASE_INVOICE', label: 'Purchase Invoices', category: 'Transactions', icon: 'pi pi-file' },
    { key: 'PURCHASE_RETURN', label: 'Purchase Returns', category: 'Transactions', icon: 'pi pi-replay' },
    { key: 'VENDOR_PAYMENT', label: 'Vendor Payments', category: 'Transactions', icon: 'pi pi-credit-card' },

    // Transactions - Order to Cash (Sales)
    { key: 'SALES_ORDER', label: 'Sales Orders', category: 'Transactions', icon: 'pi pi-shopping-cart', featureKey: 'SALES_ORDER' },
    { key: 'DELIVERY_CHALLAN', label: 'Delivery Challans', category: 'Transactions', icon: 'pi pi-truck', featureKey: 'DELIVERY_CHALLAN' },
    { key: 'SALES_INVOICE', label: 'Sales Invoices', category: 'Transactions', icon: 'pi pi-receipt' },
    { key: 'SALES_RETURN', label: 'Sales Returns', category: 'Transactions', icon: 'pi pi-backward' },
    { key: 'CUSTOMER_RECEIPT', label: 'Customer Receipts', category: 'Transactions', icon: 'pi pi-wallet' },

    // Transactions - Accounting Vouchers
    { key: 'PAYMENT_VOUCHER', label: 'Payment Vouchers', category: 'Transactions', icon: 'pi pi-arrow-circle-up' },
    { key: 'RECEIPT_VOUCHER', label: 'Receipt Vouchers', category: 'Transactions', icon: 'pi pi-arrow-circle-down' },
    { key: 'CONTRA_VOUCHER', label: 'Contra Vouchers', category: 'Transactions', icon: 'pi pi-sync' },
    { key: 'JOURNAL_VOUCHER', label: 'Journal Vouchers', category: 'Transactions', icon: 'pi pi-book' },
    { key: 'DEBIT_NOTE', label: 'Debit Notes', category: 'Transactions', icon: 'pi pi-file-export' },
    { key: 'CREDIT_NOTE', label: 'Credit Notes', category: 'Transactions', icon: 'pi pi-file-import' },

    // Transactions - Inventory & Warehouse
    { key: 'STOCK_TRANSFER', label: 'Stock Transfers', category: 'Transactions', icon: 'pi pi-arrows-h', featureKey: 'STOCK_TRANSFER' },
    { key: 'STOCK_ADJUSTMENT', label: 'Stock Adjustments', category: 'Transactions', icon: 'pi pi-sliders-h', featureKey: 'STOCK_ADJUSTMENT' },
    { key: 'STOCK_OPENING_BALANCE', label: 'Opening Stock Balance', category: 'Transactions', icon: 'pi pi-calendar-plus' },
    { key: 'PRICE_LIST', label: 'Price Lists & Multi-Tier Pricing', category: 'Transactions', icon: 'pi pi-percentage', featureKey: 'PRICE_LIST' },

    // Transactions - Manufacturing
    { key: 'BOM', label: 'Bills of Materials (BOM)', category: 'Transactions', icon: 'pi pi-list', featureKey: 'MANUFACTURING' },
    { key: 'PRODUCTION', label: 'Production Entries', category: 'Transactions', icon: 'pi pi-cog', featureKey: 'MANUFACTURING' },

    // Reports
    { key: 'REPORTS', label: 'Financial & Audit Reports', category: 'Reports', icon: 'pi pi-chart-line' },

    // Administration
    { key: 'SETTINGS', label: 'System Settings', category: 'Administration', icon: 'pi pi-cog' },
    { key: 'BRANCH', label: 'Branches & Locations', category: 'Administration', icon: 'pi pi-building' },
    { key: 'GODOWN', label: 'Godowns & Warehouses', category: 'Administration', icon: 'pi pi-warehouse' },
    { key: 'ROLES', label: 'Roles & Privileges', category: 'Administration', icon: 'pi pi-shield' },
    { key: 'USERS', label: 'User Directory', category: 'Administration', icon: 'pi pi-users' },
  ];

  isModuleFeatureEnabled(moduleKeyOrMod: any): boolean {
    const mod = typeof moduleKeyOrMod === 'string'
      ? this.permissionModules.find((m) => m.key === moduleKeyOrMod)
      : moduleKeyOrMod;
    if (!mod || !mod.featureKey) return true;
    const toggle = this.toggles.find((t) => t.featureKey === mod.featureKey);
    return toggle ? toggle.isEnabled !== false : true;
  }

  get activePermissionModules(): any[] {
    return this.permissionModules.filter((m) => this.isModuleFeatureEnabled(m));
  }

  get categoryOptions(): { key: string; label: string; count: number }[] {
    const active = this.activePermissionModules;
    const uniqueCats: string[] = [];
    for (const mod of active) {
      if (mod.category && !uniqueCats.includes(mod.category)) {
        uniqueCats.push(mod.category);
      }
    }
    return [
      { key: 'ALL', label: 'All', count: active.length },
      ...uniqueCats.map((cat) => ({
        key: cat,
        label: cat,
        count: active.filter((m) => m.category === cat).length,
      })),
    ];
  }

  get totalPrivilegesCount(): number {
    return this.activePermissionModules.length * this.permissionActions.length;
  }

  permissionActions = [
    { key: 'VIEW', label: 'View' },
    { key: 'CREATE', label: 'Create' },
    { key: 'EDIT', label: 'Edit' },
    { key: 'DELETE', label: 'Delete' },
    { key: 'PRINT', label: 'Print' },
    { key: 'EXPORT', label: 'Export' },
  ];

  constructor(
    private api: ApiService,
    public tenant: TenantService,
    private masters: MastersService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'taxes') {
        this.activeTab = 'gst';
        this.gstSubTab = 'slabs';
      } else if (tab === 'gst') {
        this.activeTab = 'gst';
        this.gstSubTab = 'hierarchy';
      } else if (
        tab &&
        ['company', 'branches', 'warehouses', 'toggles', 'roles', 'users', 'mappings', 'vouchers', 'sales', 'purchase', 'inventory'].includes(tab)
      ) {
        this.activeTab = tab as any;
      }
    });

    if (!this.tenant.currentCompany()) {
      this.tenant.loadHierarchy().subscribe({
        next: () => this.loadAll(),
        error: () => this.loadAll(),
      });
    } else {
      this.loadAll();
    }
  }

  getActiveTabTitle(): string {
    switch (this.activeTab) {
      case 'company':
        return 'Company Profile';
      case 'branches':
        return 'Branches & Locations';
      case 'warehouses':
        return 'Warehouse';
      case 'toggles':
        return 'Features';
      case 'roles':
        if (this.roleViewMode === 'permissions' && this.selectedRole) {
          return `${this.selectedRole.name} Permissions`;
        }
        if (this.roleViewMode === 'create') {
          return 'Create New Custom Role';
        }
        return 'User Roles';
      case 'users':
        return 'Users';
      case 'mappings':
        return 'Default Ledgers';
      case 'vouchers':
        return 'Voucher Numbers';
      case 'sales':
        return 'Sales Configuration';
      case 'purchase':
        return 'Purchase Configuration';
      case 'inventory':
        return 'Inventory Configuration';
      case 'gst':
      case 'taxes':
        return 'GST';
      default:
        return 'Enterprise Settings';
    }
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getVoucherItem(key: string): any {
    if (!this.settings.voucherConfig) {
      this.settings.voucherConfig = {};
    }
    if (!this.settings.voucherConfig[key]) {
      this.settings.voucherConfig[key] = {
        ...(this.defaultVoucherConfigs[key] || {
          prefix: `${key}-`,
          suffix: '/25-26',
          startingNumber: 1,
          padding: 4,
          resetFrequency: 'YEARLY',
          isAuto: true,
        }),
      };
    }
    return this.settings.voucherConfig[key];
  }

  ensureVoucherConfig() {
    if (!this.settings.voucherConfig) {
      this.settings.voucherConfig = {};
    }
    for (const v of this.voucherKeys) {
      if (!this.settings.voucherConfig[v.key]) {
        this.settings.voucherConfig[v.key] = {
          ...(this.defaultVoucherConfigs[v.key] || {
            prefix: `${v.key}-`,
            suffix: '/25-26',
            startingNumber: 1,
            padding: 4,
            resetFrequency: 'YEARLY',
            isAuto: true,
          }),
        };
      }
    }
  }

  loadAll() {
    this.loadCompanyProfile();
    this.loadBranches();
    this.loadWarehouses();
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    // Load Settings
    if (compId) {
      this.api.get<any>(`/settings?companyId=${compId}`).subscribe({
        next: (res) => {
          if (res) {
            this.settings = { ...this.settings, ...res };
            if (!this.settings.voucherConfig) this.settings.voucherConfig = {};
            if (!this.settings.salesSettings) this.settings.salesSettings = {};
            if (!this.settings.purchaseSettings) this.settings.purchaseSettings = {};
            if (!this.settings.inventorySettings) this.settings.inventorySettings = {};
          }
          this.ensureVoucherConfig();
        },
        error: () => {
          this.ensureVoucherConfig();
        },
      });
    } else {
      this.ensureVoucherConfig();
    }

    // Load Roles
    this.api.get<any[]>('/rbac/roles').subscribe({
      next: (res) => {
        this.roles = res || [];
        if (!this.selectedRole && this.roles.length > 0) {
          this.selectedRole = this.roles[0];
        }
      },
    });

    // Load Users
    this.api.get<any[]>('/rbac/users').subscribe({
      next: (res) => {
        this.users = res || [];
      },
    });

    // Load Toggles
    if (compId) {
      this.api.get<any[]>(`/settings/toggles?companyId=${compId}`).subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.toggles = this.toggles.map((local) => {
              const matched = res.find((r) => r.featureKey === local.featureKey);
              return matched ? { ...local, ...matched } : local;
            });
          }
        },
      });
    }

    // Load Tax Masters
    if (compId) {
      this.api.get<any[]>(`/settings/tax-masters?companyId=${compId}`).subscribe({
        next: (res) => {
          this.taxMasters = res || [];
        },
      });
    }

    // Load Ledgers for dropdowns
    if (compId) {
      this.masters.getLedgers(compId).subscribe({
        next: (res) => {
          this.ledgers = res || [];
        },
      });
    }
  }

  getVoucherPreview(key: string): string {
    const cfg = this.getVoucherItem(key);
    if (!cfg) return '—';
    const prefix = cfg.prefix || '';
    const num = String(cfg.startingNumber || 1).padStart(cfg.padding || 4, '0');
    const suffix = cfg.suffix || '';
    return `${prefix}${num}${suffix}`;
  }

  selectRole(role: any) {
    this.selectedRole = role;
  }

  hasPermission(role: any, moduleName: string, action: string): boolean {
    if (!role || !role.permissions) return false;
    return role.permissions.some(
      (p: any) =>
        (p.moduleName === moduleName || p.module === moduleName) && p.action === action,
    );
  }

  togglePermission(role: any, moduleName: string, action: string) {
    if (!role) return;
    if (!role.permissions) role.permissions = [];

    const idx = role.permissions.findIndex(
      (p: any) =>
        (p.moduleName === moduleName || p.module === moduleName) && p.action === action,
    );

    if (idx > -1) {
      role.permissions.splice(idx, 1);
    } else {
      role.permissions.push({ moduleName, module: moduleName, action });
    }
  }

  toggleAllModulePermissions(role: any, moduleName: string) {
    if (!role) return;
    if (!role.permissions) role.permissions = [];

    const currentCount = this.permissionActions.filter((act) =>
      this.hasPermission(role, moduleName, act.key),
    ).length;

    if (currentCount === this.permissionActions.length) {
      // Uncheck all for this module
      role.permissions = role.permissions.filter(
        (p: any) => p.moduleName !== moduleName && p.module !== moduleName,
      );
    } else {
      // Check all for this module
      this.permissionActions.forEach((act) => {
        if (!this.hasPermission(role, moduleName, act.key)) {
          role.permissions.push({ moduleName, module: moduleName, action: act.key });
        }
      });
    }
  }

  saveRolePermissions(role: any) {
    if (!role) return;
    this.savingRole = true;

    // Deduplicate permissions
    const seen = new Set<string>();
    const permsPayload: any[] = [];
    for (const p of role.permissions || []) {
      const mod = p.moduleName || p.module;
      const act = p.action;
      if (!mod || !act) continue;
      const k = `${mod}_${act}`;
      if (!seen.has(k)) {
        seen.add(k);
        permsPayload.push({
          module: mod,
          moduleName: mod,
          action: act,
        });
      }
    }

    this.api.put(`/rbac/roles/${role.id}`, {
      name: role.name,
      description: role.description || '',
      permissions: permsPayload,
    }).subscribe({
      next: (res: any) => {
        this.savingRole = false;
        if (res) {
          if (res.name) role.name = res.name;
          if (res.description !== undefined) role.description = res.description;
          if (res.permissions) role.permissions = res.permissions;
        }
        this.saveSuccess = true;
        this.saveMessage = `Role "${role.name}" and privileges saved successfully!`;
        this.toast.success(this.saveMessage, 'Privileges Saved');
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: (err: any) => {
        console.error('Failed to save role permissions', err);
        this.savingRole = false;
        const msg = err?.error?.message || 'Failed to save role. Please check network/permission.';
        this.toast.error(msg, 'Save Failed');
        alert(msg);
      },
    });
  }

  // Roles View Helpers & Filters
  getSystemRolesCount(): number {
    return (this.roles || []).filter((r) => r.isSystem).length;
  }

  getCustomRolesCount(): number {
    return (this.roles || []).filter((r) => !r.isSystem).length;
  }

  getUserCountForRole(roleId: string): number {
    if (!roleId || !this.users) return 0;
    return this.users.filter((u) => u.roleId === roleId || (u.role && u.role.id === roleId)).length;
  }

  filteredRoles(): any[] {
    let list = this.roles || [];
    if (this.roleTypeFilter === 'system') {
      list = list.filter((r) => r.isSystem);
    } else if (this.roleTypeFilter === 'custom') {
      list = list.filter((r) => !r.isSystem);
    }
    if (this.roleSearchQuery && this.roleSearchQuery.trim()) {
      const q = this.roleSearchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }
    return list;
  }

  getPrivilegeCount(role: any): number {
    if (!role?.permissions) return 0;
    const activeKeys = new Set(this.activePermissionModules.map((m) => m.key));
    return role.permissions.filter((p: any) => activeKeys.has(p.moduleName || p.module)).length;
  }

  getPrivilegePercentage(role: any): number {
    const total = this.totalPrivilegesCount;
    if (!total || !role) return 0;
    const count = this.getPrivilegeCount(role);
    return Math.min(100, Math.round((count / total) * 100));
  }

  getRoleCategoryBreakdown(role: any): string[] {
    if (!role || !role.permissions || role.permissions.length === 0) return [];
    const activeMods = new Set(
      role.permissions.map((p: any) => p.moduleName || p.module),
    );
    const cats = new Set<string>();
    for (const mod of this.activePermissionModules) {
      if (activeMods.has(mod.key)) {
        cats.add(mod.category);
      }
    }
    return Array.from(cats);
  }

  getUniqueCategories(): string[] {
    const cats: string[] = [];
    for (const mod of this.activePermissionModules) {
      if (mod.category && !cats.includes(mod.category)) {
        cats.push(mod.category);
      }
    }
    return cats;
  }

  getCategoryModuleCount(category: string): number {
    return this.activePermissionModules.filter((m) => m.category === category).length;
  }

  filteredPermissionModules(): any[] {
    let list = this.activePermissionModules || [];
    if (this.selectedCategoryFilter && this.selectedCategoryFilter !== 'ALL') {
      list = list.filter((m) => m.category.toLowerCase() === this.selectedCategoryFilter.toLowerCase());
    }
    if (this.moduleSearchQuery && this.moduleSearchQuery.trim()) {
      const q = this.moduleSearchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.key.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      );
    }
    return list;
  }

  isModuleActive(role: any, moduleKey: string): boolean {
    if (!role || !role.permissions) return false;
    return role.permissions.some(
      (p: any) => p.moduleName === moduleKey || p.module === moduleKey,
    );
  }

  isModuleFullyGranted(role: any, moduleKey: string): boolean {
    if (!role || !role.permissions) return false;
    return this.permissionActions.every((act) =>
      this.hasPermission(role, moduleKey, act.key),
    );
  }

  // Navigation and mode switching
  startCreateRole() {
    this.newRole = {
      name: '',
      description: '',
      permissions: [],
    };
    this.createBaseRoleId = '';
    this.moduleSearchQuery = '';
    this.selectedCategoryFilter = 'ALL';
    this.roleViewMode = 'create';
  }

  onBaseRoleChanged() {
    if (!this.createBaseRoleId) {
      this.newRole.permissions = [];
      return;
    }
    const base = this.roles.find((r) => r.id === this.createBaseRoleId);
    if (base && base.permissions) {
      this.newRole.permissions = base.permissions.map((p: any) => ({
        moduleName: p.moduleName || p.module,
        module: p.moduleName || p.module,
        action: p.action,
      }));
    } else {
      this.newRole.permissions = [];
    }
  }

  startConfigurePermissions(role: any) {
    this.selectedRole = role;
    this.moduleSearchQuery = '';
    this.selectedCategoryFilter = 'ALL';
    this.roleViewMode = 'permissions';
  }

  backToRoleList() {
    this.roleViewMode = 'list';
  }

  cloneRole(role: any) {
    this.newRole = {
      name: `${role.name} Copy`,
      description: `Cloned from ${role.name}. ${role.description || ''}`.trim(),
      permissions: (role.permissions || []).map((p: any) => ({
        moduleName: p.moduleName || p.module,
        module: p.moduleName || p.module,
        action: p.action,
      })),
    };
    this.createBaseRoleId = role.id;
    this.moduleSearchQuery = '';
    this.selectedCategoryFilter = 'ALL';
    this.roleViewMode = 'create';
  }

  submitCreateRole() {
    if (!this.newRole.name || !this.newRole.name.trim()) return;

    this.savingRole = true;
    const permsPayload = (this.newRole.permissions || []).map((p: any) => ({
      module: p.moduleName || p.module,
      action: p.action,
    }));

    this.api
      .post('/rbac/roles', {
        name: this.newRole.name.trim(),
        description: (this.newRole.description || '').trim(),
        permissions: permsPayload,
      })
      .subscribe({
        next: (created: any) => {
          this.savingRole = false;
          this.roles.push(created);
          this.selectedRole = created;
          this.roleViewMode = 'list';
          this.saveSuccess = true;
          this.saveMessage = `New role "${created.name}" created with ${permsPayload.length} privileges!`;
          this.toast.success(this.saveMessage, 'Role Created');
          setTimeout(() => (this.saveSuccess = false), 3500);
        },
        error: (err: any) => {
          this.savingRole = false;
          const msg = err?.error?.message || 'Failed to create role. Ensure role name is unique.';
          this.toast.error(msg, 'Role Creation Failed');
          alert(msg);
        },
      });
  }

  openEditRoleModal(role: any) {
    this.editingRole = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      isSystem: role.isSystem,
    };
    this.editRoleModalVisible = true;
  }

  submitEditRole() {
    if (!this.editingRole.name.trim()) return;
    this.savingRole = true;

    this.api
      .put(`/rbac/roles/${this.editingRole.id}`, {
        name: this.editingRole.name.trim(),
        description: (this.editingRole.description || '').trim(),
      })
      .subscribe({
        next: (updated: any) => {
          this.savingRole = false;
          this.editRoleModalVisible = false;
          const target = this.roles.find((r) => r.id === this.editingRole.id);
          if (target) {
            target.name = updated.name || this.editingRole.name.trim();
            target.description = updated.description !== undefined ? updated.description : this.editingRole.description;
          }
          this.saveSuccess = true;
          this.saveMessage = `Role details updated successfully!`;
          this.toast.success(this.saveMessage, 'Role Updated');
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (err: any) => {
          this.savingRole = false;
          const msg = err?.error?.message || 'Failed to update role details.';
          this.toast.error(msg, 'Update Failed');
          alert(msg);
        },
      });
  }

  confirmDeleteRole(role: any) {
    if (role.isSystem) return;
    this.roleToDelete = role;
    this.deleteRoleModalVisible = true;
  }

  deleteRoleConfirmed() {
    if (!this.roleToDelete) return;
    this.deletingRole = true;

    this.api.delete(`/rbac/roles/${this.roleToDelete.id}`).subscribe({
      next: () => {
        this.deletingRole = false;
        this.roles = this.roles.filter((r) => r.id !== this.roleToDelete.id);
        if (this.selectedRole?.id === this.roleToDelete.id) {
          this.selectedRole = this.roles.length > 0 ? this.roles[0] : null;
        }
        this.deleteRoleModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Role "${this.roleToDelete.name}" deleted successfully.`;
        this.toast.success(this.saveMessage, 'Role Deleted');
        this.roleToDelete = null;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: (err: any) => {
        this.deletingRole = false;
        const msg = err?.error?.message || 'Failed to delete role. It may still be in use.';
        this.toast.error(msg, 'Delete Failed');
        alert(msg);
      },
    });
  }

  // Bulk actions on permission matrix
  toggleColumnAll(role: any, actionKey: string) {
    if (!role) return;
    if (!role.permissions) role.permissions = [];

    const visibleMods = this.filteredPermissionModules();
    const allHaveIt = visibleMods.every((mod) =>
      this.hasPermission(role, mod.key, actionKey),
    );

    if (allHaveIt) {
      // Remove this action for all visible modules
      const modKeys = new Set(visibleMods.map((m) => m.key));
      role.permissions = role.permissions.filter(
        (p: any) => !(modKeys.has(p.moduleName || p.module) && p.action === actionKey),
      );
    } else {
      // Add this action for all visible modules
      visibleMods.forEach((mod) => {
        if (!this.hasPermission(role, mod.key, actionKey)) {
          role.permissions.push({
            moduleName: mod.key,
            module: mod.key,
            action: actionKey,
          });
        }
      });
    }
  }

  grantAllViewOnly(role: any) {
    if (!role) return;
    if (!role.permissions) role.permissions = [];
    const visibleMods = this.filteredPermissionModules();
    visibleMods.forEach((mod) => {
      if (!this.hasPermission(role, mod.key, 'VIEW')) {
        role.permissions.push({
          moduleName: mod.key,
          module: mod.key,
          action: 'VIEW',
        });
      }
    });
  }

  grantFullAccess(role: any) {
    if (!role) return;
    if (!role.permissions) role.permissions = [];
    const visibleMods = this.filteredPermissionModules();
    visibleMods.forEach((mod) => {
      this.permissionActions.forEach((act) => {
        if (!this.hasPermission(role, mod.key, act.key)) {
          role.permissions.push({
            moduleName: mod.key,
            module: mod.key,
            action: act.key,
          });
        }
      });
    });
  }

  revokeAllPermissions(role: any) {
    if (!role) return;
    if (this.selectedCategoryFilter === 'ALL' && !this.moduleSearchQuery) {
      role.permissions = [];
    } else {
      const visibleModKeys = new Set(this.filteredPermissionModules().map((m) => m.key));
      role.permissions = (role.permissions || []).filter(
        (p: any) => !visibleModKeys.has(p.moduleName || p.module),
      );
    }
  }

  openNewRoleModal() {
    this.startCreateRole();
  }

  submitNewRole() {
    this.submitCreateRole();
  }

  openNewUserModal() {
    this.newUser = { fullName: '', email: '', phone: '', roleId: '' };
    this.showNewUserModal = true;
  }

  submitNewUser() {
    if (!this.newUser.fullName.trim() || !this.newUser.email.trim()) return;

    this.api.post('/rbac/users', {
      fullName: this.newUser.fullName.trim(),
      email: this.newUser.email.trim(),
      phone: this.newUser.phone.trim(),
      roleId: this.newUser.roleId || null,
    }).subscribe({
      next: (created: any) => {
        this.showNewUserModal = false;
        this.users.push(created);
        this.saveSuccess = true;
        this.saveMessage = `User "${created.fullName}" registered successfully!`;
        this.toast.success(this.saveMessage, 'User Registered');
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create user. Ensure email is unique.';
        this.toast.error(msg, 'Registration Failed');
        alert(msg);
      },
    });
  }

  changeUserRole(user: any, event: any) {
    const newRoleId = event && event.target ? event.target.value : user.roleId;
    user.roleId = (newRoleId && newRoleId !== 'null' && newRoleId !== '') ? newRoleId : null;
    this.api.put(`/rbac/users/${user.id}`, { roleId: user.roleId }).subscribe({
      next: (res: any) => {
        if (res && res.role) {
          user.role = res.role;
        }
        this.saveSuccess = true;
        this.saveMessage = `Role assignment updated for ${user.fullName}.`;
        this.toast.success(this.saveMessage, 'Role Assigned');
        setTimeout(() => (this.saveSuccess = false), 2500);
      },
      error: (err: any) => {
        console.error('Failed to update user role', err);
        this.toast.error('Failed to update user role.', 'Update Failed');
      },
    });
  }

  saveAllUsers() {
    this.saving = true;
    const reqs = this.users.map((u) =>
      this.api.put(`/rbac/users/${u.id}`, {
        roleId: (u.roleId && u.roleId !== 'null' && u.roleId !== '') ? u.roleId : null,
        isActive: u.isActive,
      })
    );
    if (reqs.length === 0) {
      this.saving = false;
      return;
    }
    forkJoin(reqs).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        this.saveMessage = 'All user role assignments saved successfully!';
        this.toast.success(this.saveMessage, 'Users Updated');
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to save user role assignments.', 'Save Failed');
      },
    });
  }

  toggleUserStatus(user: any) {
    user.isActive = !user.isActive;
    this.api.put(`/rbac/users/${user.id}`, { isActive: user.isActive }).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.saveMessage = `User status changed to ${user.isActive ? 'Active' : 'Inactive'}.`;
        this.toast.success(this.saveMessage, 'Status Updated');
        setTimeout(() => (this.saveSuccess = false), 2500);
      },
      error: () => {
        this.toast.error('Failed to change user status.', 'Update Failed');
      },
    });
  }

  saveSettings() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    if (this.activeTab === 'toggles') {
      this.saving = true;
      const requests = this.toggles.map((t) =>
        this.api.post('/settings/toggles', {
          companyId: compId,
          featureKey: t.featureKey,
          isEnabled: t.isEnabled,
        }),
      );
      forkJoin(requests).subscribe({
        next: () => {
          this.saving = false;
          this.saveSuccess = true;
          this.saveMessage = 'All modular system capabilities saved successfully!';
          this.toast.success(this.saveMessage, 'Features Saved');
          setTimeout(() => (this.saveSuccess = false), 3500);
        },
        error: () => {
          this.saving = false;
          this.toast.error('Failed to save modular system capabilities.', 'Save Failed');
        },
      });
      return;
    }

    if (this.activeTab === 'roles') {
      if (this.selectedRole) {
        this.saveRolePermissions(this.selectedRole);
      }
      return;
    }

    if (this.activeTab === 'users') {
      this.saveAllUsers();
      return;
    }

    this.saving = true;
    this.api.put(`/settings?companyId=${compId}`, this.settings).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        this.saveMessage = 'Configuration saved successfully! All transactional engines and parameters refreshed.';
        this.toast.success(this.saveMessage, 'Settings Saved');
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to save configuration settings.', 'Save Failed');
      },
    });
  }

  toggleFeature(toggle: any, event: any) {
    const isChecked = event.target ? event.target.checked : !toggle.isEnabled;
    toggle.isEnabled = isChecked;

    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;

    this.api.post('/settings/toggles', {
      companyId: compId,
      featureKey: toggle.featureKey,
      isEnabled: isChecked,
    }).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.saveMessage = `Module "${this.formatFeatureName(toggle.featureKey)}" set to ${isChecked ? 'Active' : 'Disabled'}.`;
        this.toast.success(this.saveMessage, 'Feature Saved');
        setTimeout(() => (this.saveSuccess = false), 2500);
      },
      error: (err) => {
        console.error('Failed to update toggle', err);
        this.toast.error('Failed to update feature setting.', 'Update Failed');
      },
    });
  }

  formatFeatureName(key: string): string {
    switch (key) {
      case 'GST': return 'Goods & Services Tax (GST)';
      case 'PURCHASE_ORDER': return 'Purchase Orders (PO)';
      case 'GRN': return 'Goods Receipt Notes (GRN)';
      case 'SALES_ORDER': return 'Sales Orders (SO)';
      case 'DELIVERY_CHALLAN': return 'Delivery Challans (DC)';
      case 'VARIANTS': return 'Item Variants & Attributes';
      case 'RACK_BIN': return 'Godown & Rack/Bin Storage';
      case 'MANUFACTURING': return 'BOM & Assembly Manufacturing';
      case 'STOCK_TRANSFER': return 'Stock Transfers (Warehouse Transfer)';
      case 'STOCK_ADJUSTMENT': return 'Stock Adjustments & Reconciliation';
      case 'PRICE_LIST': return 'Price Lists & Tiered Pricing';
      default: return key;
    }
  }

  getFeatureDescription(key: string): string {
    switch (key) {
      case 'GST': return 'Enables statutory GSTIN calculations, HSN resolution, and balanced tax accounting ledgers.';
      case 'PURCHASE_ORDER': return 'Enables formal procurement workflow, tracking ordered vs pending quantities.';
      case 'GRN': return 'Gatekeeper warehouse stock-in step before finance invoice posting.';
      case 'SALES_ORDER': return 'Enables booking of customer sales orders with fulfillment and backlog tracking.';
      case 'DELIVERY_CHALLAN': return 'Enables delivery challans (DC) and gate-pass dispatch notes prior to sales billing.';
      case 'VARIANTS': return 'Manage matrix items with sizes, colors, and SKU-level variance.';
      case 'RACK_BIN': return 'Granular inventory location tracking within godowns and warehouses.';
      case 'MANUFACTURING': return 'Bill of Materials composition, component consumption, and finished goods assembly.';
      case 'STOCK_TRANSFER': return 'Inter-warehouse and godown-to-godown stock transfer manifests with receipt verification.';
      case 'STOCK_ADJUSTMENT': return 'Inventory physical audits, shrinkage write-offs, and stock reconciliation vouchers.';
      case 'PRICE_LIST': return 'Custom price lists, wholesale trade tiers, and customer-specific rate structures.';
      default: return 'Core system functionality module.';
    }
  }

  getFeatureIcon(key: string): string {
    switch (key) {
      case 'GST': return 'pi pi-percentage';
      case 'PURCHASE_ORDER': return 'pi pi-shopping-cart';
      case 'GRN': return 'pi pi-box';
      case 'SALES_ORDER': return 'pi pi-file';
      case 'DELIVERY_CHALLAN': return 'pi pi-truck';
      case 'VARIANTS': return 'pi pi-tags';
      case 'RACK_BIN': return 'pi pi-warehouse';
      case 'MANUFACTURING': return 'pi pi-cog';
      case 'STOCK_TRANSFER': return 'pi pi-arrows-h';
      case 'STOCK_ADJUSTMENT': return 'pi pi-sliders-h';
      case 'PRICE_LIST': return 'pi pi-percentage';
      default: return 'pi pi-sliders-h';
    }
  }

  // COMPANY PROFILE METHODS
  loadCompanyProfile() {
    const comp = this.tenant.currentCompany();
    if (comp) {
      this.initCompanyForm(comp);
    }
    // Always fetch fresh company profile from API
    this.api.get<any[]>('/tenancy/companies').subscribe({
      next: (companies) => {
        if (companies && companies.length > 0) {
          const savedCompId = localStorage.getItem('zeno_company_id');
          const found = (savedCompId ? companies.find((c) => c.id === savedCompId) : null) || companies[0];
          this.tenant.setCompany(found);
          this.initCompanyForm(found);
        }
      },
      error: (err) => console.error('Failed to load company profile from API', err),
    });
  }

  initCompanyForm(comp: any) {
    if (!comp) return;
    this.companyForm = {
      id: comp.id,
      legalName: comp.legalName !== undefined && comp.legalName !== null ? comp.legalName : (comp.tradeName || 'Apex Technologies Private Limited'),
      tradeName: comp.tradeName !== undefined && comp.tradeName !== null ? comp.tradeName : (comp.legalName || 'Apex Tech'),
      code: comp.code || 'APEX-01',
      businessType: comp.businessType || 'Private Limited Company',
      financialYearStart: comp.financialYearStart ? String(comp.financialYearStart).split('T')[0] : '2025-04-01',
      financialYearEnd: comp.financialYearEnd ? String(comp.financialYearEnd).split('T')[0] : '2026-03-31',
      booksBeginFrom: comp.booksBeginFrom ? String(comp.booksBeginFrom).split('T')[0] : '2025-04-01',
      currencyCode: comp.currencyCode || 'INR',
      gstRegistrationType: comp.gstRegistrationType || 'Regular',
      gstin: comp.gstin || '',
      pan: comp.pan || '',
      stateName: comp.stateName || comp.extraDetails?.stateName || 'Maharashtra (27)',
      filingFrequency: comp.filingFrequency || comp.extraDetails?.filingFrequency || 'Monthly',
      tanNumber: comp.tanNumber || comp.arnNumber || comp.extraDetails?.tanNumber || comp.extraDetails?.arnNumber || '',
      arnNumber: comp.tanNumber || comp.arnNumber || comp.extraDetails?.tanNumber || comp.extraDetails?.arnNumber || '',
      billingAddress: comp.billingAddress || {
        addressLine1: this.currentBranch?.addressLine1 || '',
        addressLine2: this.currentBranch?.addressLine2 || '',
        city: this.currentBranch?.city || '',
        state: this.currentBranch?.stateName || 'Maharashtra',
        pincode: this.currentBranch?.pincode || '',
        country: 'India',
      },
      shippingAddress: comp.shippingAddress || {
        addressLine1: this.currentBranch?.addressLine1 || '',
        addressLine2: this.currentBranch?.addressLine2 || '',
        city: this.currentBranch?.city || '',
        state: this.currentBranch?.stateName || 'Maharashtra',
        pincode: this.currentBranch?.pincode || '',
        country: 'India',
      },
      contactDetails: comp.contactDetails || {
        contactPerson: '',
        email: '',
        phone: '',
        alternatePhone: '',
        website: '',
      },
      logoUrl: comp.logoUrl || '/zeno-books-logo.png',
      extraDetails: comp.extraDetails || {
        tagline: 'Precision Accounting & Financial ERP',
        invoiceHeaderNote: '',
        invoiceFooterNote: '',
      },
    };
  }

  copyBillingToShipping() {
    this.companyForm.shippingAddress = {
      ...this.companyForm.billingAddress,
    };
    this.saveSuccess = true;
    this.saveMessage = 'Billing address copied to shipping address!';
    setTimeout(() => (this.saveSuccess = false), 2000);
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processLogoFile(input.files[0]);
    }
  }

  onLogoDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.processLogoFile(event.dataTransfer.files[0]);
    }
  }

  processLogoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.companyForm.logoUrl = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  }

  onCompanyBillingStateChange() {
    const found = this.indianStates.find(
      (s) => s.name.toLowerCase() === (this.companyForm.billingAddress.state || '').trim().toLowerCase(),
    );
    if (found) {
      if (!this.companyForm.shippingAddress.state) {
        this.companyForm.shippingAddress.state = found.name;
      }
      this.companyForm.stateName = `${found.name} (${found.code})`;
    }
  }

  saveCompanyProfile() {
    const compId = this.companyForm.id || this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id') || this.tenant.companies()?.[0]?.id;
    if (!compId) {
      alert('Unable to identify current company record. Please refresh and try again.');
      return;
    }

    // Sanitize dates for PostgreSQL date column
    const payload = { ...this.companyForm };
    if (!payload.financialYearEnd) {
      payload.financialYearEnd = null;
    }
    if (!payload.financialYearStart) {
      payload.financialYearStart = '2025-04-01';
    }
    if (!payload.booksBeginFrom) {
      payload.booksBeginFrom = '2025-04-01';
    }

    payload.arnNumber = payload.tanNumber;
    if (!payload.extraDetails) {
      payload.extraDetails = {};
    }
    payload.extraDetails.tanNumber = payload.tanNumber;
    payload.extraDetails.arnNumber = payload.arnNumber;
    payload.extraDetails.stateName = payload.stateName;
    payload.extraDetails.filingFrequency = payload.filingFrequency;

    this.savingCompany = true;
    this.api.put(`/tenancy/companies/${compId}`, payload).subscribe({
      next: (res: any) => {
        this.savingCompany = false;
        this.saveSuccess = true;
        this.saveMessage = 'Company profile and branding saved successfully!';
        this.toast.success(this.saveMessage, 'Company Profile Saved');
        setTimeout(() => (this.saveSuccess = false), 3500);

        if (res) {
          this.tenant.setCompany(res);
          this.initCompanyForm(res);
        }
        this.tenant.loadHierarchy().subscribe({
          next: (companies) => {
            const updated = (companies && companies.find((c: any) => c.id === compId)) || res;
            if (updated) {
              this.tenant.setCompany(updated);
              this.initCompanyForm(updated);
            }
          },
        });
      },
      error: (err) => {
        this.savingCompany = false;
        console.error('Failed to update company profile', err);
        const msg = err?.error?.message || 'Failed to update company profile. Please check the network/console and try again.';
        this.toast.error(msg, 'Save Failed');
        alert(msg);
      },
    });
  }

  // BRANCH MASTER METHODS
  loadBranches() {
    this.api.get<any[]>('/tenancy/branches').subscribe({
      next: (res) => {
        this.branches = res || [];
      },
    });
  }

  get filteredBranches(): any[] {
    let list = this.branches || [];
    if (this.branchSearchQuery.trim()) {
      const q = this.branchSearchQuery.toLowerCase().trim();
      list = list.filter((b) =>
        (b.branchName && b.branchName.toLowerCase().includes(q)) ||
        (b.branchCode && b.branchCode.toLowerCase().includes(q)) ||
        (b.stateName && b.stateName.toLowerCase().includes(q)) ||
        (b.addressLine1 && b.addressLine1.toLowerCase().includes(q)) ||
        (b.pincode && b.pincode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getHeadOfficeBranch(): any {
    return this.branches.find((b) => b.isHeadOffice) || this.branches[0] || null;
  }

  getGodownsCountForBranch(branchId: string): number {
    return this.warehouses.filter((w) => w.branchId === branchId).length;
  }

  onNewBranchStateChange() {
    const s = this.indianStates.find((st) => st.name === this.newBranch.stateName);
    if (s) {
      this.newBranch.stateCode = s.code;
    }
  }

  onEditBranchStateChange() {
    if (!this.branchToEdit) return;
    const s = this.indianStates.find((st) => st.name === this.branchToEdit.stateName);
    if (s) {
      this.branchToEdit.stateCode = s.code;
    }
  }

  openCreateBranchModal() {
    this.newBranch = {
      branchName: '',
      branchCode: `BR-0${this.branches.length + 1}`,
      stateCode: '27',
      stateName: 'Maharashtra',
      addressLine1: '',
      pincode: '',
      isHeadOffice: this.branches.length === 0,
    };
    this.createBranchModalVisible = true;
  }

  submitCreateBranch() {
    if (!this.newBranch.branchName.trim() || !this.newBranch.branchCode.trim()) return;

    this.savingBranch = true;
    const compId = this.companyForm?.id || this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    this.api.post('/tenancy/branches', {
      ...this.newBranch,
      companyId: compId,
    }).subscribe({
      next: () => {
        this.savingBranch = false;
        this.createBranchModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Branch "${this.newBranch.branchName}" created successfully!`;
        this.toast.success(this.saveMessage, 'Branch Created');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadBranches();
        this.tenant.loadHierarchy().subscribe();
      },
      error: (err) => {
        this.savingBranch = false;
        const msg = err?.error?.message || 'Failed to create branch. Please check inputs.';
        this.toast.error(msg, 'Branch Creation Failed');
        alert(msg);
      },
    });
  }

  openEditBranchModal(b: any) {
    this.branchToEdit = { ...b };
    this.editBranchModalVisible = true;
  }

  submitEditBranch() {
    if (!this.branchToEdit || !this.branchToEdit.id) return;
    if (!this.branchToEdit.branchName.trim() || !this.branchToEdit.branchCode.trim()) return;

    this.savingBranch = true;
    this.api.put(`/tenancy/branches/${this.branchToEdit.id}`, this.branchToEdit).subscribe({
      next: () => {
        this.savingBranch = false;
        this.editBranchModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Branch "${this.branchToEdit.branchName}" updated successfully!`;
        this.toast.success(this.saveMessage, 'Branch Updated');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadBranches();
        this.tenant.loadHierarchy().subscribe();
      },
      error: (err) => {
        this.savingBranch = false;
        const msg = err?.error?.message || 'Failed to update branch.';
        this.toast.error(msg, 'Update Failed');
        alert(msg);
      },
    });
  }

  openDeleteBranchModal(b: any) {
    this.branchToDelete = b;
    this.deleteBranchModalVisible = true;
  }

  confirmDeleteBranch() {
    if (!this.branchToDelete || !this.branchToDelete.id) return;

    this.savingBranch = true;
    this.api.delete(`/tenancy/branches/${this.branchToDelete.id}`).subscribe({
      next: () => {
        this.savingBranch = false;
        this.deleteBranchModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Branch "${this.branchToDelete.branchName}" deleted successfully.`;
        this.toast.success(this.saveMessage, 'Branch Deleted');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadBranches();
        this.tenant.loadHierarchy().subscribe();
      },
      error: (err) => {
        this.savingBranch = false;
        const msg = err?.error?.message || 'Failed to delete branch. Ensure linked godowns are reassigned first.';
        this.toast.error(msg, 'Deletion Failed');
        alert(msg);
      },
    });
  }

  // WAREHOUSE MASTER METHODS
  loadWarehouses() {
    this.api.get<any[]>('/tenancy/godowns').subscribe({
      next: (res) => {
        this.warehouses = res || [];
      },
    });
  }

  get filteredWarehouses(): any[] {
    let list = this.warehouses;
    if (this.warehouseBranchFilter && this.warehouseBranchFilter !== 'ALL') {
      list = list.filter((w) => w.branchId === this.warehouseBranchFilter);
    }
    if (this.warehouseSearchQuery.trim()) {
      const q = this.warehouseSearchQuery.toLowerCase().trim();
      list = list.filter((w) =>
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.city && w.city.toLowerCase().includes(q)) ||
        (w.contactPerson && w.contactPerson.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getActiveWarehousesCount(): number {
    return this.warehouses.filter((w) => w.isActive !== false).length;
  }

  getUniqueBranchesCount(): number {
    const branchIds = new Set(this.warehouses.map((w) => w.branchId).filter(Boolean));
    return branchIds.size || (this.tenant.branches().length || 1);
  }

  openCreateWarehouseModal() {
    const branches = this.tenant.branches();
    this.newWarehouse = {
      name: '',
      code: `WH-0${this.warehouses.length + 1}`,
      branchId: branches && branches.length > 0 ? branches[0].id : '',
      address: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      contactPerson: '',
      contactPhone: '',
      isActive: true,
    };
    this.createWarehouseModalVisible = true;
  }

  submitCreateWarehouse() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!this.newWarehouse.name.trim() || !this.newWarehouse.code.trim()) return;

    this.savingWarehouse = true;
    this.api.post('/tenancy/godowns', {
      ...this.newWarehouse,
      companyId: compId,
    }).subscribe({
      next: () => {
        this.savingWarehouse = false;
        this.createWarehouseModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Warehouse "${this.newWarehouse.name}" created successfully!`;
        this.toast.success(this.saveMessage, 'Warehouse Created');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadWarehouses();
        this.tenant.reloadGodowns();
      },
      error: (err) => {
        this.savingWarehouse = false;
        console.error('Failed to create warehouse', err);
        const msg = err?.error?.message || 'Failed to create warehouse.';
        this.toast.error(msg, 'Creation Failed');
      },
    });
  }

  openEditWarehouseModal(wh: any) {
    this.warehouseToEdit = { ...wh };
    this.editWarehouseModalVisible = true;
  }

  submitEditWarehouse() {
    if (!this.warehouseToEdit || !this.warehouseToEdit.id) return;

    this.savingWarehouse = true;
    this.api.put(`/tenancy/godowns/${this.warehouseToEdit.id}`, this.warehouseToEdit).subscribe({
      next: () => {
        this.savingWarehouse = false;
        this.editWarehouseModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Warehouse "${this.warehouseToEdit.name}" updated successfully!`;
        this.toast.success(this.saveMessage, 'Warehouse Updated');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadWarehouses();
        this.tenant.reloadGodowns();
      },
      error: (err) => {
        this.savingWarehouse = false;
        console.error('Failed to update warehouse', err);
        const msg = err?.error?.message || 'Failed to update warehouse.';
        this.toast.error(msg, 'Update Failed');
      },
    });
  }

  openDeleteWarehouseModal(wh: any) {
    this.warehouseToDelete = wh;
    this.deleteWarehouseModalVisible = true;
  }

  confirmDeleteWarehouse() {
    if (!this.warehouseToDelete || !this.warehouseToDelete.id) return;

    this.savingWarehouse = true;
    this.api.delete(`/tenancy/godowns/${this.warehouseToDelete.id}`).subscribe({
      next: () => {
        this.savingWarehouse = false;
        this.deleteWarehouseModalVisible = false;
        this.saveSuccess = true;
        this.saveMessage = `Warehouse "${this.warehouseToDelete.name}" deleted successfully.`;
        this.toast.success(this.saveMessage, 'Warehouse Deleted');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadWarehouses();
        this.tenant.reloadGodowns();
      },
      error: (err) => {
        this.savingWarehouse = false;
        console.error('Failed to delete warehouse', err);
        const msg = err?.error?.message || 'Failed to delete warehouse.';
        this.toast.error(msg, 'Delete Failed');
      },
    });
  }

  openTaxModal() {
    this.newTax = {
      taxName: '',
      rate: 18,
      cessRate: 0,
      description: '',
    };
    this.showTaxModal = true;
  }

  submitTaxMaster() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId || !this.newTax.taxName) return;

    this.api.post('/settings/tax-masters', {
      ...this.newTax,
      companyId: compId,
    }).subscribe({
      next: () => {
        this.showTaxModal = false;
        this.saveSuccess = true;
        this.saveMessage = `New tax slab "${this.newTax.taxName}" added successfully!`;
        this.toast.success(this.saveMessage, 'Tax Slab Added');
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadAll();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to create tax slab.';
        this.toast.error(msg, 'Creation Failed');
      },
    });
  }
}
