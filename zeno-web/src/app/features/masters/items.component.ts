import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';
import { VariantDefinition } from './variants.component';

export interface SkuVariantRow {
  name: string;
  sku: string;
  barcode: string;
  attributes: Record<string, string>;
  openingQty: number;
  purchaseRate: number;
  mrp: number;
  saleRate: number;
}

export interface SelectedVariantConfig {
  definitionId: string;
  definitionName: string;
  definitionCode: string;
  definitionType: string;
  availableOptions: string[];
  selectedValues: string[];
  customValueInput?: string;
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p2p-page">
      <!-- 1. LIST VIEW -->
      @if (viewMode === 'list') {
        <div class="page-header">
          <div>
            <h1>Products & Services</h1>
            <p class="text-secondary" style="margin: 4px 0 0; font-size: 0.875rem;">
              Manage goods, services, inventory tracking rules, and variant SKU matrices.
            </p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateProduct()">
              <i class="pi pi-plus"></i> Create New Product
            </button>
          </div>
        </div>

        <div class="zeno-card">
          <!-- FILTER TOOLBAR -->
          <div class="table-toolbar">
            <div class="toolbar-search">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterItems()"
              />
            </div>
            <div class="toolbar-filters">
              <select [(ngModel)]="typeFilter" (change)="filterItems()" class="form-select">
                <option value="ALL">All Product Types</option>
                <option value="GOODS">Goods</option>
                <option value="SERVICE">Services</option>
              </select>

              <select [(ngModel)]="trackingFilter" (change)="filterItems()" class="form-select">
                <option value="ALL">All Tracking</option>
                <option value="ITEM_WISE">Item Wise</option>
                <option value="BATCH_WISE">Batch Wise</option>
                <option value="SERIAL_WISE">Serial Wise</option>
                <option value="VARIANT_WISE">Variant Wise</option>
              </select>

              <button class="btn-export" (click)="exportItems()" [disabled]="filteredItems.length === 0" title="Export Products">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <table class="zeno-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Group</th>
                <th>Category</th>
                <th>Unit</th>
                <th>GST Rate</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    <i class="pi pi-spin pi-spinner"></i> Loading products...
                  </td>
                </tr>
              } @else if (filteredItems.length === 0) {
                <tr>
                  <td colspan="7" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No products found. Click "Create New Product" to get started.
                  </td>
                </tr>
              }
              @for (item of filteredItems; track item.id) {
                <tr>
                  <td>
                    <div style="display: flex; flex-direction: column;">
                      <span class="font-bold product-name-link" (click)="openEditProduct(item)">{{ item.name }}</span>
                      @if (item.inventoryTracking === 'VARIANT_WISE' && item.variants?.length) {
                        <span class="variants-badge">
                          <i class="pi pi-sliders-v"></i> {{ item.variants.length }} SKU Variants
                        </span>
                      }
                    </div>
                  </td>
                  <td class="font-mono">{{ item.sku || '—' }}</td>
                  <td>
                    <span style="font-size: 0.8125rem; color: var(--surface-700);">
                      {{ item.itemGroup?.name || '—' }}
                    </span>
                  </td>
                  <td>
                    <span style="font-size: 0.8125rem; color: var(--surface-700);">
                      {{ item.category?.name || '—' }}
                    </span>
                  </td>
                  <td>
                    <span class="unit-pill">{{ item.unit?.code || item.unit?.name || 'NOS' }}</span>
                  </td>
                  <td>
                    @if (item.isGstApplicable === false) {
                      <span class="badge-pill badge-cancelled">Exempt / 0%</span>
                    } @else {
                      <span class="badge-pill badge-partial">
                        {{ getItemGstDisplayRate(item) }}% GST
                        @if (gstActiveLevel !== 'ITEM') {
                          <span style="font-size: 0.6875rem; opacity: 0.85;">
                            ({{ getItemGstLevelTag(item) }})
                          </span>
                        }
                      </span>
                    }
                  </td>
                  <td class="text-right actions-cell">
                    <button class="btn-icon" (click)="openEditProduct(item)" title="Edit Product">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon text-danger" (click)="deleteItem(item)" title="Delete Product">
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- 2. FULL VIEW (NOT MODAL) PRODUCT CREATION / EDITING -->
      @if (viewMode === 'create' || viewMode === 'edit') {
        <div class="full-page-form">
          <!-- TOP HEADER -->
          <div class="full-page-header">
            <div class="header-left">
              <button class="btn-back" (click)="backToList()" title="Back to Products List">
                <i class="pi pi-arrow-left"></i>
              </button>
              <div>
                <h2>{{ viewMode === 'edit' ? 'Edit Product: ' + form.name : 'Create New Product' }}</h2>
                <p class="text-secondary" style="margin: 2px 0 0; font-size: 0.8125rem;">
                  Configure product identity, GST compliance, inventory tracking, and SKU variant matrix.
                </p>
              </div>
            </div>

            <div class="header-actions">
              <button type="button" class="btn-secondary" (click)="backToList()">
                <i class="pi pi-times"></i> Cancel
              </button>
              <button type="button" class="btn-primary" (click)="saveItem()" [disabled]="submitting || !form.name">
                @if (submitting) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ viewMode === 'edit' ? 'Update Product' : 'Save Product' }}
                }
              </button>
            </div>
          </div>

          <!-- FULL SCREEN FORM CARD -->
          <div class="full-card">
            <!-- TAB BAR -->
            <div class="full-tabs">
              <button [class.active]="activeTab === 'basic'" (click)="activeTab = 'basic'">
                <i class="pi pi-info-circle"></i> Basic Info
              </button>

              @if (form.inventoryTracking === 'VARIANT_WISE') {
                <button [class.active]="activeTab === 'variants'" (click)="activeTab = 'variants'" class="tab-highlight">
                  <i class="pi pi-sliders-v"></i> Variants & SKU Matrix
                  @if (skuRows.length > 0) {
                    <span class="tab-badge">{{ skuRows.length }}</span>
                  }
                </button>
              }

              <button [class.active]="activeTab === 'pricing'" (click)="activeTab = 'pricing'">
                <i class="pi pi-dollar"></i> Pricing & Inventory
              </button>
            </div>

            <div class="full-body">
              <!-- TAB 1: BASIC INFO -->
              @if (activeTab === 'basic') {
                <div class="form-container">
                  <!-- LINE 1: 3 Fields -->
                  <div class="form-grid-3">
                    <div class="form-group">
                      <label class="required">Product Type</label>
                      <select
                        [(ngModel)]="form.productType"
                        (change)="onProductTypeChanged()"
                        class="form-control font-bold"
                        required
                      >
                        <option value="GOODS">Goods</option>
                        <option value="SERVICE">Service</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="required">Product Name</label>
                      <input
                        type="text"
                        [(ngModel)]="form.name"
                        (input)="onProductNameChanged()"
                        class="form-control font-bold"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label>Product SKU / Base Code</label>
                      <input
                        type="text"
                        [(ngModel)]="form.sku"
                        (input)="onBaseSkuChanged()"
                        class="form-control font-mono"
                      />
                    </div>
                  </div>

                  <!-- LINE 2: 3 Fields -->
                  <div class="form-grid-3" style="margin-top: 16px;">
                    <div class="form-group">
                      <label>Product Group</label>
                      <select [(ngModel)]="form.itemGroupId" (change)="onGroupChanged()" class="form-control">
                        <option value="">-- None / Select Group --</option>
                        @for (g of itemGroups; track g.id) {
                          <option [value]="g.id">{{ g.name }}</option>
                        }
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Product Category</label>
                      <select [(ngModel)]="form.itemCategoryId" (change)="onCategoryChanged()" class="form-control">
                        <option value="">-- None / Select Category --</option>
                        @for (c of filteredCategories; track c.id) {
                          <option [value]="c.id">{{ c.name }}</option>
                        }
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="required">Unit of Measure</label>
                      <select [(ngModel)]="form.unitId" class="form-control" required>
                        @for (u of units; track u.id) {
                          <option [value]="u.id">{{ u.name }} ({{ u.code }})</option>
                        }
                      </select>
                    </div>
                  </div>

                  <!-- LINE 3: 3 Fields -->
                  <div class="form-grid-3" style="margin-top: 16px;">
                    <div class="form-group">
                      <label class="required">Inventory Tracking Rule</label>
                      <select
                        [(ngModel)]="form.inventoryTracking"
                        (change)="onTrackingChanged()"
                        class="form-control font-bold"
                        [disabled]="form.productType === 'SERVICE'"
                      >
                        <option value="ITEM_WISE">Item Wise (Standard stock)</option>
                        <option value="BATCH_WISE">Batch Wise (Track batches & expiry)</option>
                        <option value="SERIAL_WISE">Serial Wise (Track individual serials)</option>
                        <option value="VARIANT_WISE">Variant Wise (Multi-attribute matrix)</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="required">GST Applicable?</label>
                      <select
                        [(ngModel)]="form.isGstApplicable"
                        (change)="onGstToggleChanged()"
                        class="form-control font-bold"
                      >
                        <option [ngValue]="true">Yes</option>
                        <option [ngValue]="false">No</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label [class.required]="form.isGstApplicable">
                        GST Rate (%)
                        @if (!isGstAtItemLevel) {
                          <span style="font-size: 0.6875rem; color: #4338CA;">({{ getGstResolutionBadgeLabel() }})</span>
                        }
                      </label>
                      @if (isGstAtItemLevel) {
                        <select
                          [(ngModel)]="form.gstRate"
                          class="form-control font-bold"
                          [disabled]="!form.isGstApplicable"
                        >
                          <option [value]="0">0% (Nil / Exempt)</option>
                          <option [value]="5">5% GST</option>
                          <option [value]="12">12% GST</option>
                          <option [value]="18">18% Standard GST</option>
                          <option [value]="28">28% Highest GST</option>
                        </select>
                      } @else {
                        <div class="gst-readonly-badge">
                          <i class="pi" [ngClass]="getGstResolutionIcon()"></i>
                          <span class="font-bold">{{ getResolvedItemFormGstRate() }}% GST</span>
                          <span class="badge-source">{{ getGstResolutionSourceText() }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- LINE 4: 3 Fields (HSN/SAC Code, Description, Image Upload) -->
                  <div class="form-grid-3" style="margin-top: 16px;">
                    <div class="form-group">
                      <label>HSN / SAC Code</label>
                      <input
                        type="text"
                        [(ngModel)]="form.hsnSac"
                        class="form-control font-mono"
                      />
                    </div>

                    <div class="form-group">
                      <label>Description</label>
                      <textarea
                        [(ngModel)]="form.description"
                        rows="3"
                        class="form-control"
                        style="resize: vertical; min-height: 82px;"
                      ></textarea>
                    </div>

                    <div class="form-group">
                      <label>Product Image</label>
                      <input #imageFileInput type="file" accept="image/*" (change)="onImageFileSelected($event)" style="display: none;" />
                      @if (!form.imageUrl) {
                        <div class="image-dropzone" (click)="imageFileInput.click()">
                          <i class="pi pi-upload upload-icon"></i>
                          <span class="upload-title">Upload Image</span>
                        </div>
                      } @else {
                        <div class="image-preview-card">
                          <img [src]="form.imageUrl" alt="Product Image" (error)="onImageError($event)" class="preview-thumb" />
                          <div class="preview-info">
                            <span class="preview-name">{{ imageFileName || 'Product Image' }}</span>
                            <div class="preview-actions">
                              <button type="button" class="btn-preview-action" (click)="imageFileInput.click()" title="Replace image">
                                <i class="pi pi-pencil"></i> Change
                              </button>
                              <button type="button" class="btn-preview-action text-danger" (click)="removeImage()" title="Remove image">
                                <i class="pi pi-trash"></i> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- TAB 2: VARIANTS & SKU MATRIX (WHEN VARIANT_WISE) -->
              @if (activeTab === 'variants' && form.inventoryTracking === 'VARIANT_WISE') {
                <div class="form-container">
                  <!-- STEP 1: VARIANT ATTRIBUTE SELECTOR -->
                  <div class="variants-config-card">
                    <div class="config-header">
                      <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--surface-900);">
                        Select Variants
                      </h4>

                      <!-- Dropdown to add variant dimension -->
                      <div style="display: flex; gap: 8px;">
                        <select #variantPicker class="form-control" style="width: auto; min-width: 200px;">
                          <option value="" disabled selected>Select Variant Dimension</option>
                          @for (vd of availableVariantDefinitions; track vd.id) {
                            <option [value]="vd.id">{{ vd.name }}</option>
                          }
                        </select>
                        <button type="button" class="btn-primary" (click)="addSelectedVariant(variantPicker.value); variantPicker.value = ''">
                          <i class="pi pi-plus"></i> Add Dimension
                        </button>
                      </div>
                    </div>

                    <!-- LIST OF SELECTED VARIANTS IN CLEAN LIST TABLE -->
                    @if (selectedVariants.length === 0) {
                      <div class="empty-variants-box">
                        <i class="pi pi-sliders-v" style="font-size: 1.5rem; color: var(--surface-400);"></i>
                        <span style="font-size: 0.875rem; color: var(--surface-500);">No variants added yet. Select a variant above.</span>
                      </div>
                    } @else {
                      <div class="variants-table-container">
                        <table class="variant-list-table">
                          <thead>
                            <tr>
                              <th style="width: 180px;">Variant</th>
                              <th>Values (Select Multiple)</th>
                              <th style="width: 50px; text-align: center;"></th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (sv of selectedVariants; track sv.definitionId; let vIdx = $index) {
                              <tr>
                                <td class="variant-col">
                                  <strong>{{ sv.definitionName }}</strong>
                                </td>
                                <td class="values-col">
                                  <div class="values-list-wrap">
                                    @for (opt of sv.availableOptions; track opt) {
                                      <label class="val-check-label" [class.checked]="sv.selectedValues.includes(opt)">
                                        <input
                                          type="checkbox"
                                          [checked]="sv.selectedValues.includes(opt)"
                                          (change)="toggleVariantValue(sv, opt)"
                                        />
                                        <span>{{ opt }}</span>
                                      </label>
                                    }

                                    <div class="inline-add-val">
                                      <input
                                        type="text"
                                        [(ngModel)]="sv.customValueInput"
                                        (keydown.enter)="$event.preventDefault(); addCustomValueToVariant(sv)"
                                      />
                                      <button type="button" class="btn-add-inline" (click)="addCustomValueToVariant(sv)">
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td class="text-center">
                                  <button type="button" class="btn-icon text-danger" (click)="removeSelectedVariant(vIdx)" title="Remove variant">
                                    <i class="pi pi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>

                      <!-- GENERATE COMBINATIONS TRIGGER -->
                      <div class="generate-bar">
                        <button type="button" class="btn-primary" (click)="generateSkuMatrix()">
                          <i class="pi pi-bolt"></i> Generate SKU Combinations
                        </button>
                      </div>
                    }
                  </div>

                  <!-- STEP 2: SKU MATRIX TABLE & EXCEL IMPORT/EXPORT -->
                  <div class="sku-matrix-card" style="margin-top: 20px;">
                    <div class="matrix-header">
                      <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--surface-900);">
                        Generated SKU Matrix ({{ skuRows.length }})
                      </h4>

                      <!-- EXCEL TEMPLATE DOWNLOAD & UPLOAD -->
                      <div class="excel-actions">
                        <button
                          type="button"
                          class="btn-excel-tool"
                          (click)="downloadVariantTemplate()"
                          title="Download pre-filled Excel/CSV template"
                        >
                          <i class="pi pi-download"></i> Download Template
                        </button>

                        <button
                          type="button"
                          class="btn-excel-tool"
                          (click)="fileInput.click()"
                          title="Upload from filled Excel/CSV template"
                        >
                          <i class="pi pi-upload"></i> Upload from Excel
                        </button>
                        <input
                          #fileInput
                          type="file"
                          accept=".csv"
                          (change)="onCsvFileUploaded($event)"
                          style="display: none;"
                        />
                      </div>
                    </div>

                    <!-- SKU TABLE IN FULL SCREEN -->
                    @if (skuRows.length === 0) {
                      <div class="matrix-empty">
                        <i class="pi pi-table" style="font-size: 1.75rem; color: var(--surface-400); margin-bottom: 6px;"></i>
                        <div>No SKU combinations generated yet.</div>
                      </div>
                    } @else {
                      <div class="matrix-table-wrapper">
                        <table class="matrix-table">
                          <thead>
                            <tr>
                              <th style="width: 180px;">Variant Combination</th>
                              <th style="min-width: 180px;">SKU Code *</th>
                              <th style="min-width: 160px;">Barcode</th>
                              <th style="width: 130px;">Opening Qty</th>
                              <th style="width: 130px;">Unit Rate ₹</th>
                              <th style="width: 130px;">MRP ₹</th>
                              <th style="width: 130px;">Sale Rate ₹</th>
                              <th style="width: 60px; text-align: center;">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of skuRows; track $index; let rIdx = $index) {
                              <tr>
                                <td>
                                  <span class="comb-badge">{{ row.name }}</span>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    [(ngModel)]="row.sku"
                                    class="form-control-sm font-mono font-bold"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    [(ngModel)]="row.barcode"
                                    class="form-control-sm font-mono"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    [(ngModel)]="row.openingQty"
                                    min="0"
                                    class="form-control-sm text-right"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    [(ngModel)]="row.purchaseRate"
                                    min="0"
                                    class="form-control-sm text-right"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    [(ngModel)]="row.mrp"
                                    min="0"
                                    class="form-control-sm text-right"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    [(ngModel)]="row.saleRate"
                                    min="0"
                                    class="form-control-sm text-right font-bold"
                                  />
                                </td>
                                <td class="text-center">
                                  <button type="button" class="btn-icon text-danger" (click)="removeSkuRow(rIdx)" title="Remove this SKU">
                                    <i class="pi pi-times"></i>
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
              }

              <!-- TAB 3: PRICING & INVENTORY -->
              @if (activeTab === 'pricing') {
                <div class="form-container">
                  <!-- Pricing Row 1: 3 Fields -->
                  <div class="form-grid-3">
                    <div class="form-group">
                      <label>Default Purchase / Cost Rate (₹)</label>
                      <input
                        type="number"
                        [(ngModel)]="form.purchaseRate"
                        (input)="onDefaultRatesChanged()"
                        min="0"
                        class="form-control"
                      />
                    </div>

                    <div class="form-group">
                      <label>Default Selling Rate (₹)</label>
                      <input
                        type="number"
                        [(ngModel)]="form.saleRate"
                        (input)="onDefaultRatesChanged()"
                        min="0"
                        class="form-control font-bold"
                      />
                    </div>

                    <div class="form-group">
                      <label>Maximum Retail Price (MRP ₹)</label>
                      <input
                        type="number"
                        [(ngModel)]="form.mrp"
                        (input)="onDefaultRatesChanged()"
                        min="0"
                        class="form-control"
                      />
                    </div>
                  </div>

                  <!-- Pricing Row 2: 3 Fields -->
                  <div class="form-grid-3" style="margin-top: 16px;">
                    <div class="form-group">
                      <label>Reorder Warning Level (Qty)</label>
                      <input
                        type="number"
                        [(ngModel)]="form.reorderLevel"
                        min="0"
                        class="form-control"
                      />
                    </div>

                    @if (form.inventoryTracking !== 'VARIANT_WISE') {
                      <div class="form-group">
                        <label>Opening Stock Quantity</label>
                        <input
                          type="number"
                          [(ngModel)]="form.openingQty"
                          min="0"
                          class="form-control"
                        />
                      </div>

                      <div class="form-group">
                        <label>Opening Valuation Rate (₹)</label>
                        <input
                          type="number"
                          [(ngModel)]="form.openingRate"
                          min="0"
                          class="form-control"
                        />
                      </div>
                    } @else {
                      <div class="form-group span-2" style="background: #EEF2FF; border: 1px dashed #C7D2FE; border-radius: 8px; padding: 12px; display: flex; align-items: center;">
                        <span style="font-weight: 700; color: #4338CA; font-size: 0.8125rem;">
                          <i class="pi pi-sliders-v"></i> Variant-wise opening stock configured in Variants & SKU Matrix tab
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- FOOTER BAR -->
            <div class="full-footer">
              <button type="button" class="btn-secondary" (click)="backToList()">
                <i class="pi pi-times"></i> Cancel
              </button>
              <button type="button" class="btn-primary" (click)="saveItem()" [disabled]="submitting || !form.name">
                @if (submitting) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> {{ viewMode === 'edit' ? 'Update Product' : 'Save Product Master' }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './items.component.scss',
})
export class ItemsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  units: any[] = [];
  itemGroups: any[] = [];
  itemCategories: any[] = [];
  filteredCategories: any[] = [];
  variantDefinitions: VariantDefinition[] = [];

  loading = false;
  submitting = false;

  // VIEW MODE: 'list' | 'create' | 'edit'
  viewMode: 'list' | 'create' | 'edit' = 'list';
  editingItem: any = null;
  activeTab = 'basic';
  imageFileName = '';

  searchQuery = '';
  typeFilter = 'ALL';
  trackingFilter = 'ALL';

  get gstActiveLevel(): string {
    return this.tenant.getGstActiveLevel();
  }

  get isGstAtItemLevel(): boolean {
    return this.gstActiveLevel === 'ITEM';
  }

  getGstResolutionBadgeLabel(): string {
    switch (this.gstActiveLevel) {
      case 'COMPANY': return 'Company Level';
      case 'ITEM_GROUP': return 'Group Level';
      case 'ITEM_CATEGORY': return 'Category Level';
      default: return 'Item Level';
    }
  }

  getGstResolutionIcon(): string {
    switch (this.gstActiveLevel) {
      case 'COMPANY': return 'pi-building text-primary';
      case 'ITEM_GROUP': return 'pi-folder text-primary';
      case 'ITEM_CATEGORY': return 'pi-tag text-primary';
      default: return 'pi-check-circle text-success';
    }
  }

  getResolvedItemFormGstRate(): number {
    if (this.gstActiveLevel === 'COMPANY') {
      return this.tenant.getCompanyFlatGstRate();
    }
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      const g = this.itemGroups.find((grp) => grp.id === this.form.itemGroupId);
      return Number(g?.gstRate) || 0;
    }
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      const c = this.itemCategories.find((cat) => cat.id === this.form.itemCategoryId);
      return Number(c?.gstRate) || 0;
    }
    return Number(this.form.gstRate) || 0;
  }

  getGstResolutionSourceText(): string {
    if (this.gstActiveLevel === 'COMPANY') {
      return 'Company Level Flat Rate';
    }
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      const g = this.itemGroups.find((grp) => grp.id === this.form.itemGroupId);
      return g ? `Group: ${g.name}` : 'Item Group';
    }
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      const c = this.itemCategories.find((cat) => cat.id === this.form.itemCategoryId);
      return c ? `Category: ${c.name}` : 'Item Category';
    }
    return 'Item Master';
  }

  onCategoryChanged() {
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      this.syncInheritedGstRate();
    }
  }

  syncInheritedGstRate() {
    if (this.gstActiveLevel === 'COMPANY') {
      this.form.gstRate = this.tenant.getCompanyFlatGstRate();
    } else if (this.gstActiveLevel === 'ITEM_GROUP') {
      const g = this.itemGroups.find((grp) => grp.id === this.form.itemGroupId);
      if (g) {
        this.form.gstRate = Number(g.gstRate) || 0;
        if (!this.form.hsnSac && g.hsnSac) {
          this.form.hsnSac = g.hsnSac;
        }
      }
    } else if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      const c = this.itemCategories.find((cat) => cat.id === this.form.itemCategoryId);
      if (c) {
        this.form.gstRate = Number(c.gstRate) || 0;
      }
    }
  }

  getItemGstDisplayRate(item: any): number {
    if (item.isGstApplicable === false) return 0;
    if (this.gstActiveLevel === 'COMPANY') {
      return this.tenant.getCompanyFlatGstRate();
    }
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      return Number(item.itemGroup?.gstRate ?? item.gstRate ?? 0);
    }
    if (this.gstActiveLevel === 'ITEM_CATEGORY') {
      return Number(item.category?.gstRate ?? item.gstRate ?? 0);
    }
    return Number(item.gstRate ?? 0);
  }

  getItemGstLevelTag(item: any): string {
    switch (this.gstActiveLevel) {
      case 'COMPANY': return 'Company';
      case 'ITEM_GROUP': return 'Group';
      case 'ITEM_CATEGORY': return 'Category';
      default: return 'Item';
    }
  }

  // Form State
  form: any = {
    productType: 'GOODS',
    name: '',
    sku: '',
    unitId: '',
    itemGroupId: '',
    itemCategoryId: '',
    isGstApplicable: true,
    hsnSac: '8401',
    gstRate: 18,
    inventoryTracking: 'ITEM_WISE',
    purchaseRate: 100,
    saleRate: 150,
    mrp: 199,
    reorderLevel: 5,
    openingQty: 0,
    openingRate: 100,
    imageUrl: '',
    description: '',
  };

  // Variant Configuration
  selectedVariants: SelectedVariantConfig[] = [];
  skuRows: SkuVariantRow[] = [];

  constructor(
    private masters: MastersService,
    public tenant: TenantService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadItems();
        this.loadUnits();
        this.loadGroups();
        this.loadCategories();
        this.loadVariantDefinitions();
      },
    });
  }

  get availableVariantDefinitions(): VariantDefinition[] {
    const selectedIds = this.selectedVariants.map((sv) => sv.definitionId);
    return this.variantDefinitions.filter((vd) => vd.isActive && !selectedIds.includes(vd.id));
  }

  loadItems() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.loading = true;
    this.masters.getItems(compId).subscribe({
      next: (res) => {
        this.items = Array.isArray(res) ? res : [];
        this.filterItems();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadUnits() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getUnits(compId).subscribe({
      next: (res) => {
        this.units = res || [];
        if (!this.form.unitId && this.units.length > 0) {
          this.form.unitId = this.units[0].id;
        }
      },
    });
  }

  loadGroups() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getItemGroups(compId).subscribe({
      next: (res) => (this.itemGroups = res || []),
    });
  }

  loadCategories() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getItemCategories(compId).subscribe({
      next: (res) => {
        this.itemCategories = res || [];
        this.filterCategoryList();
      },
    });
  }

  loadVariantDefinitions() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.masters.getVariantDefinitions(compId || undefined).subscribe({
      next: (res) => (this.variantDefinitions = Array.isArray(res) ? res : []),
    });
  }

  filterCategoryList() {
    if (this.form.itemGroupId) {
      this.filteredCategories = this.itemCategories.filter(
        (c) => c.itemGroupId === this.form.itemGroupId || !c.itemGroupId,
      );
    } else {
      this.filteredCategories = [...this.itemCategories];
    }
  }

  onGroupChanged() {
    this.filterCategoryList();
    if (this.gstActiveLevel === 'ITEM_GROUP') {
      this.syncInheritedGstRate();
    }
  }

  filterItems() {
    let result = [...this.items];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.sku?.toLowerCase().includes(q) ||
          i.hsnSac?.toLowerCase().includes(q),
      );
    }

    if (this.typeFilter !== 'ALL') {
      result = result.filter((i) => i.productType === this.typeFilter);
    }

    if (this.trackingFilter !== 'ALL') {
      result = result.filter((i) => i.inventoryTracking === this.trackingFilter);
    }

    this.filteredItems = result;
  }

  onProductTypeChanged() {
    if (this.form.productType === 'SERVICE') {
      this.form.inventoryTracking = 'ITEM_WISE';
    }
  }

  setProductType(type: 'GOODS' | 'SERVICE') {
    this.form.productType = type;
    this.onProductTypeChanged();
  }

  onProductNameChanged() {
    if (this.viewMode === 'create' && this.form.name && !this.form.sku) {
      this.form.sku = this.form.name
        .substring(0, 8)
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
    }
  }

  onBaseSkuChanged() {
    // Keeps custom base SKU
  }

  onGstToggleChanged() {
    if (!this.form.isGstApplicable) {
      this.form.gstRate = 0;
    } else if (this.form.gstRate === 0) {
      this.form.gstRate = 18;
    }
  }

  onTrackingChanged() {
    if (this.form.inventoryTracking === 'VARIANT_WISE') {
      this.activeTab = 'variants';
      if (this.selectedVariants.length === 0 && this.variantDefinitions.length > 0) {
        const firstDef = this.variantDefinitions[0];
        this.addSelectedVariant(firstDef.id);
      }
    }
  }

  onDefaultRatesChanged() {
    if (this.skuRows.length > 0) {
      for (const row of this.skuRows) {
        if (!row.purchaseRate) row.purchaseRate = Number(this.form.purchaseRate || 0);
        if (!row.mrp) row.mrp = Number(this.form.mrp || 0);
        if (!row.saleRate) row.saleRate = Number(this.form.saleRate || 0);
      }
    }
  }

  // --- VARIANT CONFIGURATION METHODS ---

  addSelectedVariant(definitionId: string) {
    if (!definitionId) return;
    const def = this.variantDefinitions.find((d) => d.id === definitionId);
    if (!def) return;

    const availableOpts = Array.isArray(def.options) ? [...def.options] : [];
    const initialSelected = def.type === 'DROPDOWN' && availableOpts.length > 0 ? availableOpts.slice(0, 2) : [];

    this.selectedVariants.push({
      definitionId: def.id,
      definitionName: def.name,
      definitionCode: def.code || def.name.substring(0, 3).toUpperCase(),
      definitionType: def.type,
      availableOptions: availableOpts,
      selectedValues: initialSelected,
      customValueInput: '',
    });
  }

  removeSelectedVariant(index: number) {
    this.selectedVariants.splice(index, 1);
  }

  toggleVariantValue(sv: SelectedVariantConfig, val: string) {
    const idx = sv.selectedValues.indexOf(val);
    if (idx >= 0) {
      sv.selectedValues.splice(idx, 1);
    } else {
      sv.selectedValues.push(val);
    }
  }

  addCustomValueToVariant(sv: SelectedVariantConfig) {
    const val = sv.customValueInput?.trim();
    if (!val) return;
    if (!sv.availableOptions.includes(val)) {
      sv.availableOptions.push(val);
    }
    if (!sv.selectedValues.includes(val)) {
      sv.selectedValues.push(val);
    }
    sv.customValueInput = '';
  }

  removeActiveValue(sv: SelectedVariantConfig, index: number) {
    sv.selectedValues.splice(index, 1);
  }

  generateSkuMatrix() {
    const validVariants = this.selectedVariants.filter((sv) => sv.selectedValues.length > 0);
    if (validVariants.length === 0) {
      this.toast.show('warning', 'Please select at least one value for your variants.', 'No Values Selected');
      return;
    }

    const valueLists = validVariants.map((sv) => sv.selectedValues);
    const cartesian = this.cartesianProduct(valueLists);

    const baseSku = (this.form.sku || this.form.name || 'SKU')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();

    const newRows: SkuVariantRow[] = cartesian.map((combination) => {
      const attributes: Record<string, string> = {};
      const codeParts: string[] = [];
      const nameParts: string[] = [];

      combination.forEach((val: string, idx: number) => {
        const dim = validVariants[idx];
        attributes[dim.definitionName] = val;
        nameParts.push(val);
        codeParts.push(val.substring(0, 4).replace(/[^A-Za-z0-9]/g, '').toUpperCase());
      });

      const variantName = nameParts.join(' / ');
      const skuCode = `${baseSku}-${codeParts.join('-')}`;
      const barcode = '890' + Math.floor(100000000 + Math.random() * 900000000);

      const existing = this.skuRows.find((r) => r.name === variantName || r.sku === skuCode);

      return {
        name: variantName,
        sku: existing?.sku || skuCode,
        barcode: existing?.barcode || barcode,
        attributes,
        openingQty: existing?.openingQty !== undefined ? existing.openingQty : 0,
        purchaseRate: existing?.purchaseRate !== undefined ? existing.purchaseRate : Number(this.form.purchaseRate || 0),
        mrp: existing?.mrp !== undefined ? existing.mrp : Number(this.form.mrp || 0),
        saleRate: existing?.saleRate !== undefined ? existing.saleRate : Number(this.form.saleRate || 0),
      };
    });

    this.skuRows = newRows;
    this.toast.show('success', `Generated ${this.skuRows.length} SKU combinations!`, 'SKUs Generated');
  }

  cartesianProduct(arrays: any[][]): any[][] {
    return arrays.reduce((acc, curr) => {
      return acc.flatMap((a) => curr.map((c) => [...a, c]));
    }, [[]] as any[][]);
  }

  removeSkuRow(index: number) {
    this.skuRows.splice(index, 1);
  }

  // --- EXCEL TEMPLATE DOWNLOAD & UPLOAD ---

  downloadVariantTemplate() {
    const headers = ['SKU Code', 'Variant Name', 'Opening Qty', 'Rate', 'MRP', 'Sale Rate', 'Barcode'];
    let rows: any[][] = [];

    if (this.skuRows.length > 0) {
      rows = this.skuRows.map((r) => [
        r.sku,
        r.name,
        r.openingQty,
        r.purchaseRate,
        r.mrp,
        r.saleRate,
        r.barcode,
      ]);
    } else {
      const baseSku = (this.form.sku || 'SAMPLE-SKU').toUpperCase();
      rows = [
        [`${baseSku}-RED-M`, 'Red / M', 10, Number(this.form.purchaseRate || 100), Number(this.form.mrp || 199), Number(this.form.saleRate || 150), '890123456701'],
        [`${baseSku}-RED-L`, 'Red / L', 15, Number(this.form.purchaseRate || 100), Number(this.form.mrp || 199), Number(this.form.saleRate || 150), '890123456702'],
        [`${baseSku}-BLUE-M`, 'Blue / M', 12, Number(this.form.purchaseRate || 100), Number(this.form.mrp || 199), Number(this.form.saleRate || 150), '890123456703'],
      ];
    }

    const filename = `${(this.form.sku || this.form.name || 'Product').replace(/\s+/g, '_')}_Variant_Template`;
    exportToCsv(filename, headers, rows);
    this.toast.show('success', 'Excel template downloaded. Fill rates and upload back anytime!', 'Template Downloaded');
  }

  onCsvFileUploaded(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const text = e.target.result;
        const parsed = this.parseCsv(text);
        if (parsed.length === 0) {
          this.toast.show('error', 'CSV file contains no valid rows.', 'Import Error');
          return;
        }

        const importedRows: SkuVariantRow[] = parsed.map((item) => {
          const sku = item['SKU Code'] || item['sku'] || item['SKU'] || '';
          const name = item['Variant Name'] || item['variant_name'] || item['Name'] || sku;
          const openingQty = Number(item['Opening Qty'] || item['qty'] || item['Quantity'] || 0);
          const purchaseRate = Number(item['Rate'] || item['Purchase Rate'] || item['rate'] || this.form.purchaseRate || 0);
          const mrp = Number(item['MRP'] || item['mrp'] || this.form.mrp || 0);
          const saleRate = Number(item['Sale Rate'] || item['sale_rate'] || this.form.saleRate || 0);
          const barcode = item['Barcode'] || item['barcode'] || '';

          return {
            name,
            sku,
            barcode,
            attributes: {},
            openingQty,
            purchaseRate,
            mrp,
            saleRate,
          };
        });

        this.skuRows = importedRows;
        this.toast.show('success', `Imported ${importedRows.length} variant SKUs from Excel successfully!`, 'Import Complete');
      } catch (err: any) {
        this.toast.show('error', 'Failed to parse CSV file: ' + err.message, 'Import Error');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  parseCsv(text: string): any[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values: string[] = [];
      let inQuotes = false;
      let curVal = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      result.push(rowObj);
    }
    return result;
  }

  // --- VIEW MODE & FULL PAGE OPERATIONS ---

  openCreateProduct() {
    this.editingItem = null;
    this.imageFileName = '';
    this.form = {
      productType: 'GOODS',
      name: '',
      sku: '',
      unitId: this.units[0]?.id || '',
      itemGroupId: '',
      itemCategoryId: '',
      isGstApplicable: true,
      hsnSac: '8401',
      gstRate: 18,
      inventoryTracking: 'ITEM_WISE',
      purchaseRate: 100,
      saleRate: 150,
      mrp: 199,
      reorderLevel: 5,
      openingQty: 0,
      openingRate: 100,
      imageUrl: '',
      description: '',
    };
    this.selectedVariants = [];
    this.skuRows = [];
    this.activeTab = 'basic';
    this.filterCategoryList();
    this.syncInheritedGstRate();
    this.viewMode = 'create';
  }

  openEditProduct(item: any) {
    this.editingItem = item;
    this.imageFileName = item.imageUrl ? 'Product Image' : '';
    this.form = {
      productType: item.productType || 'GOODS',
      name: item.name,
      sku: item.sku || '',
      unitId: item.unitId || this.units[0]?.id || '',
      itemGroupId: item.itemGroupId || '',
      itemCategoryId: item.itemCategoryId || '',
      isGstApplicable: item.isGstApplicable !== false,
      hsnSac: item.hsnSac || '',
      gstRate: item.gstRate || 0,
      inventoryTracking: item.inventoryTracking || (item.hasVariants ? 'VARIANT_WISE' : 'ITEM_WISE'),
      purchaseRate: item.purchaseRate || 0,
      saleRate: item.saleRate || 0,
      mrp: item.mrp || 0,
      reorderLevel: item.reorderLevel || 5,
      openingQty: item.openingQty || 0,
      openingRate: item.openingRate || item.purchaseRate || 0,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
    };

    this.selectedVariants = [];
    this.skuRows = [];

    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      this.skuRows = item.variants.map((v: any) => ({
        name: v.name,
        sku: v.sku || '',
        barcode: v.barcode || '',
        attributes: v.attributes || {},
        openingQty: v.openingQty || 0,
        purchaseRate: v.purchaseRate || item.purchaseRate || 0,
        mrp: v.mrp || item.mrp || 0,
        saleRate: v.saleRate || item.saleRate || 0,
      }));
    }

    this.activeTab = 'basic';
    this.filterCategoryList();
    if (this.gstActiveLevel !== 'ITEM') {
      this.syncInheritedGstRate();
    }
    this.viewMode = 'edit';
  }

  backToList() {
    this.viewMode = 'list';
    this.editingItem = null;
  }

  deleteItem(item: any) {
    if (!confirm(`Are you sure you want to delete the product "${item.name}"?`)) return;

    this.masters.deleteItem(item.id).subscribe({
      next: () => {
        this.loadItems();
        this.toast.show('success', `Product "${item.name}" deleted successfully.`, 'Product Deleted');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete product';
        this.toast.show('error', msg, 'Error');
      },
    });
  }

  saveItem() {
    if (!this.form.name.trim()) {
      this.toast.show('error', 'Product name is required.', 'Validation Error');
      return;
    }

    if (this.gstActiveLevel !== 'ITEM') {
      this.syncInheritedGstRate();
    }

    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    this.submitting = true;

    const payload: any = {
      ...this.form,
      companyId: compId,
      hasVariants: this.form.inventoryTracking === 'VARIANT_WISE',
    };

    if (this.form.inventoryTracking === 'VARIANT_WISE') {
      payload.variants = this.skuRows.map((r) => ({
        name: r.name,
        sku: r.sku,
        barcode: r.barcode,
        attributes: r.attributes,
        purchaseRate: Number(r.purchaseRate || 0),
        saleRate: Number(r.saleRate || 0),
        mrp: Number(r.mrp || 0),
        openingQty: Number(r.openingQty || 0),
        openingRate: Number(r.purchaseRate || 0),
        isActive: true,
      }));
    }

    if (this.viewMode === 'edit' && this.editingItem) {
      this.masters.updateItem(this.editingItem.id, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.viewMode = 'list';
          this.loadItems();
          this.toast.show('success', `Product "${this.form.name}" updated successfully!`, 'Product Updated');
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.message || 'Failed to update product';
          this.toast.show('error', msg, 'Error');
        },
      });
    } else {
      this.masters.createItem(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.viewMode = 'list';
          this.loadItems();
          this.toast.show('success', `Product "${this.form.name}" created successfully!`, 'Product Created');
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.message || 'Failed to create product';
          this.toast.show('error', msg, 'Error');
        },
      });
    }
  }

  formatTracking(tracking: string): string {
    switch (tracking) {
      case 'VARIANT_WISE':
        return 'Variant Wise';
      case 'BATCH_WISE':
        return 'Batch Wise';
      case 'SERIAL_WISE':
        return 'Serial Wise';
      case 'ITEM_WISE':
      default:
        return 'Item Wise';
    }
  }

  onImageFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.show('error', 'Please select a valid image file (PNG, JPG, WEBP).', 'Invalid File');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.show('error', 'Image size must be less than 5 MB.', 'File Too Large');
      return;
    }
    this.imageFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.form.imageUrl = reader.result as string;
      this.toast.show('success', `Image "${file.name}" uploaded successfully.`, 'Image Ready');
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.form.imageUrl = '';
    this.imageFileName = '';
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  exportItems() {
    if (!this.filteredItems || this.filteredItems.length === 0) return;
    const headers = [
      'Product Name',
      'Type',
      'SKU Code',
      'Group',
      'Category',
      'Unit',
      'Tracking Rule',
      'Variants Count',
      'Purchase Rate',
      'Sale Rate',
      'GST Rate',
    ];
    const rows = this.filteredItems.map((i: any) => [
      i.name || '',
      i.productType || 'GOODS',
      i.sku || '',
      i.itemGroup?.name || '',
      i.category?.name || '',
      i.unit?.code || 'NOS',
      this.formatTracking(i.inventoryTracking),
      i.variants ? i.variants.length : 0,
      i.purchaseRate || 0,
      i.saleRate || 0,
      i.gstRate || 0,
    ]);
    exportToCsv('Products_Master', headers, rows);
    this.toast.show('success', 'Products exported successfully!', 'Export Complete');
  }
}
