import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { TenantService } from '../core/services/tenant.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" [class.settings-mode]="isSettingsMode">
        <div class="sidebar-header">
          <div class="brand-logo" (click)="goToHome()" style="cursor: pointer;" title="Back to Home / Dashboard">
            <i class="pi pi-book brand-icon"></i>
            <div>
              <div class="brand-name">ZENO BOOKS</div>
              <div class="brand-subtitle">Enterprise ERP</div>
            </div>
          </div>
        </div>

        @if (!isSettingsMode) {
          <nav class="sidebar-nav">
          <!-- DASHBOARD -->
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <i class="pi pi-th-large"></i>
            <span>Dashboard</span>
          </a>

          <!-- ACCOUNT MASTER (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleAccountMaster()"
              [class.active-parent]="isAccountMasterActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-book dropdown-icon"></i>
                <span class="dropdown-title">Account Master</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="accountMasterOpen"
              ></i>
            </button>

            @if (accountMasterOpen) {
              <div class="nav-submenu">
                <a routerLink="/masters/ledger-groups" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-sitemap"></i>
                  <span>Ledger Group</span>
                </a>
                <a routerLink="/masters/ledgers" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-file-edit"></i>
                  <span>Ledger</span>
                </a>
              </div>
            }
          </div>

          <!-- INVENTORY MASTER (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleInventoryMaster()"
              [class.active-parent]="isInventoryMasterActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-box dropdown-icon"></i>
                <span class="dropdown-title">Inventory Master</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="inventoryMasterOpen"
              ></i>
            </button>

            @if (inventoryMasterOpen) {
              <div class="nav-submenu">
                <a routerLink="/masters/items" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-tags"></i>
                  <span>Product</span>
                </a>
                <a routerLink="/masters/stock-groups" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-folder"></i>
                  <span>Stock Group</span>
                </a>
                <a routerLink="/masters/stock-categories" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-tag"></i>
                  <span>Stock Category</span>
                </a>
                <a routerLink="/masters/units" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-compass"></i>
                  <span>Unit</span>
                </a>
                <a routerLink="/masters/variants" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-sliders-v"></i>
                  <span>Variant</span>
                </a>
              </div>
            }
          </div>

          <!-- PURCHASE (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="togglePurchase()"
              [class.active-parent]="isPurchaseActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-shopping-cart dropdown-icon"></i>
                <span class="dropdown-title">Purchase</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="purchaseOpen"
              ></i>
            </button>

            @if (purchaseOpen) {
              <div class="nav-submenu">
                <a routerLink="/procure-to-pay/purchase-orders" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-file"></i>
                  <span>Purchase Orders</span>
                </a>
                <a routerLink="/procure-to-pay/goods-receipt-notes" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-box"></i>
                  <span>Goods Receipt (GRN)</span>
                </a>
                <a routerLink="/procure-to-pay/purchase-invoices" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-receipt"></i>
                  <span>Purchase Invoices</span>
                </a>
                <a routerLink="/procure-to-pay/purchase-returns" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-replay"></i>
                  <span>Purchase Returns</span>
                </a>
                <a routerLink="/procure-to-pay/vendor-payments" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-credit-card"></i>
                  <span>Vendor Payments</span>
                </a>
              </div>
            }
          </div>

          <!-- SALES & BILLING (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleSales()"
              [class.active-parent]="isSalesActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-shopping-bag dropdown-icon"></i>
                <span class="dropdown-title">Sales</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="salesOpen"
              ></i>
            </button>

            @if (salesOpen) {
              <div class="nav-submenu">
                <a routerLink="/sales/sales-orders" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-file"></i>
                  <span>Sales Orders</span>
                </a>
                <a routerLink="/sales/delivery-challans" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-truck"></i>
                  <span>Delivery Challans</span>
                </a>
                <a routerLink="/sales/sales-invoices" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-receipt"></i>
                  <span>Sales Invoices</span>
                </a>
                <a routerLink="/sales/sales-returns" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-replay"></i>
                  <span>Sales Returns</span>
                </a>
                <a routerLink="/sales/customer-receipts" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-wallet"></i>
                  <span>Customer Receipts</span>
                </a>
              </div>
            }
          </div>

          <!-- ACCOUNTING (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleAccounting()"
              [class.active-parent]="isAccountingActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-credit-card dropdown-icon"></i>
                <span class="dropdown-title">Accounting</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="accountingOpen"
              ></i>
            </button>

            @if (accountingOpen) {
              <div class="nav-submenu">
                <a routerLink="/accounting/payments" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-arrow-circle-up"></i>
                  <span>Payment</span>
                </a>
                <a routerLink="/accounting/receipts" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-arrow-circle-down"></i>
                  <span>Receipt</span>
                </a>
                <a routerLink="/accounting/contra" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-sync"></i>
                  <span>Contra</span>
                </a>
                <a routerLink="/accounting/journals" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-book"></i>
                  <span>Journal</span>
                </a>
                <a routerLink="/accounting/debit-notes" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-file-export"></i>
                  <span>Debit Note</span>
                </a>
                <a routerLink="/accounting/credit-notes" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-file-import"></i>
                  <span>Credit Note</span>
                </a>
              </div>
            }
          </div>

          <!-- MANUFACTURING (BOM & PRODUCTION) DROPDOWN -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleManufacturing()"
              [class.active-parent]="isManufacturingActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-cog dropdown-icon"></i>
                <span class="dropdown-title">Manufacturing</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="manufacturingOpen"
              ></i>
            </button>

            @if (manufacturingOpen) {
              <div class="nav-submenu">
                <a routerLink="/manufacturing/boms" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-list"></i>
                  <span>Bill of Materials (BOM)</span>
                </a>
                <a routerLink="/manufacturing/production-entries" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-sync"></i>
                  <span>Production</span>
                </a>
              </div>
            }
          </div>

          <!-- REPORTS (SEPARATE PAGE, NOT DROPDOWN) -->
          <a routerLink="/reports" routerLinkActive="active" class="nav-item">
            <i class="pi pi-chart-bar"></i>
            <span>Reports</span>
          </a>
        </nav>
      } @else {
        <!-- SETTING MENU IN SIDEBAR -->
        <div class="sidebar-settings-mode">
          <!-- OPTION TO GO TO HOME -->
          <div class="settings-home-banner">
            <button type="button" class="btn-sidebar-home" (click)="goToHome()" title="Return to Main ERP Navigation">
              <i class="pi pi-arrow-left"></i>
              <span>Back to Home</span>
            </button>
          </div>

          <div class="settings-nav-section-title">SETTING MENU</div>

          <nav class="sidebar-nav settings-subnav">
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'toggles' }"
              [class.active]="currentSettingsTab === 'toggles'"
              class="nav-item"
            >
              <i class="pi pi-sliders-h"></i>
              <span>Feature Toggles</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'roles' }"
              [class.active]="currentSettingsTab === 'roles'"
              class="nav-item"
            >
              <i class="pi pi-shield"></i>
              <span>User Role & Permission</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'users' }"
              [class.active]="currentSettingsTab === 'users'"
              class="nav-item"
            >
              <i class="pi pi-users"></i>
              <span>Users</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'mappings' }"
              [class.active]="currentSettingsTab === 'mappings'"
              class="nav-item"
            >
              <i class="pi pi-book"></i>
              <span>Default Ledger Mapping</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'vouchers' }"
              [class.active]="currentSettingsTab === 'vouchers'"
              class="nav-item"
            >
              <i class="pi pi-hashtag"></i>
              <span>Voucher Number Configuration</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'sales' }"
              [class.active]="currentSettingsTab === 'sales'"
              class="nav-item"
            >
              <i class="pi pi-shopping-bag"></i>
              <span>Sales Configuration</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'purchase' }"
              [class.active]="currentSettingsTab === 'purchase'"
              class="nav-item"
            >
              <i class="pi pi-shopping-cart"></i>
              <span>Purchase Configuration</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'inventory' }"
              [class.active]="currentSettingsTab === 'inventory'"
              class="nav-item"
            >
              <i class="pi pi-box"></i>
              <span>Inventory Configuration</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'gst' }"
              [class.active]="currentSettingsTab === 'gst' || currentSettingsTab === 'taxes'"
              class="nav-item"
            >
              <i class="pi pi-percentage"></i>
              <span>GST & Tax Management</span>
            </a>

            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'company' }"
              [class.active]="currentSettingsTab === 'company'"
              class="nav-item"
            >
              <i class="pi pi-building"></i>
              <span>Company Profile</span>
            </a>
          </nav>
        </div>
      }

        <div class="sidebar-footer">
          <div class="tenant-badge">
            <i class="pi pi-building"></i>
            <span class="tenant-name">{{ auth.currentUser()?.tenantName || 'Tenant Org' }}</span>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="company-selector">
              <label><i class="pi pi-briefcase"></i> Company:</label>
              <select (change)="onCompanyChange($event)">
                @for (c of tenant.companies(); track c.id) {
                  <option [value]="c.id" [selected]="c.id === tenant.currentCompany()?.id">
                    {{ c.legalName }}
                  </option>
                }
              </select>
            </div>

            <div class="branch-selector">
              <label><i class="pi pi-map-marker"></i> Branch:</label>
              <select (change)="onBranchChange($event)">
                @for (b of tenant.branches(); track b.id) {
                  <option [value]="b.id" [selected]="b.id === tenant.currentBranch()?.id">
                    {{ b.branchName }} ({{ b.branchCode }})
                  </option>
                }
              </select>
            </div>

            @if (tenant.currentGodown()) {
              <div class="godown-indicator">
                <i class="pi pi-warehouse"></i>
                <span>{{ tenant.currentGodown()?.name }}</span>
              </div>
            }
          </div>

          <div class="topbar-right">
            <!-- SHIFTED SETTINGS BUTTON ON TOP -->
            <button
              type="button"
              class="topbar-settings-btn"
              [class.active]="isSettingsMode"
              (click)="toggleSettingsMode()"
              title="Settings & System Configuration"
            >
              <i class="pi pi-cog"></i>
              <span>Settings</span>
            </button>

            <div class="user-profile">
              <div class="user-avatar">
                {{ auth.currentUser()?.fullName?.charAt(0) || 'U' }}
              </div>
              <div class="user-details">
                <span class="user-name">{{ auth.currentUser()?.fullName || 'Administrator' }}</span>
                <span class="user-role">{{ auth.currentUser()?.role || 'SUPER_ADMIN' }}</span>
              </div>
            </div>

            <button class="logout-btn" (click)="auth.logout()" title="Sign Out">
              <i class="pi pi-power-off"></i>
            </button>
          </div>
        </header>

        <!-- PAGE CONTENT -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: var(--surface-50);
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background-color: var(--surface-0);
      border-right: 1px solid var(--surface-200);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--surface-200);
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 1.5rem;
      color: #ffffff;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      padding: 10px;
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
    }

    .brand-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--surface-900);
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary-600);
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--surface-300);
        border-radius: 4px;
      }
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--surface-400);
      padding: 14px 12px 6px 12px;

      &:first-child {
        padding-top: 4px;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border-radius: var(--radius-sm);
      color: var(--surface-600);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;

      i {
        font-size: 1rem;
        color: var(--surface-500);
      }

      &:hover {
        background-color: var(--surface-100);
        color: var(--surface-900);

        i {
          color: var(--primary-600);
        }
      }

      &.active {
        background-color: var(--primary-50);
        color: var(--primary-700);
        font-weight: 600;

        i {
          color: var(--primary-600);
        }
      }
    }

    .nav-inactive {
      opacity: 0.7;
    }

    .pill-soon {
      margin-left: auto;
      background-color: var(--surface-200);
      color: var(--surface-600);
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Topbar Settings Button */
    .topbar-settings-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-300);
      background: #ffffff;
      color: var(--surface-700);
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;

      i {
        font-size: 0.95rem;
        color: var(--surface-500);
        transition: transform 0.25s ease, color 0.15s ease;
      }

      &:hover {
        background: var(--surface-50);
        color: var(--primary-600);
        border-color: var(--primary-300);

        i {
          color: var(--primary-600);
          transform: rotate(45deg);
        }
      }

      &.active {
        background: var(--primary-50);
        color: var(--primary-700);
        border-color: var(--primary-400);

        i {
          color: var(--primary-600);
        }
      }
    }

    /* Settings Mode in Sidebar */
    .sidebar-settings-mode {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .settings-home-banner {
      padding: 12px 14px;
      border-bottom: 1px solid var(--surface-200);
      background: var(--surface-50);
    }

    .btn-sidebar-home {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      background: #ffffff;
      border: 1px solid var(--surface-300);
      color: var(--surface-800);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

      i {
        font-size: 0.9rem;
        color: var(--primary-600);
        transition: transform 0.15s ease;
      }

      &:hover {
        background: var(--primary-50);
        border-color: var(--primary-300);
        color: var(--primary-700);

        i {
          transform: translateX(-3px);
        }
      }
    }

    .settings-nav-section-title {
      padding: 14px 16px 6px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--surface-400);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .settings-subnav {
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid var(--surface-200);
      background-color: var(--surface-50);
    }

    .tenant-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-700);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      i {
        color: var(--primary-600);
      }
    }

    /* Main Area */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 64px;
      background-color: var(--surface-0);
      border-bottom: 1px solid var(--surface-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 10;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .company-selector, .branch-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: var(--surface-50);
      padding: 6px 12px;
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;

      label {
        color: var(--surface-500);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      select {
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--surface-900);
        cursor: pointer;
        outline: none;
      }
    }

    .godown-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background-color: var(--primary-100);
      color: var(--primary-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--surface-900);
    }

    .user-role {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
    }

    .logout-btn {
      background: none;
      border: 1px solid var(--surface-200);
      color: var(--surface-500);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background-color: var(--danger-bg);
        color: var(--danger);
        border-color: #fca5a5;
      }
    }

    /* Dropdown Purchase Menu */
    .nav-dropdown {
      margin-bottom: 2px;
    }

    .nav-dropdown-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      border-radius: var(--radius-sm);
      color: var(--surface-700);
      background: transparent;
      border: none;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      .dropdown-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dropdown-icon {
        font-size: 1rem;
        color: var(--surface-500);
        transition: color 0.15s ease;
      }

      .dropdown-caret {
        font-size: 0.75rem;
        color: var(--surface-400);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-block;

        &.rotated {
          transform: rotate(90deg);
        }
      }

      &:hover {
        background-color: var(--surface-100);
        color: var(--surface-900);

        .dropdown-icon {
          color: var(--primary-600);
        }
      }

      &.active-parent {
        color: var(--primary-700);
        background-color: var(--primary-50);

        .dropdown-icon {
          color: var(--primary-600);
        }
      }
    }

    .nav-submenu {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-left: 10px;
      margin-top: 3px;
      margin-bottom: 6px;
      border-left: 2px solid var(--surface-200);
      margin-left: 21px;
    }

    .nav-subitem {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      color: var(--surface-600);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 0.15s ease;
      font-family: inherit;

      i {
        font-size: 0.875rem;
        color: var(--surface-400);
        transition: color 0.15s ease;
      }

      &:hover {
        background-color: var(--surface-100);
        color: var(--surface-900);

        i {
          color: var(--primary-600);
        }
      }

      &.active {
        background-color: var(--primary-50);
        color: var(--primary-700);
        font-weight: 600;

        i {
          color: var(--primary-600);
        }
      }
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `],
})
export class ShellComponent implements OnInit {
  purchaseOpen = true;
  salesOpen = false;
  accountingOpen = false;
  accountMasterOpen = false;
  inventoryMasterOpen = false;
  manufacturingOpen = false;

  isSettingsMode = false;
  currentSettingsTab = 'toggles';

  constructor(
    public auth: AuthService,
    public tenant: TenantService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe();
    if (this.isAccountingActive()) {
      this.accountingOpen = true;
    }
    if (this.isAccountMasterActive()) {
      this.accountMasterOpen = true;
    }
    if (this.isInventoryMasterActive()) {
      this.inventoryMasterOpen = true;
    }
    if (this.isManufacturingActive()) {
      this.manufacturingOpen = true;
    }

    this.updateSettingsModeFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateSettingsModeFromUrl(event.urlAfterRedirects || event.url);
      });
  }

  updateSettingsModeFromUrl(url: string) {
    this.isSettingsMode = url.startsWith('/settings');
    if (this.isSettingsMode) {
      const qIndex = url.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(url.substring(qIndex + 1));
        this.currentSettingsTab = params.get('tab') || 'toggles';
      } else {
        this.currentSettingsTab = 'toggles';
      }
    }
  }

  toggleSettingsMode() {
    if (this.isSettingsMode) {
      this.goToHome();
    } else {
      this.openSettingsMode();
    }
  }

  openSettingsMode() {
    this.isSettingsMode = true;
    this.router.navigate(['/settings'], {
      queryParams: { tab: this.currentSettingsTab || 'toggles' },
    });
  }

  goToHome() {
    this.isSettingsMode = false;
    this.router.navigate(['/dashboard']);
  }

  toggleManufacturing() {
    this.manufacturingOpen = !this.manufacturingOpen;
  }

  isManufacturingActive(): boolean {
    return this.router.url.includes('/manufacturing');
  }

  togglePurchase() {
    this.purchaseOpen = !this.purchaseOpen;
  }

  isPurchaseActive(): boolean {
    return this.router.url.includes('/procure-to-pay');
  }

  toggleSales() {
    this.salesOpen = !this.salesOpen;
  }

  isSalesActive(): boolean {
    return this.router.url.includes('/sales');
  }

  toggleAccounting() {
    this.accountingOpen = !this.accountingOpen;
  }

  isAccountingActive(): boolean {
    return this.router.url.includes('/accounting');
  }

  toggleAccountMaster() {
    this.accountMasterOpen = !this.accountMasterOpen;
  }

  isAccountMasterActive(): boolean {
    return this.router.url.includes('/masters/ledger');
  }

  toggleInventoryMaster() {
    this.inventoryMasterOpen = !this.inventoryMasterOpen;
  }

  isInventoryMasterActive(): boolean {
    return (
      this.router.url.includes('/masters/items') ||
      this.router.url.includes('/masters/stock') ||
      this.router.url.includes('/masters/units') ||
      this.router.url.includes('/masters/variants')
    );
  }

  onCompanyChange(event: any) {
    const companyId = event.target.value;
    const comp = this.tenant.companies().find((c) => c.id === companyId);
    if (comp) {
      this.tenant.setCompany(comp);
    }
  }

  onBranchChange(event: any) {
    const branchId = event.target.value;
    const branch = this.tenant.branches().find((b) => b.id === branchId);
    if (branch) {
      this.tenant.setBranch(branch);
    }
  }
}
