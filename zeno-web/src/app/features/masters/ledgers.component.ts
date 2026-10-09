import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { INDIAN_STATES } from '../../core/constants/states.constant';
import { exportToCsv } from '../../core/utils/export.util';

export const STANDARD_LEDGER_GROUPS: any[] = [
  { id: 'grp-sundry-creditors', name: 'Sundry Creditors (Vendors)', nature: 'LIABILITY', isCreditorVendor: true },
  { id: 'grp-sundry-debtors', name: 'Sundry Debtors (Customers)', nature: 'ASSET', isDebtorCustomer: true },
  { id: 'grp-bank-accounts', name: 'Bank Accounts', nature: 'ASSET' },
  { id: 'grp-cash-in-hand', name: 'Cash-in-hand', nature: 'ASSET' },
  { id: 'grp-duties-taxes', name: 'Duties & Taxes', nature: 'LIABILITY' },
  { id: 'grp-purchase-accounts', name: 'Purchase Accounts', nature: 'EXPENSE' },
  { id: 'grp-sales-accounts', name: 'Sales Accounts', nature: 'INCOME' },
  { id: 'grp-direct-expenses', name: 'Direct Expenses', nature: 'EXPENSE' },
  { id: 'grp-indirect-expenses', name: 'Indirect Expenses', nature: 'EXPENSE' },
  { id: 'grp-direct-incomes', name: 'Direct Incomes', nature: 'INCOME' },
  { id: 'grp-indirect-incomes', name: 'Indirect Incomes', nature: 'INCOME' },
  { id: 'grp-current-assets', name: 'Current Assets', nature: 'ASSET' },
  { id: 'grp-current-liabilities', name: 'Current Liabilities', nature: 'LIABILITY' },
  { id: 'grp-capital-account', name: 'Capital Account', nature: 'LIABILITY' },
  { id: 'grp-stock-in-hand', name: 'Stock-in-hand', nature: 'ASSET' },
];

