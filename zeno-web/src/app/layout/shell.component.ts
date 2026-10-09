import { Component, OnInit, HostListener } from '@angular/core';
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
      <aside class="sidebar" [class.settings-mode]="isSettingsMode" [class.collapsed]="isSidebarCollapsed">
        <div class="sidebar-header">
          <div class="brand-logo" (click)="goToHome()" style="cursor: pointer;" title="Back to Home / Dashboard">
            <img src="/zeno-books-logo.png" alt="ZENO BOOKS" class="brand-logo-img" />
          </div>
        </div>

        @if (!isSettingsMode) {
          <nav class="sidebar-nav">
          <!-- DASHBOARD -->
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <i class="pi pi-th-large"></i>
            <span>Dashboard</span>
          </a>

          <!-- CHART OF ACCOUNT (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleAccountMaster()"
              [class.active-parent]="isAccountMasterActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-book dropdown-icon"></i>
                <span class="dropdown-title">Chart of Account</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="accountMasterOpen"
              ></i>
            </button>

            @if (accountMasterOpen || isSidebarCollapsed) {
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

          <!-- PRODUCTS (DROPDOWN MENU) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleInventoryMaster()"
              [class.active-parent]="isInventoryMasterActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-box dropdown-icon"></i>
                <span class="dropdown-title">Products</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="inventoryMasterOpen"
              ></i>
            </button>

            @if (inventoryMasterOpen || isSidebarCollapsed) {
              <div class="nav-submenu">
                <a routerLink="/masters/items" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-tags"></i>
                  <span>Products</span>
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

            @if (purchaseOpen || isSidebarCollapsed) {
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

            @if (salesOpen || isSidebarCollapsed) {
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

            @if (accountingOpen || isSidebarCollapsed) {
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

          <!-- INVENTORY (DROPDOWN MENU SHIFTED BELOW ACCOUNTING) -->
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-dropdown-header"
              (click)="toggleInventory()"
              [class.active-parent]="isInventoryActive()"
            >
              <div class="dropdown-title-wrap">
                <i class="pi pi-database dropdown-icon"></i>
                <span class="dropdown-title">Inventory</span>
              </div>
              <i
                class="pi pi-chevron-right dropdown-caret"
                [class.rotated]="inventoryOpen"
              ></i>
            </button>

            @if (inventoryOpen || isSidebarCollapsed) {
              <div class="nav-submenu">
                <a routerLink="/inventory/stock-transfer" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-arrows-h"></i>
                  <span>Stock Transfer</span>
                </a>
                <a routerLink="/inventory/stock-adjustment" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-sliders-h"></i>
                  <span>Stock Adjustment</span>
                </a>
                <a routerLink="/inventory/opening-balance" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-calendar-plus"></i>
                  <span>Update Opening Balance</span>
                </a>
                <a routerLink="/inventory/price-list" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-percentage"></i>
                  <span>Update Price List</span>
                </a>
                <a routerLink="/reports/stock-item-statement" routerLinkActive="active" class="nav-subitem">
                  <i class="pi pi-box"></i>
                  <span>Stock Item Report</span>
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

            @if (manufacturingOpen || isSidebarCollapsed) {
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
            <!-- 1. COMPANY PROFILE -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'company' }"
              [class.active]="currentSettingsTab === 'company'"
              class="nav-item"
            >
              <i class="pi pi-building"></i>
              <span>Company Profile</span>
            </a>

            <!-- 2. BRANCH -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'branches' }"
              [class.active]="currentSettingsTab === 'branches'"
              class="nav-item"
            >
              <i class="pi pi-sitemap"></i>
              <span>Branch</span>
            </a>

            <!-- 2. WAREHOUSE -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'warehouses' }"
              [class.active]="currentSettingsTab === 'warehouses'"
              class="nav-item"
            >
              <i class="pi pi-warehouse"></i>
              <span>Warehouse</span>
            </a>

            <!-- 3. FEATURES -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'toggles' }"
              [class.active]="currentSettingsTab === 'toggles'"
              class="nav-item"
            >
              <i class="pi pi-sliders-h"></i>
              <span>Features</span>
            </a>

            <!-- 4. USER ROLES -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'roles' }"
              [class.active]="currentSettingsTab === 'roles'"
              class="nav-item"
            >
              <i class="pi pi-shield"></i>
              <span>User Roles</span>
            </a>

            <!-- 5. USERS -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'users' }"
              [class.active]="currentSettingsTab === 'users'"
              class="nav-item"
            >
              <i class="pi pi-users"></i>
              <span>Users</span>
            </a>

            <!-- 6. DEFAULT LEDGERS -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'mappings' }"
              [class.active]="currentSettingsTab === 'mappings'"
              class="nav-item"
            >
              <i class="pi pi-book"></i>
              <span>Default Ledgers</span>
            </a>

            <!-- 7. VOUCHER NUMBERS -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'vouchers' }"
              [class.active]="currentSettingsTab === 'vouchers'"
              class="nav-item"
            >
              <i class="pi pi-hashtag"></i>
              <span>Voucher Numbers</span>
            </a>

            <!-- 8. SALES CONFIGURATION -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'sales' }"
              [class.active]="currentSettingsTab === 'sales'"
              class="nav-item"
            >
              <i class="pi pi-shopping-bag"></i>
              <span>Sales Configuration</span>
            </a>

            <!-- 9. PURCHASE CONFIGURATION -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'purchase' }"
              [class.active]="currentSettingsTab === 'purchase'"
              class="nav-item"
            >
              <i class="pi pi-shopping-cart"></i>
              <span>Purchase Configuration</span>
            </a>

            <!-- 10. INVENTORY CONFIGURATION -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'inventory' }"
              [class.active]="currentSettingsTab === 'inventory'"
              class="nav-item"
            >
              <i class="pi pi-box"></i>
              <span>Inventory Configuration</span>
            </a>

            <!-- 11. GST -->
            <a
              [routerLink]="['/settings']"
              [queryParams]="{ tab: 'gst' }"
              [class.active]="currentSettingsTab === 'gst' || currentSettingsTab === 'taxes'"
              class="nav-item"
            >
              <i class="pi pi-percentage"></i>
              <span>GST</span>
            </a>
          </nav>
        </div>
      }

        <div class="sidebar-footer">
          <button
            type="button"
            class="sidebar-toggle-btn"
            (click)="toggleSidebarCollapse()"
            [title]="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          >
            <i class="pi" [class.pi-angle-double-left]="!isSidebarCollapsed" [class.pi-angle-double-right]="isSidebarCollapsed"></i>
            @if (!isSidebarCollapsed) {
              <span class="toggle-text">Collapse Sidebar</span>
            }
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="topbar-company-info">
              <div class="company-info-text">
                <span class="company-title">{{ tenant.currentCompany()?.legalName || tenant.currentCompany()?.tradeName || auth.currentUser()?.tenantName || 'ZENO BOOKS' }}</span>
              </div>
            </div>
          </div>

          <div class="topbar-right">
            <!-- GLOBAL QUICK ACTION BUTTON & DROPDOWN -->
            <div class="topbar-qa-wrapper">
              <button
                type="button"
                class="topbar-qa-btn"
                [class.active]="isQuickActionOpen"
                (click)="toggleQuickActionMenu($event)"
                title="Quick Actions & Important Masters"
              >
                <i class="pi pi-bolt"></i>
                <span>Quick Action</span>
                <i class="pi pi-chevron-down qa-caret" [class.rotated]="isQuickActionOpen"></i>
              </button>

              @if (isQuickActionOpen) {
                <div class="topbar-qa-dropdown" (click)="$event.stopPropagation()">
                  <div class="qa-dropdown-header">
                    <div class="qa-dropdown-title">
                      <i class="pi pi-bolt"></i>
                      <span>Quick Actions</span>
                    </div>
                    <span class="qa-dropdown-hint">Workflows & Masters</span>
                  </div>

                  <div class="qa-dropdown-columns">
                    <!-- Procure-to-Pay Section -->
                    <div class="qa-column">
                      <div class="qa-column-title">
                        <i class="pi pi-shopping-cart"></i>
                        <span>Procure-to-Pay</span>
                      </div>
                      <div class="qa-items">
                        <a routerLink="/procure-to-pay/purchase-orders" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge p2p-badge">1</span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Purchase Order</span>
                            <span class="qa-item-desc">Order intent & pricing</span>
                          </div>
                        </a>
                        <a routerLink="/procure-to-pay/goods-receipt-notes" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge p2p-badge">2</span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Goods Receipt (GRN)</span>
                            <span class="qa-item-desc">Stock In & verification</span>
                          </div>
                        </a>
                        <a routerLink="/procure-to-pay/purchase-invoices" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge p2p-badge">3</span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Purchase Invoice</span>
                            <span class="qa-item-desc">Tax & ledger entry</span>
                          </div>
                        </a>
                        <a routerLink="/procure-to-pay/vendor-payments" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge p2p-badge">4</span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Vendor Payment</span>
                            <span class="qa-item-desc">Bill allocation & clearing</span>
                          </div>
                        </a>
                      </div>
                    </div>

                    <!-- Important Masters Section -->
                    <div class="qa-column">
                      <div class="qa-column-title">
                        <i class="pi pi-database"></i>
                        <span>Important Masters</span>
                      </div>
                      <div class="qa-items">
                        <a routerLink="/masters/items" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-box"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Product Master</span>
                            <span class="qa-item-desc">Item catalog & pricing</span>
                          </div>
                        </a>
                        <a routerLink="/masters/ledgers" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-book"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Ledger Account</span>
                            <span class="qa-item-desc">Chart of accounts & parties</span>
                          </div>
                        </a>
                        <a routerLink="/masters/ledger-groups" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-folder"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Ledger Group</span>
                            <span class="qa-item-desc">Hierarchical account groups</span>
                          </div>
                        </a>
                        <a routerLink="/masters/stock-groups" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-tags"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Stock Group</span>
                            <span class="qa-item-desc">Category classification</span>
                          </div>
                        </a>
                        <a routerLink="/masters/units" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-sliders-h"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Unit of Measure</span>
                            <span class="qa-item-desc">Measurement units & symbols</span>
                          </div>
                        </a>
                        <a routerLink="/masters/variants" (click)="closeQuickAction()" class="qa-item">
                          <span class="qa-badge master-badge"><i class="pi pi-clone"></i></span>
                          <div class="qa-item-info">
                            <span class="qa-item-title">Variant Master</span>
                            <span class="qa-item-desc">Product attributes & options</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

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
      transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-header {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      min-height: 90px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
    }

    .brand-logo-img {
      height: 72px;
      max-height: 78px;
      width: auto;
      max-width: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.02);
      }
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

    /* Topbar Quick Action Button & Dropdown */
    .topbar-qa-wrapper {
      position: relative;
      display: inline-block;
    }

    .topbar-qa-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--primary-600);
      background: var(--primary-600);
      color: #ffffff;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.2);

      i {
        font-size: 0.95rem;
        color: #ffffff;
        transition: transform 0.2s ease;
      }

      .qa-caret {
        font-size: 0.75rem;

        &.rotated {
          transform: rotate(180deg);
        }
      }

      &:hover {
        background: var(--primary-700);
        border-color: var(--primary-700);
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
      }

      &.active {
        background: var(--primary-700);
      }
    }

    .topbar-qa-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      z-index: 1050;
      width: 540px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: qaFadeInTop 0.15s ease-out;

      .qa-dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--surface-200);

        .qa-dropdown-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--surface-900);

          i {
            color: var(--primary-600);
          }
        }

        .qa-dropdown-hint {
          font-size: 0.75rem;
          color: var(--surface-500);
        }
      }

      .qa-dropdown-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .qa-column {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .qa-column-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--surface-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 4px;

          i {
            color: var(--primary-600);
          }
        }
      }

      .qa-items {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .qa-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          background: var(--surface-50);
          border-color: var(--surface-200);
          transform: translateX(2px);
        }

        .qa-badge {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;

          &.p2p-badge {
            background-color: var(--primary-50);
            color: var(--primary-600);
          }

          &.master-badge {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 0.75rem;
          }
        }

        .qa-item-info {
          display: flex;
          flex-direction: column;

          .qa-item-title {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--surface-900);
          }

          .qa-item-desc {
            font-size: 0.6875rem;
            color: var(--surface-500);
          }
        }
      }
    }

    @keyframes qaFadeInTop {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      padding: 12px 14px;
      border-top: 1px solid var(--surface-200);
      background-color: var(--surface-50);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      background: #ffffff;
      border: 1px solid var(--surface-300);
      color: var(--surface-700);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

      i {
        font-size: 0.95rem;
        color: var(--primary-600);
        transition: transform 0.2s ease;
      }

      &:hover {
        background: var(--primary-50);
        border-color: var(--primary-300);
        color: var(--primary-700);

        i {
          color: var(--primary-700);
        }
      }
    }

    /* Collapsed Sidebar Styles */
    .sidebar.collapsed {
      width: 68px;
      overflow: visible;
      z-index: 100;

      .sidebar-nav {
        overflow: visible;
      }

      .sidebar-header {
        padding: 14px 8px;
        justify-content: center;

        .brand-logo {
          justify-content: center;
        }

        .brand-logo-img {
          max-width: 44px;
          height: auto;
          object-fit: cover;
          object-position: left;
        }
      }

      .nav-section-title,
      .pill-soon,
      .dropdown-caret,
      .toggle-text,
      .nav-item span,
      .dropdown-title,
      .settings-nav-section-title {
        display: none !important;
      }

      .nav-item,
      .nav-dropdown-header {
        justify-content: center;
        padding: 10px 0;
        gap: 0;
      }

      .nav-item i,
      .dropdown-icon {
        font-size: 1.15rem;
        margin: 0;
      }

      /* Hover flyout menu for dropdowns when collapsed */
      .nav-dropdown {
        position: relative;

        .nav-submenu {
          display: none !important;
        }

        &:hover {
          .nav-submenu {
            display: flex !important;
            flex-direction: column !important;
            position: absolute !important;
            left: 60px !important;
            top: 0 !important;
            background: #ffffff !important;
            min-width: 210px !important;
            padding: 6px !important;
            border-radius: var(--radius-md, 8px) !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08) !important;
            border: 1px solid var(--surface-200) !important;
            z-index: 9999 !important;
            gap: 2px !important;

            .nav-subitem {
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
              padding: 8px 12px !important;
              gap: 10px !important;
              width: 100% !important;
              border-radius: var(--radius-sm, 6px) !important;

              span {
                display: inline !important;
                font-size: 0.8125rem !important;
                font-weight: 500 !important;
                color: var(--surface-800) !important;
                white-space: nowrap !important;
              }

              i {
                font-size: 0.95rem !important;
                color: var(--surface-500) !important;
                margin: 0 !important;
              }

              &:hover {
                background-color: var(--surface-100) !important;

                span {
                  color: var(--primary-700) !important;
                }
                i {
                  color: var(--primary-600) !important;
                }
              }

              &.active {
                background-color: var(--primary-50) !important;

                span {
                  color: var(--primary-700) !important;
                  font-weight: 600 !important;
                }
                i {
                  color: var(--primary-600) !important;
                }
              }
            }
          }
        }
      }

      .sidebar-footer {
        padding: 10px 8px;
      }

      .sidebar-toggle-btn {
        width: 40px;
        height: 40px;
        padding: 0;
        border-radius: 50%;
        justify-content: center;
      }

      .btn-sidebar-home span {
        display: none !important;
      }

      .btn-sidebar-home {
        justify-content: center;
        padding: 9px 0;
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

    .topbar-company-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .company-badge-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: var(--primary-600);
    }

    .company-info-text {
      display: flex;
      flex-direction: column;
    }

    .company-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--surface-900);
      letter-spacing: -0.01em;
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
  isQuickActionOpen = false;
  purchaseOpen = true;
  salesOpen = false;
  accountingOpen = false;
  accountMasterOpen = false;
  inventoryMasterOpen = false;
  inventoryOpen = false;
  manufacturingOpen = false;

  isSidebarCollapsed = false;
  isSettingsMode = false;

  toggleSidebarCollapse() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  currentSettingsTab = 'company';

  toggleQuickActionMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isQuickActionOpen = !this.isQuickActionOpen;
  }

  closeQuickAction() {
    this.isQuickActionOpen = false;
  }

  @HostListener('document:click')
  onGlobalClick() {
    this.isQuickActionOpen = false;
  }

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
    if (this.isInventoryActive()) {
      this.inventoryOpen = true;
    }
    if (this.isManufacturingActive()) {
      this.manufacturingOpen = true;
    }

    this.updateSettingsModeFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateSettingsModeFromUrl(event.urlAfterRedirects || event.url);
        this.isQuickActionOpen = false;
      });
  }

  updateSettingsModeFromUrl(url: string) {
    this.isSettingsMode = url.startsWith('/settings');
    if (this.isSettingsMode) {
      const qIndex = url.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(url.substring(qIndex + 1));
        this.currentSettingsTab = params.get('tab') || 'company';
      } else {
        this.currentSettingsTab = 'company';
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
      queryParams: { tab: this.currentSettingsTab || 'company' },
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

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
  }

  isInventoryActive(): boolean {
    return this.router.url.includes('/inventory/');
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
