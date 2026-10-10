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
  styleUrl: './shell.component.scss',
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