@Component({
  selector: 'app-ledgers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      <!-- 1. LIST VIEW -->
      @if (viewMode === 'list') {
        <!-- PAGE HEADER -->
        <div class="page-header">
          <h1>Ledger</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create New Ledger
            </button>
          </div>
        </div>

        <!-- FILTER & SEARCH BAR -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="filter-actions">
            <select class="filter-select" [(ngModel)]="activeFilter">
              <option value="ALL">All Accounts ({{ ledgers.length }})</option>
              <option value="DEBTORS">Customers ({{ countDebtors() }})</option>
              <option value="CREDITORS">Vendors ({{ countCreditors() }})</option>
              <option value="BANK">Bank & Cash ({{ countBankCash() }})</option>
              <option value="DUTIES">Taxes ({{ countDuties() }})</option>
            </select>

            <button class="btn-export" (click)="exportLedgers()" [disabled]="filteredLedgers().length === 0" title="Export to CSV">
              <i class="pi pi-download"></i> Export
            </button>
          </div>
        </div>

        <!-- LEDGERS DATA TABLE -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Ledger Name</th>
                <th>Ledger Group</th>
                <th class="text-right">Opening Bal</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (l of filteredLedgers(); track l.id) {
                <tr class="table-row-hover" (click)="viewLedgerDetails(l)">
                  <td>
                    <div class="font-bold ledger-name-cell">{{ l.name }}</div>
                    @if (l.code) {
                      <div class="font-xs text-muted">Code: {{ l.code }}</div>
                    }
                  </td>
                  <td>
                    <span class="group-tag">{{ l.ledgerGroup?.name }}</span>
                  </td>
                  <td class="text-right font-mono font-bold">
                    ₹{{ l.openingBalance | number:'1.2-2' }} {{ l.balanceType }}
                  </td>
                  <td class="text-center" (click)="$event.stopPropagation()">
                    <div class="action-btn-group">
                      <button class="btn-icon" (click)="viewLedgerDetails(l)" title="View Details">
                        <i class="pi pi-eye"></i>
                      </button>
                      <button class="btn-icon" (click)="editLedger(l)" title="Edit Ledger">
                        <i class="pi pi-pencil"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredLedgers().length === 0) {
                <tr>
                  <td colspan="4" class="text-center empty-state-td">
                    <i class="pi pi-folder-open empty-icon"></i>
                    <p>No ledger accounts found matching your filter criteria</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- 2. FULL VIEW LEDGER CREATION / EDITING -->
      @if (viewMode === 'create' || viewMode === 'edit') {
        <div class="full-page-form">
          <!-- TOP HEADER -->
          <div class="full-page-header">
            <div class="header-left">
              <button class="btn-back" (click)="backToList()" title="Back to Ledgers List">
                <i class="pi pi-arrow-left"></i>
              </button>
              <div>
                <h2>{{ editingLedgerId ? 'Edit Ledger Account: ' + (form.name || '') : 'Create New Ledger Account' }}</h2>
              </div>
            </div>

            <div class="header-actions">
              <button type="button" class="btn-secondary" (click)="backToList()">
                <i class="pi pi-times"></i> Cancel
              </button>
              <button
                type="button"
                class="btn-primary"
                (click)="saveLedger()"
                [disabled]="submitting || !form.name || !form.ledgerGroupId"
              >
                @if (submitting) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingLedgerId ? 'Update Ledger' : 'Save Ledger' }}
                }
              </button>
            </div>
          </div>

          <!-- FULL SCREEN FORM CARD -->
          <div class="full-card">
            <!-- TAB BAR -->
            <div class="full-tabs">
              <button type="button" [class.active]="modalTab === 'basic'" (click)="modalTab = 'basic'">
                <i class="pi pi-id-card"></i> {{ isParty ? 'Basic & Tax Info' : 'Basic Info' }}
              </button>
              @if (isParty) {
                <button type="button" [class.active]="modalTab === 'address'" (click)="modalTab = 'address'">
                  <i class="pi pi-map-marker"></i> Address & Shipping
                </button>
                <button type="button" [class.active]="modalTab === 'contact'" (click)="modalTab = 'contact'">
                  <i class="pi pi-phone"></i> Contact Details
                </button>
                <button type="button" [class.active]="modalTab === 'bank'" (click)="modalTab = 'bank'">
                  <i class="pi pi-building"></i> Bank & Payment
                </button>
              }
            </div>

            <div class="full-body">
              @if (createError) {
                <div class="alert-error-box">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ createError }}</span>
                </div>
              }

              <div class="form-container">
                <!-- TAB 1: BASIC & STATUTORY -->
                @if (modalTab === 'basic') {
                  <div class="tab-content-panel">
                    <div class="form-grid-3">
                      <!-- Row 1 (3 fields) -->
                      <div class="form-group">
                        <label>Ledger Name *</label>
                        <input
                          type="text"
                          [(ngModel)]="form.name"
                          required
                        />
                      </div>
                      <div class="form-group">
                        <label>Account / Ref Code</label>
                        <input
                          type="text"
                          [(ngModel)]="form.code"
                        />
                      </div>
                      <div class="form-group">
                        <label>Ledger Group *</label>
                        <select [(ngModel)]="form.ledgerGroupId" (change)="onGroupChange()" required>
                          <option value="">-- Select Ledger Group --</option>
                          @for (g of groups; track g.id) {
                            <option [value]="g.id">
                              {{ g.name }}
                            </option>
                          }
                        </select>
                        @if (loadingGroups) {
                          <span class="helper-text text-amber">
                            <i class="pi pi-spin pi-spinner"></i> Loading groups...
                          </span>
                        }
                      </div>

                      @if (isParty) {
                        <!-- Row 2 for Party (3 fields) -->
                        <div class="form-group">
                          <label>State & Code</label>
                          <select [(ngModel)]="form.stateCode" (change)="onPartyStateCodeChange()">
                            <option value="">-- Select State --</option>
                            @for (s of indianStates; track s.code) {
                              <option [value]="s.code">
                                {{ s.code }} - {{ s.name }}
                              </option>
                            }
                          </select>
                        </div>
                        <div class="form-group">
                          <label>GSTIN (15 Digits)</label>
                          <input
                            type="text"
                            [(ngModel)]="form.gstin"
                            (input)="onGstinInput()"
                            maxlength="15"
                            class="font-mono"
                          />
                        </div>
                        <div class="form-group">
                          <label>PAN (10 Digits)</label>
                          <input
                            type="text"
                            [(ngModel)]="form.pan"
                            maxlength="10"
                            class="font-mono"
                          />
                        </div>

                        <!-- Row 3 for Party (3 fields) -->
                        <div class="form-group">
                          <label>Opening Balance (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            [(ngModel)]="form.openingBalance"
                          />
                        </div>
                        <div class="form-group">
                          <label>Balance Type</label>
                          <select [(ngModel)]="form.balanceType">
                            <option value="DR">DR (Debit - Receivable / Asset)</option>
                            <option value="CR">CR (Credit - Payable / Liability)</option>
                          </select>
                        </div>
                        <div class="form-group">
                          <label>Credit Limit (₹)</label>
                          <input
                            type="number"
                            step="1000"
                            [(ngModel)]="form.creditLimit"
                          />
                        </div>

                        <!-- Row 4 for Party (3 fields) -->
                        <div class="form-group">
                          <label>Credit Period (Days)</label>
                          <input
                            type="number"
                            [(ngModel)]="form.creditDays"
                          />
                        </div>
                        <div class="form-group"></div>
                        <div class="form-group"></div>
                      } @else {
                        <!-- Row 2 for Non-Party (3 fields) -->
                        <div class="form-group">
                          <label>Opening Balance (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            [(ngModel)]="form.openingBalance"
                          />
                        </div>
                        <div class="form-group">
                          <label>Balance Type</label>
                          <select [(ngModel)]="form.balanceType">
                            <option value="DR">DR (Debit - Receivable / Asset)</option>
                            <option value="CR">CR (Credit - Payable / Liability)</option>
                          </select>
                        </div>
                        <div class="form-group"></div>
                      }
                    </div>
                  </div>
                }

                <!-- TAB 2: ADDRESS & SHIPPING -->
                @if (modalTab === 'address') {
                  <div class="tab-content-panel">
                    <div class="form-group" style="margin-bottom: 16px;">
                      <label>Billing / Registered Office Address</label>
                      <textarea
                        [(ngModel)]="form.address"
                        rows="3"
                      ></textarea>
                    </div>

                    <div class="form-grid-3">
                      <div class="form-group">
                        <label>City</label>
                        <input type="text" [(ngModel)]="form.city" />
                      </div>
                      <div class="form-group">
                        <label>State</label>
                        <select [(ngModel)]="form.state" (change)="onPartyStateChange()">
                          <option value="">-- Select State --</option>
                          @for (s of indianStates; track s.code) {
                            <option [value]="s.name">
                              {{ s.name }} ({{ s.code }})
                            </option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Pincode / ZIP</label>
                        <input type="text" [(ngModel)]="form.pincode" maxlength="10" />
                      </div>
                    </div>

                    <div class="form-grid-3" style="margin-top: 16px;">
                      <div class="form-group">
                        <label>Country</label>
                        <input type="text" [(ngModel)]="form.country" />
                      </div>
                      <div class="form-group"></div>
                      <div class="form-group"></div>
                    </div>

                    <div class="shipping-section-header" style="margin-top: 20px;">
                      <label>Shipping / Consignee Address</label>
                      <button type="button" class="btn-copy-link" (click)="copyBillingToShipping()">
                        <i class="pi pi-copy"></i> Copy from Billing Address
                      </button>
                    </div>
                    <div class="form-group">
                      <textarea
                        [(ngModel)]="form.shippingAddress"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                }

                <!-- TAB 3: CONTACT DETAILS -->
                @if (modalTab === 'contact') {
                  <div class="tab-content-panel">
                    <div class="form-grid-3">
                      <div class="form-group">
                        <label>Contact Person / Authority</label>
                        <input
                          type="text"
                          [(ngModel)]="form.contactPerson"
                        />
                      </div>
                      <div class="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          [(ngModel)]="form.email"
                        />
                      </div>
                      <div class="form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          [(ngModel)]="form.mobile"
                          class="font-mono"
                        />
                      </div>

                      <div class="form-group">
                        <label>Office Telephone / Landline</label>
                        <input
                          type="text"
                          [(ngModel)]="form.phone"
                          class="font-mono"
                        />
                      </div>
                      <div class="form-group">
                        <label>Official Website</label>
                        <input
                          type="text"
                          [(ngModel)]="form.website"
                        />
                      </div>
                      <div class="form-group"></div>
                    </div>
                  </div>
                }

                <!-- TAB 4: BANK DETAILS -->
                @if (modalTab === 'bank') {
                  <div class="tab-content-panel">
                    <div class="form-grid-3">
                      <div class="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          [(ngModel)]="form.bankName"
                        />
                      </div>
                      <div class="form-group">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          [(ngModel)]="form.bankAccountName"
                        />
                      </div>
                      <div class="form-group">
                        <label>Bank Account Number</label>
                        <input
                          type="text"
                          [(ngModel)]="form.bankAccountNumber"
                          class="font-mono"
                        />
                      </div>

                      <div class="form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          [(ngModel)]="form.bankIfsc"
                          class="font-mono"
                          maxlength="11"
                        />
                      </div>
                      <div class="form-group">
                        <label>Branch Name</label>
                        <input
                          type="text"
                          [(ngModel)]="form.bankBranch"
                        />
                      </div>
                      <div class="form-group">
                        <label>UPI ID / VPA</label>
                        <input
                          type="text"
                          [(ngModel)]="form.upiId"
                        />
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- FOOTER BAR -->
            <div class="full-footer">
              <button type="button" class="btn-secondary" (click)="backToList()">
                <i class="pi pi-times"></i> Cancel
              </button>
              @if (isParty && modalTab !== 'bank') {
                <button type="button" class="btn-secondary" (click)="nextModalTab()">
                  Next <i class="pi pi-arrow-right"></i>
                </button>
              }
              <button
                type="button"
                class="btn-primary"
                (click)="saveLedger()"
                [disabled]="submitting || !form.name || !form.ledgerGroupId"
              >
                @if (submitting) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ editingLedgerId ? 'Update Ledger' : 'Save Ledger' }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- VIEW LEDGER DETAIL MODAL -->
    @if (viewingLedger) {
      <div class="modal-backdrop" (click)="viewingLedger = null">
        <div class="modal-dialog view-ledger-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="view-header-title">
              <div class="avatar-initials">
                {{ viewingLedger.name?.charAt(0) || 'L' }}
              </div>
              <div>
                <h3>{{ viewingLedger.name }}</h3>
                <div class="view-badges">
                  <span class="group-tag">{{ viewingLedger.ledgerGroup?.name }}</span>
                  @if (viewingLedger.ledgerGroup?.isCreditorVendor) {
                    <span class="badge-pill badge-partial">Vendor</span>
                  } @else if (viewingLedger.ledgerGroup?.isDebtorCustomer) {
                    <span class="badge-pill badge-cleared">Customer</span>
                  }
                  <span class="badge-pill badge-cleared">Active</span>
                </div>
              </div>
            </div>
            <button class="close-btn" (click)="viewingLedger = null"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body view-modal-body">
            <!-- CARDS GRID -->
            <div class="view-grid">
              <!-- CARD 1: STATUTORY / FINANCIAL BALANCES -->
              <div class="view-card">
                <div class="view-card-title">
                  <i class="pi pi-id-card"></i> {{ isViewingParty ? 'Statutory & Balances' : 'Account & Balances' }}
                </div>
                @if (isViewingParty) {
                  <div class="view-field">
                    <span class="label">GSTIN:</span>
                    <strong class="font-mono">{{ viewingLedger.gstin || 'Unregistered' }}</strong>
                  </div>
                  <div class="view-field">
                    <span class="label">PAN:</span>
                    <strong class="font-mono">{{ viewingLedger.pan || '—' }}</strong>
                  </div>
                  <div class="view-field">
                    <span class="label">State Code:</span>
                    <span>{{ viewingLedger.stateCode || '27' }}</span>
                  </div>
                }
                <div class="view-field highlight-field">
                  <span class="label">Opening Balance:</span>
                  <strong class="font-mono">₹{{ viewingLedger.openingBalance | number:'1.2-2' }} {{ viewingLedger.balanceType }}</strong>
                </div>
                @if (isViewingParty && viewingLedger.creditLimit) {
                  <div class="view-field">
                    <span class="label">Credit Limit:</span>
                    <span>₹{{ viewingLedger.creditLimit | number:'1.2-2' }} ({{ viewingLedger.creditDays || 0 }} days)</span>
                  </div>
                }
              </div>

              @if (isViewingParty) {
                <!-- CARD 2: ADDRESS -->
                <div class="view-card">
                  <div class="view-card-title"><i class="pi pi-map-marker"></i> Billing & Shipping</div>
                  <div class="view-field">
                    <span class="label">Billing Address:</span>
                    <p class="address-text">{{ viewingLedger.address || 'No billing address specified' }}</p>
                  </div>
                  <div class="view-field">
                    <span class="label">Location:</span>
                    <span>{{ viewingLedger.city || '—' }}, {{ viewingLedger.state || '—' }} {{ viewingLedger.pincode }}</span>
                  </div>
                  @if (viewingLedger.shippingAddress) {
                    <div class="view-field">
                      <span class="label">Shipping Address:</span>
                      <p class="address-text">{{ viewingLedger.shippingAddress }}</p>
                    </div>
                  }
                </div>

                <!-- CARD 3: CONTACT -->
                <div class="view-card">
                  <div class="view-card-title"><i class="pi pi-phone"></i> Contact Details</div>
                  <div class="view-field">
                    <span class="label">Contact Person:</span>
                    <strong>{{ viewingLedger.contactPerson || '—' }}</strong>
                  </div>
                  <div class="view-field">
                    <span class="label">Mobile / Phone:</span>
                    <span class="font-mono">{{ viewingLedger.mobile || viewingLedger.phone || '—' }}</span>
                  </div>
                  <div class="view-field">
                    <span class="label">Email:</span>
                    <span>{{ viewingLedger.email || '—' }}</span>
                  </div>
                  <div class="view-field">
                    <span class="label">Website:</span>
                    <span>{{ viewingLedger.website || '—' }}</span>
                  </div>
                </div>

                <!-- CARD 4: BANK -->
                <div class="view-card">
                  <div class="view-card-title"><i class="pi pi-building"></i> Banking Profile</div>
                  <div class="view-field">
                    <span class="label">Bank Name:</span>
                    <strong>{{ viewingLedger.bankName || '—' }}</strong>
                  </div>
                  <div class="view-field">
                    <span class="label">Account Number:</span>
                    <strong class="font-mono">{{ viewingLedger.bankAccountNumber || '—' }}</strong>
                  </div>
                  <div class="view-field">
                    <span class="label">IFSC Code:</span>
                    <span class="font-mono">{{ viewingLedger.bankIfsc || '—' }}</span>
                  </div>
                  <div class="view-field">
                    <span class="label">Branch:</span>
                    <span>{{ viewingLedger.bankBranch || '—' }}</span>
                  </div>
                  @if (viewingLedger.upiId) {
                    <div class="view-field">
                      <span class="label">UPI VPA:</span>
                      <span class="font-mono">{{ viewingLedger.upiId }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="viewingLedger = null">Close</button>
            <button class="btn-primary" (click)="editLedger(viewingLedger); viewingLedger = null;">
              <i class="pi pi-pencil"></i> Edit Profile
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .p2p-page { display: flex; flex-direction: column; gap: 20px; }
    
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    /* Filter & Search Bar */
    .filter-card {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 400px;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--surface-400);
      }

      input {
        width: 100%;
        padding: 8px 12px 8px 34px;
        border: 1px solid var(--surface-200);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.15s ease;

        &:focus {
          border-color: var(--primary-600);
        }
      }
    }

    .status-tabs {
      display: flex;
      gap: 6px;
      background: var(--surface-100);
      padding: 4px;
      border-radius: var(--radius-sm);
      flex-wrap: wrap;

      button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--surface-600);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          color: var(--surface-900);
        }

        &.active {
          background: #ffffff;
          color: var(--primary-700);
          box-shadow: var(--shadow-subtle);
        }
      }
    }

    .table-row-hover {
      cursor: pointer;
      transition: background-color 0.15s ease;
      &:hover td {
        background-color: #f8faff;
      }
    }

    .ledger-name-cell {
      color: var(--surface-900);
    }

    .group-tag {
      background: var(--surface-100);
      color: var(--surface-700);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-bank {
      background-color: #ede9fe;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
    }

    .badge-general {
      background-color: #f1f5f9;
      color: #475569;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-icon {
      background: transparent;
      border: 1px solid var(--surface-200);
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--surface-600);
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-100);
        color: var(--primary-600);
        border-color: var(--primary-300);
      }
    }

    .empty-state-td {
      padding: 48px 16px;
      color: var(--surface-400);

      .empty-icon {
        font-size: 2.5rem;
        margin-bottom: 8px;
      }
    }

    /* Full View Styles */
    .full-page-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .full-page-header {
      display: flex; align-items: center; justify-content: space-between;
      h2 { font-size: 1.35rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .btn-back {
      display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px;
      border: 1px solid var(--surface-200); background: #fff; color: var(--surface-700); cursor: pointer; font-size: 1rem;
      transition: all 0.2s;
      &:hover { background: var(--surface-100); color: var(--surface-900); border-color: var(--surface-300); }
    }

    .full-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden; }
    .full-tabs {
      display: flex; border-bottom: 1px solid var(--surface-200); background: var(--surface-50); padding: 0 12px;
      button {
        padding: 14px 22px; border: none; background: none; font-size: 0.875rem; font-weight: 600; color: var(--surface-600);
        cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid transparent; transition: all 0.15s;
        &.active { background: #ffffff; color: var(--primary-600); border-bottom-color: var(--primary-600); }
        &:hover:not(.active) { color: var(--surface-900); }
      }
    }
    .full-body { padding: 24px; min-height: 480px; }
    .full-footer { padding: 16px 24px; border-top: 1px solid var(--surface-200); display: flex; justify-content: flex-end; gap: 12px; background: var(--surface-50); }
    .form-container { max-width: 1000px; }

    /* Modal Styling */
    .ledger-modal-dialog {
      max-width: 780px;
      width: 95%;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin: 0;
      }
    }

    .modal-subtitle {
      display: none;
    }

    .party-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;

      &.customer {
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.vendor {
        background-color: #eff6ff;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      }
    }

    /* Modal Navigation Tabs */
    .modal-tabs {
      display: flex;
      border-bottom: 2px solid var(--surface-200);
      background-color: var(--surface-50);
      padding: 0 24px;
      gap: 8px;

      button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        padding: 12px 16px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--surface-600);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s ease;

        &:hover {
          color: var(--primary-600);
        }

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
          background-color: var(--surface-0);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }
      }
    }

    .tab-indicator-badge {
      font-size: 0.6875rem;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .tab-content-panel {
      animation: fadeIn 0.15s ease-in;
    }

    .panel-intro-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8faff;
      border: 1px solid #dbeafe;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      margin-bottom: 18px;

      i {
        font-size: 1.25rem;
        color: var(--primary-600);
      }

      strong {
        font-size: 0.875rem;
        color: var(--surface-900);
      }

      p {
        font-size: 0.75rem;
        color: var(--surface-500);
        margin: 0;
      }
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 14px;

      .flex-1 { flex: 1; }
      .flex-2 { flex: 2; }
      .form-group { margin-bottom: 0; }
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 14px;
      .form-group { margin-bottom: 0; }
    }

    .shipping-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      margin-bottom: 6px;

      label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--surface-700);
      }
    }

    .btn-copy-link {
      background: none;
      border: none;
      color: var(--primary-600);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    .credit-terms-panel {
      background: var(--surface-50);
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-200);
      margin-top: 10px;
    }

    .alert-error-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--danger-bg);
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .text-amber { color: #d97706; }
    .text-muted { color: var(--surface-400); }
    .font-xs { font-size: 0.75rem; }

    /* View Modal */
    .view-ledger-modal {
      max-width: 840px;
      width: 95%;
    }

    .view-header-title {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar-initials {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 800;
    }

    .view-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }

    .view-modal-body {
      background: var(--surface-50);
      padding: 20px;
    }

    .view-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .view-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 16px;
      box-shadow: var(--shadow-subtle);

      .view-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--surface-900);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--surface-100);

        i {
          color: var(--primary-600);
        }
      }
    }

    .view-field {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      font-size: 0.8125rem;

      .label {
        color: var(--surface-500);
        font-weight: 500;
      }

      strong, span {
        color: var(--surface-800);
        text-align: right;
      }

      &.highlight-field {
        background: #f0fdf4;
        padding: 6px 8px;
        border-radius: 4px;
        strong {
          color: #166534;
        }
      }
    }

    .address-text {
      font-size: 0.8125rem;
      color: var(--surface-800);
      text-align: right;
      max-width: 60%;
      margin: 0;
      line-height: 1.35;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class LedgersComponent implements OnInit {
  readonly indianStates = INDIAN_STATES;
  ledgers: any[] = [];
  groups: any[] = [];
  loadingGroups = false;
  pendingPartyRole: 'CUSTOMER' | 'VENDOR' | null = null;
  searchQuery = '';
  activeFilter: 'ALL' | 'DEBTORS' | 'CREDITORS' | 'BANK' | 'DUTIES' = 'ALL';

  viewMode: 'list' | 'create' | 'edit' = 'list';
  showCreateModal = false;
  viewingLedger: any = null;
  editingLedgerId: string | null = null;
  modalTab: 'basic' | 'address' | 'contact' | 'bank' = 'basic';
  submitting = false;
  createError = '';

  form: any = this.getInitialForm();

  constructor(
    private masters: MastersService,
    public tenant: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    // Load immediately using active or stored company
    this.loadLedgers();
    this.loadGroups();

    // Also listen to hierarchy changes
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadLedgers();
        this.loadGroups();
      },
    });
  }

  getInitialForm() {
    return {
      name: '',
      code: '',
      ledgerGroupId: '',
      gstin: '',
      pan: '',
      stateCode: '27',
      openingBalance: 0,
      balanceType: 'DR',
      creditLimit: null,
      creditDays: 30,
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      shippingAddress: '',
      contactPerson: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankBranch: '',
      upiId: '',
    };
  }

  loadLedgers() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getLedgers(compId).subscribe({
      next: (res) => (this.ledgers = res || []),
      error: (err) => console.error('Failed to load ledgers', err),
    });
  }

  loadGroups(onComplete?: () => void) {
    this.loadingGroups = true;
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.masters.getLedgerGroups(compId || undefined).subscribe({
      next: (res) => {
        this.loadingGroups = false;
        if (res && res.length > 0) {
          const seen = new Set<string>();
          this.groups = res.filter((g: any) => {
            const key = (g.name || '').trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        } else if (this.groups.length === 0) {
          this.groups = [...STANDARD_LEDGER_GROUPS];
        }
        this.applyDefaultGroupSelection();
        if (onComplete) onComplete();
      },
      error: (err) => {
        console.error('Failed to load ledger groups', err);
        this.loadingGroups = false;
        if (this.groups.length === 0) {
          this.groups = [...STANDARD_LEDGER_GROUPS];
        }
        this.applyDefaultGroupSelection();
        if (onComplete) onComplete();
      },
    });
  }

  applyDefaultGroupSelection() {
    if (!this.form.ledgerGroupId && this.groups.length > 0) {
      if (this.pendingPartyRole === 'CUSTOMER') {
        const customerGrp =
          this.groups.find((g) => g.isDebtorCustomer) ||
          this.groups.find((g) => (g.name || '').toLowerCase().includes('debtor'));
        if (customerGrp) {
          this.form.ledgerGroupId = customerGrp.id;
          this.onGroupChange();
          return;
        }
      } else if (this.pendingPartyRole === 'VENDOR') {
        const vendorGrp =
          this.groups.find((g) => g.isCreditorVendor) ||
          this.groups.find((g) => (g.name || '').toLowerCase().includes('creditor'));
        if (vendorGrp) {
          this.form.ledgerGroupId = vendorGrp.id;
          this.onGroupChange();
          return;
        }
      }

      const defaultGrp =
        this.groups.find((g) => g.isCreditorVendor) ||
        this.groups.find((g) => (g.name || '').toLowerCase().includes('creditor')) ||
        this.groups.find((g) => g.isDebtorCustomer) ||
        this.groups[0];

      if (defaultGrp) {
        this.form.ledgerGroupId = defaultGrp.id;
        this.onGroupChange();
      }
    }
  }

  isGroupParty(group: any): boolean {
    if (!group) return false;
    if (group.isDebtorCustomer || group.isCreditorVendor) return true;
    const name = (group.name || '').toLowerCase();
    const code = (group.code || '').toLowerCase();
    return (
      name.includes('debtor') ||
      name.includes('creditor') ||
      name.includes('customer') ||
      name.includes('vendor') ||
      name.includes('supplier') ||
      code.includes('debtor') ||
      code.includes('creditor')
    );
  }

  isDebtorGroup(group: any): boolean {
    if (!group) return false;
    if (group.isDebtorCustomer) return true;
    const name = (group.name || '').toLowerCase();
    const code = (group.code || '').toLowerCase();
    return name.includes('debtor') || name.includes('customer') || name.includes('client') || code.includes('debtor');
  }

  isCreditorGroup(group: any): boolean {
    if (!group) return false;
    if (group.isCreditorVendor) return true;
    const name = (group.name || '').toLowerCase();
    const code = (group.code || '').toLowerCase();
    return name.includes('creditor') || name.includes('vendor') || name.includes('supplier') || code.includes('creditor');
  }

  get isParty(): boolean {
    const selected = this.groups.find((g) => g.id === this.form.ledgerGroupId);
    return this.isGroupParty(selected);
  }

  get partyRole(): 'CUSTOMER' | 'VENDOR' | 'OTHER' {
    const selected = this.groups.find((g) => g.id === this.form.ledgerGroupId);
    if (this.isDebtorGroup(selected)) return 'CUSTOMER';
    if (this.isCreditorGroup(selected)) return 'VENDOR';
    return 'OTHER';
  }

  get isViewingParty(): boolean {
    if (!this.viewingLedger?.ledgerGroup) return false;
    return this.isGroupParty(this.viewingLedger.ledgerGroup);
  }

  onGroupChange() {
    const selected = this.groups.find((g) => g.id === this.form.ledgerGroupId);
    if (selected) {
      if (this.isDebtorGroup(selected)) {
        this.form.balanceType = 'DR';
      } else if (this.isCreditorGroup(selected)) {
        this.form.balanceType = 'CR';
      } else if (selected.nature === 'LIABILITY' || selected.nature === 'INCOME') {
        this.form.balanceType = 'CR';
      } else {
        this.form.balanceType = 'DR';
      }
    }
    // If switched away from sundry debtors/creditors, reset modal tab to basic and clear party tax fields
    if (!this.isParty) {
      if (this.modalTab !== 'basic') {
        this.modalTab = 'basic';
      }
      this.form.gstin = '';
      this.form.pan = '';
    }
  }

  onPartyStateCodeChange() {
    const found = this.indianStates.find((s) => s.code === this.form.stateCode);
    if (found) {
      this.form.state = found.name;
    }
  }

  onPartyStateChange() {
    const found = this.indianStates.find(
      (s) => s.name.toLowerCase() === (this.form.state || '').trim().toLowerCase(),
    );
    if (found) {
      this.form.stateCode = found.code;
    }
  }

  onGstinInput() {
    const gstin = (this.form.gstin || '').trim().toUpperCase();
    this.form.gstin = gstin;
    if (gstin.length >= 2) {
      const code = gstin.substring(0, 2);
      this.form.stateCode = code;
      const found = this.indianStates.find((s) => s.code === code);
      if (found) {
        this.form.state = found.name;
      }
    }
    if (gstin.length >= 12) {
      this.form.pan = gstin.substring(2, 12);
    }
  }

  copyBillingToShipping() {
    let fullBilling = this.form.address || '';
    if (this.form.city || this.form.state || this.form.pincode) {
      const parts = [this.form.city, this.form.state, this.form.pincode].filter(Boolean);
      if (parts.length > 0) {
        fullBilling += fullBilling ? `\n${parts.join(', ')}` : parts.join(', ');
      }
    }
    this.form.shippingAddress = fullBilling;
  }

  backToList() {
    this.viewMode = 'list';
    this.editingLedgerId = null;
  }

  openCreateModal() {
    this.editingLedgerId = null;
    this.form = this.getInitialForm();
    this.modalTab = 'basic';
    this.createError = '';
    this.pendingPartyRole = null;

    if (this.groups.length === 0) {
      this.loadGroups(() => {
        this.applyDefaultGroupSelection();
      });
    } else {
      this.applyDefaultGroupSelection();
    }
    this.viewMode = 'create';
    this.showCreateModal = false;
  }

  openPartyModal(type: 'CUSTOMER' | 'VENDOR') {
    this.editingLedgerId = null;
    this.form = this.getInitialForm();
    this.modalTab = 'basic';
    this.createError = '';
    this.pendingPartyRole = type;

    if (this.groups.length === 0) {
      this.loadGroups(() => {
        this.applyDefaultGroupSelection();
      });
    } else {
      this.applyDefaultGroupSelection();
    }
    this.viewMode = 'create';
    this.showCreateModal = false;
  }

  editLedger(l: any) {
    this.editingLedgerId = l.id;
    this.pendingPartyRole = null;
    this.form = {
      name: l.name || '',
      code: l.code || '',
      ledgerGroupId: l.ledgerGroupId || '',
      gstin: l.gstin || '',
      pan: l.pan || '',
      stateCode: l.stateCode || '27',
      openingBalance: l.openingBalance || 0,
      balanceType: l.balanceType || 'DR',
      creditLimit: l.creditLimit || null,
      creditDays: l.creditDays || 30,
      address: l.address || '',
      city: l.city || '',
      state: l.state || '',
      pincode: l.pincode || '',
      country: l.country || 'India',
      shippingAddress: l.shippingAddress || '',
      contactPerson: l.contactPerson || '',
      phone: l.phone || '',
      mobile: l.mobile || '',
      email: l.email || '',
      website: l.website || '',
      bankName: l.bankName || '',
      bankAccountName: l.bankAccountName || '',
      bankAccountNumber: l.bankAccountNumber || '',
      bankIfsc: l.bankIfsc || '',
      bankBranch: l.bankBranch || '',
      upiId: l.upiId || '',
    };
    this.modalTab = 'basic';
    this.createError = '';
    if (this.groups.length === 0) {
      this.loadGroups();
    }
    this.viewMode = 'edit';
    this.showCreateModal = false;
  }

  nextModalTab() {
    if (!this.isParty) return;
    if (this.modalTab === 'basic') this.modalTab = 'address';
    else if (this.modalTab === 'address') this.modalTab = 'contact';
    else if (this.modalTab === 'contact') this.modalTab = 'bank';
  }

  saveLedger() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.submitting = true;
    this.createError = '';

    const payload = {
      ...this.form,
      companyId: compId,
      openingBalance: Number(this.form.openingBalance) || 0,
      creditLimit: this.form.creditLimit ? Number(this.form.creditLimit) : 0,
      creditDays: this.form.creditDays ? Number(this.form.creditDays) : 0,
    };

    const request$ = this.editingLedgerId
      ? this.masters.updateLedger(this.editingLedgerId, payload)
      : this.masters.createLedger(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success(
          `Ledger "${this.form.name}" ${this.editingLedgerId ? 'updated' : 'created'} successfully!`,
          'Ledger Saved',
        );
        this.viewMode = 'list';
        this.editingLedgerId = null;
        this.showCreateModal = false;
        this.loadLedgers();
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to save ledger profile';
        this.toast.error(this.createError, 'Save Failed');
      },
    });
  }

  viewLedgerDetails(l: any) {
    this.viewingLedger = l;
  }

  isBankGroup(group: any): boolean {
    if (!group) return false;
    const n = (group.name || '').toLowerCase();
    return n.includes('bank') || n.includes('cash');
  }

  countDebtors(): number {
    return this.ledgers.filter((l) => l.ledgerGroup?.isDebtorCustomer).length;
  }

  countCreditors(): number {
    return this.ledgers.filter((l) => l.ledgerGroup?.isCreditorVendor).length;
  }

  countBankCash(): number {
    return this.ledgers.filter((l) => this.isBankGroup(l.ledgerGroup)).length;
  }

  countDuties(): number {
    return this.ledgers.filter((l) => (l.ledgerGroup?.name || '').toLowerCase().includes('duties')).length;
  }

  filteredLedgers(): any[] {
    let list = this.ledgers;

    if (this.activeFilter === 'DEBTORS') {
      list = list.filter((l) => l.ledgerGroup?.isDebtorCustomer);
    } else if (this.activeFilter === 'CREDITORS') {
      list = list.filter((l) => l.ledgerGroup?.isCreditorVendor);
    } else if (this.activeFilter === 'BANK') {
      list = list.filter((l) => this.isBankGroup(l.ledgerGroup));
    } else if (this.activeFilter === 'DUTIES') {
      list = list.filter((l) => (l.ledgerGroup?.name || '').toLowerCase().includes('duties'));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter((l) => {
        return (
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.code && l.code.toLowerCase().includes(q)) ||
          (l.gstin && l.gstin.toLowerCase().includes(q)) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.phone && l.phone.toLowerCase().includes(q)) ||
          (l.mobile && l.mobile.toLowerCase().includes(q)) ||
          (l.ledgerGroup?.name && l.ledgerGroup.name.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }

  exportLedgers() {
    const list = this.filteredLedgers();
    if (!list || list.length === 0) return;
    const headers = ['Ledger Name', 'Code', 'Group', 'GSTIN', 'PAN', 'City', 'State', 'Phone', 'Email', 'Opening Balance', 'Dr/Cr'];
    const rows = list.map((l) => [
      l.name || '',
      l.code || '',
      l.ledgerGroup?.name || '',
      l.gstin || '',
      l.pan || '',
      l.city || '',
      l.state || '',
      l.phone || l.mobile || '',
      l.email || '',
      l.openingBalance || 0,
      l.openingBalanceType || 'DR'
    ]);
    exportToCsv('Ledgers_Master', headers, rows);
    this.toast.success('Ledgers exported successfully!', 'Export Complete');
  }
}
