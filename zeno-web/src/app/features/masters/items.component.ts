import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      <div class="page-header">
        <h1>Products</h1>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="pi pi-plus"></i> Create New Product
          </button>
        </div>
      </div>

      <div class="zeno-card">
        <table class="zeno-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU Code</th>
              <th>HSN/SAC</th>
              <th>Unit</th>
              <th>Purchase Rate</th>
              <th>Sale Rate</th>
              <th>GST Rate</th>
              <th>Reorder Lvl</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id) {
              <tr>
                <td class="font-bold">{{ item.name }}</td>
                <td class="font-mono">{{ item.sku || '—' }}</td>
                <td class="font-mono">{{ item.hsnSac || '—' }}</td>
                <td>
                  <span class="unit-pill">{{ item.unit?.code || 'NOS' }}</span>
                </td>
                <td class="font-mono">₹{{ item.purchaseRate }}</td>
                <td class="font-mono">₹{{ item.saleRate }}</td>
                <td>
                  <span class="badge-pill badge-partial">{{ item.gstRate }}% GST</span>
                </td>
                <td class="font-mono">{{ item.reorderLevel }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE ITEM MODAL WITH 4 TABS -->
    @if (showCreateModal) {
      <div class="modal-backdrop">
        <div class="modal-dialog" style="max-width: 760px;">
          <div class="modal-header">
            <h3>Create Product</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>

          <!-- TAB SWITCHER -->
          <div class="modal-tabs">
            <button [class.active]="activeTab === 'basic'" (click)="activeTab = 'basic'">
              <i class="pi pi-info-circle"></i> Basic Info
            </button>
            <button [class.active]="activeTab === 'pricing'" (click)="activeTab = 'pricing'">
              <i class="pi pi-dollar"></i> Sales / Purchase
            </button>
            <button [class.active]="activeTab === 'image'" (click)="activeTab = 'image'">
              <i class="pi pi-image"></i> Product Image
            </button>
            <button [class.active]="activeTab === 'desc'" (click)="activeTab = 'desc'">
              <i class="pi pi-align-left"></i> Description
            </button>
          </div>

          <div class="modal-body">
            @if (activeTab === 'basic') {
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" [(ngModel)]="form.name" placeholder="e.g. Stainless Steel Bolt M8" required />
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label>SKU Code</label>
                  <input type="text" [(ngModel)]="form.sku" placeholder="SS-BOLT-M8" />
                </div>
                <div class="form-group">
                  <label>Unit of Measure *</label>
                  <select [(ngModel)]="form.unitId" required>
                    @for (u of units; track u.id) {
                      <option [value]="u.id">{{ u.name }} ({{ u.code }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label>HSN / SAC Code</label>
                  <input type="text" [(ngModel)]="form.hsnSac" placeholder="7318" />
                </div>
                <div class="form-group">
                  <label>GST Rate (%) *</label>
                  <select [(ngModel)]="form.gstRate">
                    <option [value]="0">0% (Exempt)</option>
                    <option [value]="5">5% GST</option>
                    <option [value]="12">12% GST</option>
                    <option [value]="18">18% Standard GST</option>
                    <option [value]="28">28% Highest GST</option>
                  </select>
                </div>
              </div>
            }

            @if (activeTab === 'pricing') {
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Default Purchase Rate (₹) *</label>
                  <input type="number" [(ngModel)]="form.purchaseRate" min="0" placeholder="100.00" />
                </div>
                <div class="form-group">
                  <label>Default Selling Rate (₹) *</label>
                  <input type="number" [(ngModel)]="form.saleRate" min="0" placeholder="150.00" />
                </div>
              </div>

              <div class="form-group">
                <label>Reorder Warning Level (Qty)</label>
                <input type="number" [(ngModel)]="form.reorderLevel" min="0" placeholder="10" />
              </div>
            }

            @if (activeTab === 'image') {
              <div class="form-group">
                <label>Image URL</label>
                <input type="url" [(ngModel)]="form.imageUrl" placeholder="https://example.com/item.png" />
              </div>
            }

            @if (activeTab === 'desc') {
              <div class="form-group">
                <label>Detailed Specifications / Description</label>
                <textarea [(ngModel)]="form.description" rows="4" placeholder="Enter detailed technical specs..."></textarea>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button class="btn-primary" (click)="saveItem()" [disabled]="submitting || !form.name">
              Save Item Master
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .p2p-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; } }
    .unit-pill { background: var(--surface-100); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: var(--surface-700); }
    .modal-tabs { display: flex; border-bottom: 1px solid var(--surface-200); background: var(--surface-50); button { flex: 1; padding: 12px; border: none; background: none; font-size: 0.8125rem; font-weight: 600; color: var(--surface-600); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; border-bottom: 2px solid transparent; &.active { background: #ffffff; color: var(--primary-600); border-bottom-color: var(--primary-600); } } }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `],
})
export class ItemsComponent implements OnInit {
  items: any[] = [];
  units: any[] = [];
  showCreateModal = false;
  activeTab = 'basic';
  submitting = false;

  form: any = {
    name: '',
    sku: '',
    unitId: '',
    hsnSac: '',
    gstRate: 18,
    purchaseRate: 0,
    saleRate: 0,
    reorderLevel: 5,
    imageUrl: '',
    description: '',
  };

  constructor(
    private masters: MastersService,
    public tenant: TenantService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadItems();
        this.loadUnits();
      },
    });
  }

  loadItems() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getItems(compId).subscribe({ next: (res) => (this.items = res) });
  }

  loadUnits() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getUnits(compId).subscribe({
      next: (res) => {
        this.units = res;
        if (!this.form.unitId && res.length > 0) {
          this.form.unitId = res[0].id;
        }
      },
    });
  }

  openCreateModal() {
    this.form = {
      name: '',
      sku: '',
      unitId: this.units[0]?.id || '',
      hsnSac: '8401',
      gstRate: 18,
      purchaseRate: 500,
      saleRate: 750,
      reorderLevel: 5,
      imageUrl: '',
      description: '',
    };
    this.activeTab = 'basic';
    this.showCreateModal = true;
  }

  saveItem() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.submitting = true;

    this.masters.createItem({ ...this.form, companyId: compId }).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateModal = false;
        this.loadItems();
      },
      error: () => (this.submitting = false),
    });
  }
}
