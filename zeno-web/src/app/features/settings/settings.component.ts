import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';
import { MastersService } from '../../core/services/masters.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="settings-page">
      <!-- HEADER -->
      <div class="page-header">
        <div class="header-back-title">
          <button class="btn-back" (click)="goHome()" title="Back to Home / Dashboard">
            <i class="pi pi-arrow-left"></i>
          </button>
          <h1>{{ getActiveTabTitle() }}</h1>
        </div>
        <div class="header-actions">
          @if (activeTab === 'roles') {
            <button class="btn-primary" (click)="openNewRoleModal()">
              <i class="pi pi-plus"></i> New Custom Role
            </button>
            <button class="btn-primary" (click)="saveRolePermissions(selectedRole)" [disabled]="savingRole || !selectedRole">
              <i class="pi pi-check"></i> {{ savingRole ? 'Saving...' : 'Save Role & Note' }}
            </button>
          } @else if (activeTab === 'users') {
            <button class="btn-primary" (click)="openNewUserModal()">
              <i class="pi pi-user-plus"></i> Add User
            </button>
            <button class="btn-primary" (click)="saveAllUsers()" [disabled]="saving">
              <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save User Roles' }}
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
          <p class="card-description">
            Activate or deactivate enterprise modules on demand. Changes reflect immediately across workflows and menu trees.
          </p>

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
        <div class="roles-container">
          <div class="matrix-layout">
            <!-- ROLES SIDEBAR -->
            <div class="roles-list-panel zeno-card">
              <div class="panel-header">
                <span class="panel-title">Defined Roles ({{ roles.length }})</span>
                <button class="btn-primary btn-sm" (click)="openNewRoleModal()" title="Add Custom Role">
                  <i class="pi pi-plus"></i> New Role
                </button>
              </div>
              <div class="roles-list">
                @for (r of roles; track r.id) {
                  <div 
                    class="role-card-item" 
                    [class.selected]="selectedRole?.id === r.id"
                    (click)="selectRole(r)"
                  >
                    <div class="role-item-top">
                      <span class="role-name">{{ r.name }}</span>
                      @if (r.isSystem) {
                        <span class="badge-system">SYSTEM</span>
                      } @else {
                        <span class="badge-custom">CUSTOM</span>
                      }
                    </div>
                    <p class="role-desc">{{ r.description || 'Custom role definition' }}</p>
                    <div class="role-stats">
                      <i class="pi pi-lock"></i> {{ (r.permissions || []).length }} active privileges
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- PERMISSIONS MATRIX PANEL -->
            <div class="matrix-panel zeno-card">
              @if (selectedRole) {
                <div class="matrix-header">
                  <div class="role-header-info">
                    <div class="matrix-role-title">
                      @if (selectedRole.isSystem) {
                        <h2>{{ selectedRole.name }} Permissions</h2>
                        <span class="badge-system">Predefined System Role</span>
                      } @else {
                        <div class="role-name-edit-group">
                          <input 
                            type="text" 
                            class="role-title-input" 
                            [(ngModel)]="selectedRole.name" 
                            placeholder="Role Name *" 
                          />
                          <span class="badge-custom">Custom Role</span>
                        </div>
                      }
                    </div>
                    <div class="role-desc-group">
                      <label class="role-note-label">
                        <i class="pi pi-file-edit"></i> Role Note / Description:
                      </label>
                      <input 
                            type="text" 
                            class="role-note-input" 
                            [(ngModel)]="selectedRole.description" 
                            placeholder="Add role note or functional description..." 
                      />
                    </div>
                  </div>
                  <div class="matrix-header-actions">
                    <button class="btn-primary" (click)="saveRolePermissions(selectedRole)" [disabled]="savingRole">
                      <i class="pi pi-check"></i> {{ savingRole ? 'Saving...' : 'Save Role & Note' }}
                    </button>
                  </div>
                </div>

                <div class="matrix-table-wrap">
                  <table class="zeno-table matrix-table">
                    <thead>
                      <tr>
                        <th style="min-width: 200px;">Module & Resource</th>
                        <th>Category</th>
                        @for (act of permissionActions; track act.key) {
                          <th style="text-align: center; width: 85px;">{{ act.label }}</th>
                        }
                        <th style="text-align: center; width: 85px;">Grant All</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (mod of permissionModules; track mod.key) {
                        <tr>
                          <td class="module-cell">
                            <span class="module-name">{{ mod.label }}</span>
                          </td>
                          <td>
                            <span class="category-pill">{{ mod.category }}</span>
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
                              (click)="toggleAllModulePermissions(selectedRole, mod.key)"
                              title="Toggle All Privileges for this Module"
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 2.5: USERS -->
      @if (activeTab === 'users') {
        <div class="zeno-card">
          <div class="card-header-flex">
            <div>
              <div class="card-title">User Directory & Role Assignments ({{ users.length }})</div>
              <p class="card-description">Manage tenant users, assign functional roles, and control account active status.</p>
            </div>
            <div class="card-header-actions">
              <button class="btn-primary" (click)="openNewUserModal()">
                <i class="pi pi-user-plus"></i> Add User
              </button>
              <button class="btn-primary" (click)="saveAllUsers()" [disabled]="saving">
                <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save User Roles' }}
              </button>
            </div>
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
            <p class="card-description">
              Primary ledger accounts automatically debited or credited during standard transaction posting.
            </p>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Default Sales Account (Income) *</label>
                <select [(ngModel)]="settings.defaultSalesLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
                <span class="helper-text">Credited when billing customers on Sales Invoices</span>
              </div>

              <div class="form-group">
                <label>Default Sales Return Account (Inward)</label>
                <select [(ngModel)]="settings.defaultSalesReturnLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
                <span class="helper-text">Debited on customer Credit Notes and sales returns</span>
              </div>

              <div class="form-group">
                <label>Default Purchase Account (Expense) *</label>
                <select [(ngModel)]="settings.defaultPurchaseLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
                <span class="helper-text">Debited when recording incoming vendor Purchase Invoices</span>
              </div>

              <div class="form-group">
                <label>Default Purchase Return Account (Outward)</label>
                <select [(ngModel)]="settings.defaultPurchaseReturnLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }} ({{ l.ledgerGroup?.name }})</option>
                  }
                </select>
                <span class="helper-text">Credited on vendor Debit Notes and goods return</span>
              </div>

              <div class="form-group">
                <label>Default Round-Off Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Fractional currency round-off adjustments</span>
              </div>

              <div class="form-group">
                <label>Default Freight & Forwarding Ledger</label>
                <select [(ngModel)]="settings.defaultFreightLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Transportation, shipping and delivery charges</span>
              </div>
            </div>
          </div>

          <!-- SECTION 2: GST STATUTORY TAX LEDGERS (3 FIELDS PER LINE) -->
          <div class="zeno-card padded-card">
            <div class="card-title">GST Statutory Input & Output Tax Ledgers</div>
            <p class="card-description">
              Tax credit (Input) and tax liability (Output) accounts for automated CGST, SGST, IGST, and Cess distribution.
            </p>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Input CGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultCgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Central GST input tax credit account</span>
              </div>

              <div class="form-group">
                <label>Output CGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultCgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Central GST output tax liability account</span>
              </div>

              <div class="form-group">
                <label>Input SGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultSgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">State GST input tax credit account</span>
              </div>

              <div class="form-group">
                <label>Output SGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultSgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">State GST output tax liability account</span>
              </div>

              <div class="form-group">
                <label>Input IGST Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultIgstInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Inter-state integrated GST credit</span>
              </div>

              <div class="form-group">
                <label>Output IGST Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultIgstOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Inter-state integrated GST liability</span>
              </div>

              <div class="form-group">
                <label>Input Cess Ledger (Asset/Credit)</label>
                <select [(ngModel)]="settings.defaultCessInputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">GST Compensation Cess credit account</span>
              </div>

              <div class="form-group">
                <label>Output Cess Ledger (Liability)</label>
                <select [(ngModel)]="settings.defaultCessOutputLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">GST Compensation Cess liability account</span>
              </div>

              <div class="form-group">
                <label>Tax Round-Off Adjustment Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Rounding account for statutory fractional taxes</span>
              </div>
            </div>
          </div>

          <!-- SECTION 3: LIQUID SETTLEMENT & ADJUSTMENTS (3 FIELDS PER LINE) -->
          <div class="zeno-card padded-card">
            <div class="card-title">Settlement Funds, Cash & Bank Accounts</div>
            <p class="card-description">
              Default liquid accounts and transactional adjustments applied across vouchers.
            </p>
            <div class="mapping-grid">
              <div class="form-group">
                <label>Default Cash-in-Hand Ledger</label>
                <select [(ngModel)]="settings.defaultCashLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Standard liquid cash account for direct point-of-sale/payment</span>
              </div>

              <div class="form-group">
                <label>Default Operating Bank Ledger</label>
                <select [(ngModel)]="settings.defaultBankLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Primary bank ledger for wire transfers, cheques, and customer receipts</span>
              </div>

              <div class="form-group">
                <label>Default Discount Allowed (Expense)</label>
                <select [(ngModel)]="settings.defaultDiscountAllowedLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Discounts granted to customers on sales bills</span>
              </div>

              <div class="form-group">
                <label>Default Discount Received (Income)</label>
                <select [(ngModel)]="settings.defaultDiscountLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Cash discounts received from suppliers</span>
              </div>

              <div class="form-group">
                <label>Default Round-Off Ledger</label>
                <select [(ngModel)]="settings.defaultRoundOffLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Fractional currency round-off adjustments</span>
              </div>

              <div class="form-group">
                <label>Default Freight & Forwarding Ledger</label>
                <select [(ngModel)]="settings.defaultFreightLedgerId">
                  <option [ngValue]="null">-- Select Ledger --</option>
                  @for (l of ledgers; track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
                <span class="helper-text">Transportation, shipping and delivery charges</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: VOUCHER NUMBER CONFIGURATION -->
      @if (activeTab === 'vouchers') {
        <div class="zeno-card">
          <div class="card-header-flex">
            <div>
              <div class="card-title">Voucher Numbering Series & Rules</div>
              <p class="card-description">
                Configure prefixes, suffixes, numbering padding, and reset frequencies for all enterprise documents.
              </p>
            </div>
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
            <p class="card-description">Statutory thresholds and billing controls for sales orders and tax invoices.</p>
            
            <div class="config-grid">
              <div class="form-group">
                <label>Default Customer Credit Period (Days)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.salesSettings.defaultCreditPeriod" 
                  placeholder="30" 
                  min="0"
                />
                <span class="helper-text">Standard days before sales invoice is flagged as overdue</span>
              </div>

              <div class="form-group">
                <label>E-Way Bill Generation Threshold (₹)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.salesSettings.ewayBillThreshold" 
                  placeholder="50000" 
                  min="0"
                />
                <span class="helper-text">Mandatory E-Way bill alert for consignments exceeding this amount</span>
              </div>

              <div class="form-group">
                <label>Customer Credit Limit Enforcement</label>
                <select [(ngModel)]="settings.salesSettings.creditLimitAction">
                  <option value="WARN">Show Warning Alert on Exceeding</option>
                  <option value="BLOCK">Strict Block (Prevent Invoice Creation)</option>
                  <option value="IGNORE">No Verification</option>
                </select>
                <span class="helper-text">System reaction when customer ledger exceeds authorized limit</span>
              </div>

              <div class="form-group">
                <label>Default Sales Invoice Print Template</label>
                <select [(ngModel)]="settings.salesSettings.printTemplate">
                  <option value="TAX_INVOICE_GST">Standard GST Tax Invoice (A4)</option>
                  <option value="COMPACT_2COL">Compact 2-Column Template</option>
                  <option value="THERMAL_80MM">Thermal POS Receipt (80mm)</option>
                  <option value="EXPORT_INVOICE">Export & Commercial Invoice</option>
                </select>
                <span class="helper-text">Format chosen for print and customer PDF exports</span>
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
            <p class="card-description">Vendor bill controls, approval workflow limits, and automatic warehouse receiving rules.</p>
            
            <div class="config-grid">
              <div class="form-group">
                <label>PO Approval Authority Threshold (₹)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.purchaseSettings.poApprovalThreshold" 
                  placeholder="100000" 
                  min="0"
                />
                <span class="helper-text">Orders exceeding this total require manager authorization</span>
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
                <span class="helper-text">Permitted price deviation between PO rate and vendor bill rate</span>
              </div>

              <div class="form-group">
                <label>Default Vendor Credit Period (Days)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.purchaseSettings.defaultVendorCreditDays" 
                  placeholder="30" 
                  min="0"
                />
                <span class="helper-text">Standard payment terms for incoming vendor bills</span>
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
            <p class="card-description">Stock valuation methodology, batch tracking rules, and warehouse movements.</p>
            
            <div class="config-grid">
              <div class="form-group">
                <label>Default Stock Valuation Method</label>
                <select [(ngModel)]="settings.inventorySettings.valuationMethod">
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="WEIGHTED_AVG">Weighted Average Cost (WAC)</option>
                </select>
                <span class="helper-text">Methodology used to calculate balance sheet inventory valuation</span>
              </div>

              <div class="form-group">
                <label>Negative Stock Enforcement</label>
                <select [(ngModel)]="settings.inventorySettings.allowNegativeStock">
                  <option [ngValue]="false">Strict Block (Prevent negative stock)</option>
                  <option [ngValue]="true">Allowed with Warning Notification</option>
                </select>
                <span class="helper-text">Policy enforced when issuing stock with insufficient balance</span>
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
              <p class="card-description">
                Determine at which granular level GST rate rules are evaluated when generating PO, GRN, and Invoices.
              </p>

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
                <div>
                  <div class="card-title">Statutory GST Tax Slabs</div>
                  <p class="card-description">Standardized GST percentage rates available for inventory items and service vouchers</p>
                </div>
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

      <!-- TAB 9: COMPANY PROFILE (ACTIVE COMPANY & BRANCH DISPLAY) -->
      @if (activeTab === 'company') {
        <div class="zeno-card padded-card">
          <div class="card-title">Company & Branch Identity</div>
          <p class="card-description">Active organizational details, statutory tax IDs, and jurisdictional registrations.</p>

          <div class="company-profile-grid">
            <div class="profile-item">
              <span class="profile-label">Company Legal Name</span>
              <span class="profile-value bold">{{ companyDisplayName }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">GSTIN / Tax ID</span>
              <span class="profile-value code-badge">{{ companyGstin }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">PAN Number</span>
              <span class="profile-value code-badge">{{ companyPan }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">Active Branch</span>
              <span class="profile-value">{{ branchDisplayName }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">Branch Code</span>
              <span class="profile-value code-badge">{{ branchCodeDisplay }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">State / Jurisdiction</span>
              <span class="profile-value">{{ branchState }}</span>
            </div>
            <div class="profile-item full-width">
              <span class="profile-label">Registered Office Address</span>
              <span class="profile-value">{{ branchAddress }}</span>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CREATE CUSTOM ROLE -->
      @if (showNewRoleModal) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Create Custom Role</h3>
              <button class="close-btn" (click)="showNewRoleModal = false"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Role Name *</label>
                <input type="text" [(ngModel)]="newRole.name" placeholder="e.g. Sales Executive, Inventory Auditor" />
              </div>
              <div class="form-group">
                <label>Role Description</label>
                <textarea rows="3" [(ngModel)]="newRole.description" placeholder="Specify functional duties and access scope..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showNewRoleModal = false">Cancel</button>
              <button class="btn-primary" (click)="submitNewRole()">Create Role</button>
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
      margin-bottom: 4px;
    }

    .card-description {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin-bottom: 20px;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--surface-200);

      .card-title { margin-bottom: 0; }
      .card-description { margin-bottom: 0; margin-top: 4px; }
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

    .matrix-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 18px;
      align-items: start;
    }

    .roles-list-panel {
      padding: 16px;
      background: #ffffff;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--surface-200);
    }

    .panel-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--surface-800);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .roles-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-card-item {
      padding: 12px 14px;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-50);
        border-color: var(--surface-300);
      }

      &.selected {
        background: #f0f7ff;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 1px var(--primary-500);
      }
    }

    .role-item-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .role-name {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--surface-900);
    }

    .badge-system {
      font-size: 0.625rem;
      font-weight: 700;
      background: var(--surface-200);
      color: var(--surface-700);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-custom {
      font-size: 0.625rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-desc {
      font-size: 0.75rem;
      color: var(--surface-500);
      margin: 0 0 8px 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .role-stats {
      font-size: 0.6875rem;
      color: var(--surface-600);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Matrix Panel */
    .matrix-panel {
      padding: 20px 24px;
      background: #ffffff;
    }

    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--surface-200);
    }

    .role-header-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      max-width: 680px;
    }

    .matrix-role-title {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--surface-900);
      }
    }

    .role-name-edit-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .role-title-input {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--surface-900);
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      padding: 4px 10px;
      background: #ffffff;

      &:focus {
        border-color: var(--primary-500);
        outline: none;
      }
    }

    .role-desc-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-note-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-500);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .role-note-input {
      width: 100%;
      padding: 6px 12px;
      font-size: 0.8125rem;
      border: 1px solid var(--surface-300);
      border-radius: var(--radius-sm);
      background: var(--surface-50);
      color: var(--surface-800);

      &:focus {
        background: #ffffff;
        border-color: var(--primary-500);
        outline: none;
      }
    }

    .matrix-header-actions {
      display: flex;
      align-items: center;
    }

    .matrix-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: var(--surface-50);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--surface-600);
        padding: 10px 12px;
        border-bottom: 1px solid var(--surface-200);
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

    .module-cell {
      display: flex;
      flex-direction: column;
    }

    .module-name {
      font-weight: 600;
      color: var(--surface-800);
    }

    .category-pill {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--surface-600);
      background: var(--surface-100);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      white-space: nowrap;
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
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--surface-200);
        color: var(--surface-900);
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
      display: block;
      font-size: 0.75rem;
      color: var(--surface-400);
      margin-top: 4px;
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
  `],
})
export class SettingsComponent implements OnInit {
  activeTab: 'toggles' | 'roles' | 'users' | 'mappings' | 'vouchers' | 'sales' | 'purchase' | 'inventory' | 'gst' | 'taxes' | 'company' = 'toggles';
  gstSubTab: 'hierarchy' | 'slabs' = 'hierarchy';
  saving = false;
  saveSuccess = false;
  saveMessage = '';

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

  // Pre-seed all 6 system capability toggles immediately so UI is never blank
  toggles: any[] = [
    { featureKey: 'GST', isEnabled: true },
    { featureKey: 'PURCHASE_ORDER', isEnabled: true },
    { featureKey: 'GRN', isEnabled: true },
    { featureKey: 'VARIANTS', isEnabled: true },
    { featureKey: 'RACK_BIN', isEnabled: true },
    { featureKey: 'MANUFACTURING', isEnabled: true },
  ];

  taxMasters: any[] = [];
  ledgers: any[] = [];

  // Roles & Permissions state
  roles: any[] = [];
  users: any[] = [];
  selectedRole: any = null;
  rolesViewMode: 'matrix' | 'users' = 'matrix';
  savingRole = false;
  showNewRoleModal = false;
  newRole = { name: '', description: '' };
  showNewUserModal = false;
  newUser = { fullName: '', email: '', phone: '', roleId: '' };

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
    { key: 'LEDGER_GROUP', label: 'Ledger Groups', category: 'Masters' },
    { key: 'LEDGER', label: 'Ledgers', category: 'Masters' },
    { key: 'ITEM', label: 'Products & SKUs', category: 'Masters' },
    { key: 'ITEM_GROUP', label: 'Stock Groups', category: 'Masters' },
    { key: 'ITEM_CATEGORY', label: 'Stock Categories', category: 'Masters' },
    { key: 'UNIT', label: 'Units of Measure', category: 'Masters' },
    { key: 'VARIANT', label: 'Item Variants', category: 'Masters' },
    { key: 'PURCHASE_ORDER', label: 'Purchase Orders', category: 'Procure to Pay' },
    { key: 'GOODS_RECEIPT_NOTE', label: 'Goods Receipt (GRN)', category: 'Procure to Pay' },
    { key: 'PURCHASE_INVOICE', label: 'Purchase Invoices', category: 'Procure to Pay' },
    { key: 'PURCHASE_RETURN', label: 'Purchase Returns', category: 'Procure to Pay' },
    { key: 'VENDOR_PAYMENT', label: 'Vendor Payments', category: 'Procure to Pay' },
    { key: 'SALES_ORDER', label: 'Sales Orders', category: 'Sales & Billing' },
    { key: 'DELIVERY_CHALLAN', label: 'Delivery Challans', category: 'Sales & Billing' },
    { key: 'SALES_INVOICE', label: 'Sales Invoices', category: 'Sales & Billing' },
    { key: 'SALES_RETURN', label: 'Sales Returns', category: 'Sales & Billing' },
    { key: 'CUSTOMER_RECEIPT', label: 'Customer Receipts', category: 'Sales & Billing' },
    { key: 'SETTINGS', label: 'System Settings', category: 'Administration' },
    { key: 'ROLES', label: 'Roles & Privileges', category: 'Administration' },
    { key: 'USERS', label: 'User Directory', category: 'Administration' },
    { key: 'REPORTS', label: 'Financial Reports', category: 'Administration' },
  ];

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
    private tenant: TenantService,
    private masters: MastersService,
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
        ['toggles', 'roles', 'users', 'mappings', 'vouchers', 'sales', 'purchase', 'inventory', 'company'].includes(tab)
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
      case 'toggles':
        return 'Feature Toggles';
      case 'roles':
        return 'User Role & Permission';
      case 'users':
        return 'Users';
      case 'mappings':
        return 'Default Ledger Mapping';
      case 'vouchers':
        return 'Voucher Number Configuration';
      case 'sales':
        return 'Sales Configuration';
      case 'purchase':
        return 'Purchase Configuration';
      case 'inventory':
        return 'Inventory Configuration';
      case 'gst':
      case 'taxes':
        return 'GST & Tax Management';
      case 'company':
        return 'Company Profile';
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
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: (err: any) => {
        console.error('Failed to save role permissions', err);
        this.savingRole = false;
        alert(err?.error?.message || 'Failed to save role. Please check network/permission.');
      },
    });
  }

  openNewRoleModal() {
    this.newRole = { name: '', description: '' };
    this.showNewRoleModal = true;
  }

  submitNewRole() {
    if (!this.newRole.name.trim()) return;

    this.api.post('/rbac/roles', {
      name: this.newRole.name.trim(),
      description: this.newRole.description.trim(),
      permissions: [],
    }).subscribe({
      next: (created: any) => {
        this.showNewRoleModal = false;
        this.roles.push(created);
        this.selectedRole = created;
        this.saveSuccess = true;
        this.saveMessage = `New role "${created.name}" created successfully!`;
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: (err: any) => {
        alert(err?.error?.message || 'Failed to create role. Ensure role name is unique.');
      },
    });
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
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: (err: any) => {
        alert(err?.error?.message || 'Failed to create user. Ensure email is unique.');
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
        setTimeout(() => (this.saveSuccess = false), 2500);
      },
      error: (err: any) => {
        console.error('Failed to update user role', err);
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
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  toggleUserStatus(user: any) {
    user.isActive = !user.isActive;
    this.api.put(`/rbac/users/${user.id}`, { isActive: user.isActive }).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.saveMessage = `User status changed to ${user.isActive ? 'Active' : 'Inactive'}.`;
        setTimeout(() => (this.saveSuccess = false), 2500);
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
          setTimeout(() => (this.saveSuccess = false), 3500);
        },
        error: () => {
          this.saving = false;
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
        setTimeout(() => (this.saveSuccess = false), 3500);
      },
      error: () => {
        this.saving = false;
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
        setTimeout(() => (this.saveSuccess = false), 2500);
      },
      error: (err) => {
        console.error('Failed to update toggle', err);
      },
    });
  }

  formatFeatureName(key: string): string {
    switch (key) {
      case 'GST': return 'Goods & Services Tax (GST)';
      case 'PURCHASE_ORDER': return 'Purchase Orders (PO)';
      case 'GRN': return 'Goods Receipt Notes (GRN)';
      case 'VARIANTS': return 'Item Variants & Attributes';
      case 'RACK_BIN': return 'Godown & Rack/Bin Storage';
      case 'MANUFACTURING': return 'BOM & Assembly Manufacturing';
      default: return key;
    }
  }

  getFeatureDescription(key: string): string {
    switch (key) {
      case 'GST': return 'Enables statutory GSTIN calculations, HSN resolution, and balanced tax accounting ledgers.';
      case 'PURCHASE_ORDER': return 'Enables formal procurement workflow, tracking ordered vs pending quantities.';
      case 'GRN': return 'Gatekeeper warehouse stock-in step before finance invoice posting.';
      case 'VARIANTS': return 'Manage matrix items with sizes, colors, and SKU-level variance.';
      case 'RACK_BIN': return 'Granular inventory location tracking within godowns and warehouses.';
      case 'MANUFACTURING': return 'Bill of Materials composition, component consumption, and finished goods assembly.';
      default: return 'Core system functionality module.';
    }
  }

  getFeatureIcon(key: string): string {
    switch (key) {
      case 'GST': return 'pi pi-percentage';
      case 'PURCHASE_ORDER': return 'pi pi-shopping-cart';
      case 'GRN': return 'pi pi-box';
      case 'VARIANTS': return 'pi pi-tags';
      case 'RACK_BIN': return 'pi pi-warehouse';
      case 'MANUFACTURING': return 'pi pi-cog';
      default: return 'pi pi-sliders-h';
    }
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
        setTimeout(() => (this.saveSuccess = false), 3500);
        this.loadAll();
      },
    });
  }
}
