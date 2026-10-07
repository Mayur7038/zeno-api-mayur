import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManufacturingService } from '../../core/services/manufacturing.service';
import { MastersService } from '../../core/services/masters.service';
import { TenantService } from '../../core/services/tenant.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';

interface ProductionLine {
  itemId: string;
  variantId?: string | null;
  consumedQty: number;
  unitRate: number;
  amount: number;
  notes?: string;
}

@Component({
  selector: 'app-production-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manufacturing-page">
      @if (viewMode === 'list') {
        <div class="page-header">
          <h1>Production</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreatePage()">
              <i class="pi pi-plus"></i> Record Assembly Run
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
                (input)="filterEntries()"
              />
            </div>
            <div class="toolbar-filters" style="display: flex; gap: 8px; align-items: center;">
              <select [(ngModel)]="statusFilter" (change)="filterEntries()" class="filter-select" style="min-width: 150px;">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button class="btn-export" (click)="exportEntries()" [disabled]="filteredEntries.length === 0" title="Export to CSV">
                <i class="pi pi-download"></i> Export
              </button>
            </div>
          </div>

          <!-- PRODUCTION ENTRIES TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Finished Product</th>
                <th>BOM Recipe</th>
                <th class="text-right">Qty Assembled</th>
                <th>Source Godown</th>
                <th>Target Godown</th>
                <th class="text-right">Total Cost</th>
                <th class="text-right">Unit Cost</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="11" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    <i class="pi pi-spin pi-spinner"></i> Loading assembly runs...
                  </td>
                </tr>
              } @else if (filteredEntries.length === 0) {
                <tr>
                  <td colspan="11" class="text-center" style="padding: 40px; color: var(--surface-500);">
                    No assembly runs found. Click "Record Assembly Run" to convert raw materials into finished goods.
                  </td>
                </tr>
              } @else {
                @for (entry of filteredEntries; track entry.id) {
                  <tr>
                    <td>
                      <span class="badge badge-custom font-mono font-bold">{{ entry.voucherNo }}</span>
                    </td>
                    <td>{{ entry.entryDate | date:'mediumDate' }}</td>
                    <td>
                      <div class="font-bold">{{ entry.finishedItem?.name || 'Product' }}</div>
                      @if (entry.finishedVariant) {
                        <div class="text-muted text-xs">{{ entry.finishedVariant?.name }}</div>
                      }
                    </td>
                    <td>
                      @if (entry.bom) {
                        <span class="badge badge-info">{{ entry.bom?.name }}</span>
                      } @else {
                        <span class="text-muted text-xs">Custom Assembly</span>
                      }
                    </td>
                    <td class="text-right font-mono font-bold">
                      {{ entry.assembledQty }} {{ entry.finishedItem?.unit?.code || '' }}
                    </td>
                    <td>
                      <span class="godown-pill source">
                        <i class="pi pi-box"></i> {{ entry.sourceGodown?.name || 'Raw Godown' }}
                      </span>
                    </td>
                    <td>
                      <span class="godown-pill target">
                        <i class="pi pi-check-circle"></i> {{ entry.targetGodown?.name || 'FG Godown' }}
                      </span>
                    </td>
                    <td class="text-right font-mono font-bold">
                      ₹{{ entry.totalCost | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-emerald">
                      ₹{{ entry.unitCost | number:'1.2-2' }}
                    </td>
                    <td>
                      <span
                        class="badge"
                        [class.badge-success]="entry.status === 'COMPLETED'"
                        [class.badge-danger]="entry.status === 'CANCELLED'"
                      >
                        {{ entry.status }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn-icon"
                          title="View Details"
                          (click)="viewEntryDetails(entry)"
                        >
                          <i class="pi pi-eye"></i>
                        </button>
                        @if (entry.status === 'COMPLETED') {
                          <button
                            type="button"
                            class="btn-icon text-danger"
                            title="Reverse Assembly Run"
                            (click)="reverseEntry(entry)"
                          >
                            <i class="pi pi-undo"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- FULL PAGE RECORD ASSEMBLY -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Record Assembly Run</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="saveProductionEntry()" [disabled]="saving">
              @if (saving) {
                <i class="pi pi-spin pi-spinner"></i> Processing Assembly...
              } @else {
                <i class="pi pi-check-circle"></i> Execute Assembly Run
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          @if (errorMessage) {
            <div class="alert-error">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <!-- RECIPE & PRODUCT SELECTION -->
          <div class="form-grid-4">
            <div class="form-group">
              <label>Apply BOM Recipe</label>
              <select [(ngModel)]="selectedBomId" (change)="onBomSelected()" class="form-control">
                <option value="">-- Manual / Custom Run --</option>
                @for (b of boms; track b.id) {
                  <option [value]="b.id">{{ b.name }} (Yield: {{ b.producedQty }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Finished Product</label>
              <select [(ngModel)]="formData.finishedItemId" class="form-control" [disabled]="!!selectedBomId">
                <option value="">-- Select Finished Product --</option>
                @for (it of items; track it.id) {
                  <option [value]="it.id">{{ it.name }} (SKU: {{ it.sku || 'N/A' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Qty to Assemble</label>
              <input
                type="number"
                min="0.001"
                step="any"
                [(ngModel)]="formData.assembledQty"
                (input)="onAssembledQtyChange()"
                class="form-control font-mono font-bold"
              />
            </div>

            <div class="form-group">
              <label class="required">Production Date</label>
              <input type="date" [(ngModel)]="formData.entryDate" class="form-control" />
            </div>
          </div>

          <!-- WAREHOUSES ROW -->
          <div class="form-grid-3" style="margin-top: 16px;">
            <div class="form-group">
              <label class="required">Source Godown (Raw Materials)</label>
              <select [(ngModel)]="formData.sourceGodownId" class="form-control">
                <option value="">-- Select Source Godown --</option>
                @for (g of godowns; track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Main' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Target Godown (Finished Goods)</label>
              <select [(ngModel)]="formData.targetGodownId" class="form-control">
                <option value="">-- Select Target Godown --</option>
                @for (g of godowns; track g.id) {
                  <option [value]="g.id">{{ g.name }} ({{ g.code || 'Main' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Voucher No</label>
              <input
                type="text"
                [(ngModel)]="formData.voucherNo"
                class="form-control font-mono"
              />
            </div>
          </div>

          <!-- RAW MATERIALS CONSUMPTION TABLE -->
          <div class="section-title-bar">
            <span>Raw Materials Consumed (Stock Deducted)</span>
            <button type="button" class="btn-sm btn-outline" (click)="addComponentLine()">
              <i class="pi pi-plus"></i> Add Extra Material
            </button>
          </div>

          <div class="lines-table-wrap">
            <table class="zeno-table lines-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Raw Material Item</th>
                  <th style="width: 18%;" class="text-right">Consumed Qty</th>
                  <th style="width: 18%;" class="text-right">Unit Rate ₹</th>
                  <th style="width: 18%;" class="text-right">Amount ₹</th>
                  <th style="width: 6%;" class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                @if (lines.length === 0) {
                  <tr>
                    <td colspan="5" class="text-center" style="padding: 24px; color: var(--surface-500);">
                      No raw material components added. Select a BOM Recipe or click "Add Extra Material".
                    </td>
                  </tr>
                }
                @for (line of lines; track $index; let idx = $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="line.itemId" (change)="onItemSelect(line)" class="form-control">
                        <option value="">-- Select Material Item --</option>
                        @for (it of items; track it.id) {
                          <option [value]="it.id">{{ it.name }} (Current Stock: {{ it.currentStock || 0 }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        [(ngModel)]="line.consumedQty"
                        (input)="updateLineTotal(line)"
                        class="form-control text-right font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        [(ngModel)]="line.unitRate"
                        (input)="updateLineTotal(line)"
                        class="form-control text-right font-mono"
                      />
                    </td>
                    <td class="text-right font-mono font-bold">
                      ₹{{ line.amount | number:'1.2-2' }}
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-icon text-danger" (click)="removeComponentLine(idx)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- ADDITIONAL OVERHEADS & TOTALS -->
          <div class="form-grid-2" style="margin-bottom: 16px;">
            <div class="form-group">
              <label>Additional Labor Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                [(ngModel)]="formData.additionalLaborCost"
                (input)="recalculateTotals()"
                class="form-control font-mono"
              />
            </div>
            <div class="form-group">
              <label>Additional Overhead Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                [(ngModel)]="formData.additionalOverheadCost"
                (input)="recalculateTotals()"
                class="form-control font-mono"
              />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label>Production Notes & Observations</label>
            <textarea
              [(ngModel)]="formData.notes"
              rows="2"
              class="form-control"
            ></textarea>
          </div>

          <!-- LIVE COST SUMMARY BOX -->
          <div class="cost-summary-box">
            <div class="cost-item">
              <span class="cost-label">Raw Material Total:</span>
              <span class="cost-val">₹{{ rawMaterialTotal | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Labor Cost:</span>
              <span class="cost-val">₹{{ (formData.additionalLaborCost || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Overheads:</span>
              <span class="cost-val">₹{{ (formData.additionalOverheadCost || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item total-highlight">
              <span class="cost-label">Total Production Cost:</span>
              <span class="cost-val font-bold">₹{{ grandTotalCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item unit-highlight">
              <span class="cost-label">Output Unit Cost:</span>
              <span class="cost-val font-bold font-mono">
                ₹{{ (grandTotalCost / (formData.assembledQty || 1)) | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedEntry) {
        <!-- FULL PAGE VIEW ASSEMBLY VOUCHER -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Assembly Voucher: {{ selectedEntry.voucherNo }}</h1>
            <span
              class="badge"
              [class.badge-success]="selectedEntry.status === 'COMPLETED'"
              [class.badge-danger]="selectedEntry.status === 'CANCELLED'"
              style="margin-left: 6px;"
            >
              {{ selectedEntry.status }}
            </span>
          </div>
          <div class="header-actions">
            @if (selectedEntry.status === 'COMPLETED') {
              <button
                class="btn-danger"
                (click)="reverseEntry(selectedEntry)"
              >
                <i class="pi pi-undo"></i> Reverse Assembly
              </button>
            }
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" onclick="window.print()"><i class="pi pi-print"></i> Print Voucher</button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Date</span>
              <span class="value">{{ selectedEntry.entryDate | date:'mediumDate' }}</span>
            </div>
            <div class="info-block">
              <span class="label">Finished Product</span>
              <span class="value font-bold">{{ selectedEntry.finishedItem?.name }}</span>
            </div>
            <div class="info-block">
              <span class="label">Assembled Qty</span>
              <span class="value font-mono font-bold">
                {{ selectedEntry.assembledQty }} {{ selectedEntry.finishedItem?.unit?.code || 'Units' }}
              </span>
            </div>
            <div class="info-block">
              <span class="label">Unit Cost</span>
              <span class="value font-mono font-bold text-emerald">
                ₹{{ selectedEntry.unitCost | number:'1.2-2' }}
              </span>
            </div>
            <div class="info-block">
              <span class="label">Source Godown</span>
              <span class="value">{{ selectedEntry.sourceGodown?.name || 'Main Godown' }}</span>
            </div>
            <div class="info-block">
              <span class="label">Target Godown</span>
              <span class="value">{{ selectedEntry.targetGodown?.name || 'FG Godown' }}</span>
            </div>
            <div class="info-block">
              <span class="label">Recipe Used</span>
              <span class="value">{{ selectedEntry.bom?.name || 'Custom Assembly' }}</span>
            </div>
            <div class="info-block">
              <span class="label">Total Batch Cost</span>
              <span class="value font-mono font-bold" style="color: #1e40af;">
                ₹{{ selectedEntry.totalCost | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <div class="section-title-bar" style="margin-top: 24px;">
            <span>Raw Materials Consumed</span>
          </div>

          <table class="zeno-table" style="border: 1px solid var(--surface-200); border-radius: 8px;">
            <thead>
              <tr>
                <th>Component Name</th>
                <th class="text-right">Consumed Qty</th>
                <th class="text-right">Unit Rate ₹</th>
                <th class="text-right">Total Amount ₹</th>
              </tr>
            </thead>
            <tbody>
              @for (it of selectedEntry.items; track it.id) {
                <tr>
                  <td class="font-bold">{{ it.item?.name }}</td>
                  <td class="text-right font-mono">
                    {{ it.consumedQty }} {{ it.item?.unit?.code || '' }}
                  </td>
                  <td class="text-right font-mono">₹{{ it.unitRate | number:'1.2-2' }}</td>
                  <td class="text-right font-mono font-bold">₹{{ it.amount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="cost-summary-box" style="margin-top: 20px;">
            <div class="cost-item">
              <span class="cost-label">Raw Material Cost:</span>
              <span class="cost-val">₹{{ selectedEntry.rawMaterialCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Direct Labor:</span>
              <span class="cost-val">₹{{ selectedEntry.additionalLaborCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Overheads:</span>
              <span class="cost-val">₹{{ selectedEntry.additionalOverheadCost | number:'1.2-2' }}</span>
            </div>
            <div class="cost-item total-highlight">
              <span class="cost-label">Grand Total:</span>
              <span class="cost-val font-bold">₹{{ selectedEntry.totalCost | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manufacturing-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-header h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-back { background: var(--surface-100); border: 1px solid var(--surface-300); color: var(--surface-700); border-radius: var(--radius-sm, 6px); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
    .btn-back:hover { background: var(--surface-200); color: var(--surface-900); }
    .form-page-card { padding: 24px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .table-toolbar { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-200); }
    .toolbar-search { position: relative; flex: 1; max-width: 440px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); font-size: 0.875rem; }
    .toolbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; }
    .toolbar-search input:focus { border-color: var(--primary-600); }
    .toolbar-filters { display: flex; gap: 10px; }

    .badge-custom { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .badge-info { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }

    .godown-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; padding: 3px 8px; border-radius: 4px; }
    .godown-pill.source { background: #fef3c7; color: #92400e; }
    .godown-pill.target { background: #d1fae5; color: #065f46; }

    .text-emerald { color: #047857 !important; font-weight: 600; }
    .text-muted { color: var(--surface-500); }
    .text-xs { font-size: 0.75rem; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: none; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; color: var(--surface-600); transition: all 0.15s; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-900); }
    .text-danger { color: #dc2626 !important; }
    .text-danger:hover { background: #fee2e2 !important; }

    .btn-danger { background: #dc2626; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-danger:hover { background: #b91c1c; }

    .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.875rem; outline: none; background: #fff; }
    .form-control:focus { border-color: var(--primary-600); }

    .section-title-bar { display: flex; justify-content: space-between; align-items: center; margin: 20px 0 10px 0; font-weight: 700; color: var(--surface-800); font-size: 0.9375rem; border-bottom: 2px solid var(--surface-100); padding-bottom: 6px; }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; font-weight: 600; cursor: pointer; }
    .btn-outline { background: #fff; border: 1px solid var(--primary-600, #2563EB); color: var(--primary-600, #2563EB); }
    .btn-outline:hover { background: var(--primary-50, #eff6ff); }

    .lines-table-wrap { border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
    .lines-table td { padding: 8px 10px; }
    .lines-table .form-control { padding: 6px 8px; }

    .cost-summary-box { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .cost-item { display: flex; flex-direction: column; gap: 2px; }
    .cost-label { font-size: 0.75rem; color: var(--surface-500); text-transform: uppercase; font-weight: 600; }
    .cost-val { font-size: 1rem; color: var(--surface-800); }
    .total-highlight .cost-val { color: #1e40af; font-size: 1.15rem; }
    .unit-highlight .cost-val { color: #047857; font-size: 1.15rem; }

    .detail-card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: var(--surface-50); padding: 14px; border-radius: 8px; }
    .info-block { display: flex; flex-direction: column; gap: 3px; }
    .info-block .label { font-size: 0.75rem; color: var(--surface-500); text-transform: uppercase; font-weight: 600; }
    .info-block .value { font-size: 0.9375rem; color: var(--surface-900); }
    .alert-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class ProductionEntriesComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  entries: any[] = [];
  filteredEntries: any[] = [];
  boms: any[] = [];
  items: any[] = [];
  godowns: any[] = [];

  loading = false;
  saving = false;
  searchQuery = '';
  statusFilter = 'ALL';

  selectedEntry: any | null = null;
  selectedBomId = '';
  errorMessage = '';

  formData = {
    voucherNo: '',
    entryDate: new Date().toISOString().split('T')[0],
    finishedItemId: '',
    assembledQty: 1,
    sourceGodownId: '',
    targetGodownId: '',
    additionalLaborCost: 0,
    additionalOverheadCost: 0,
    notes: '',
  };

  lines: ProductionLine[] = [];

  constructor(
    private manufacturingService: ManufacturingService,
    private mastersService: MastersService,
    private tenantService: TenantService,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  get totalUnitsProduced(): number {
    return this.entries
      .filter((e) => e.status === 'COMPLETED')
      .reduce((acc, e) => acc + (Number(e.assembledQty) || 0), 0);
  }

  get totalProductionValue(): number {
    return this.entries
      .filter((e) => e.status === 'COMPLETED')
      .reduce((acc, e) => acc + (Number(e.totalCost) || 0), 0);
  }

  get rawMaterialTotal(): number {
    return this.lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  }

  get grandTotalCost(): number {
    return (
      this.rawMaterialTotal +
      (Number(this.formData.additionalLaborCost) || 0) +
      (Number(this.formData.additionalOverheadCost) || 0)
    );
  }

  loadData() {
    this.loading = true;
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!companyId) {
      this.loading = false;
      return;
    }

    // Load Items, Godowns, BOMs, and Production Entries
    this.mastersService.getItems(companyId).subscribe({
      next: (items) => {
        this.items = items || [];
      },
    });

    this.api.get<any[]>('/tenancy/godowns').subscribe({
      next: (godowns) => {
        this.godowns = (godowns && godowns.length > 0) ? godowns : this.tenantService.godowns();
      },
      error: () => {
        this.godowns = this.tenantService.godowns() || [];
      },
    });

    this.manufacturingService.getBoms(companyId).subscribe({
      next: (boms) => {
        this.boms = (boms || []).filter((b) => b.isActive);
      },
    });

    this.manufacturingService.getProductionEntries(companyId).subscribe({
      next: (entries) => {
        this.entries = entries || [];
        this.filterEntries();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterEntries() {
    let result = [...this.entries];

    if (this.statusFilter !== 'ALL') {
      result = result.filter((e) => e.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.voucherNo?.toLowerCase().includes(q) ||
          e.finishedItem?.name?.toLowerCase().includes(q) ||
          e.bom?.name?.toLowerCase().includes(q),
      );
    }

    this.filteredEntries = result;
  }

  exportEntries() {
    if (!this.filteredEntries || this.filteredEntries.length === 0) return;
    const headers = ['Voucher No', 'Date', 'Finished Product', 'BOM Recipe', 'Qty Assembled', 'Source Warehouse', 'Target Warehouse', 'Total Cost', 'Status'];
    const rows = this.filteredEntries.map((e) => [
      e.voucherNo || '',
      e.entryDate || '',
      e.finishedItem?.name || '',
      e.bom?.name || '',
      e.assembledQty || 0,
      e.sourceGodown?.name || '',
      e.targetGodown?.name || '',
      e.totalCost || 0,
      e.status || ''
    ]);
    exportToCsv('Production_Entries', headers, rows);
    this.toast.success('Production entries exported successfully!', 'Export Complete');
  }

  openCreatePage() {
    this.selectedBomId = '';
    const defaultGodownId = this.godowns.length > 0 ? this.godowns[0].id : '';
    const defaultTargetId = this.godowns.length > 1 ? this.godowns[1].id : defaultGodownId;

    this.formData = {
      voucherNo: '',
      entryDate: new Date().toISOString().split('T')[0],
      finishedItemId: this.items.length > 0 ? this.items[0].id : '',
      assembledQty: 1,
      sourceGodownId: defaultGodownId,
      targetGodownId: defaultTargetId,
      additionalLaborCost: 0,
      additionalOverheadCost: 0,
      notes: '',
    };

    this.lines = [];
    this.addComponentLine();
    this.errorMessage = '';
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedEntry = null;
    this.errorMessage = '';
  }

  onBomSelected() {
    if (!this.selectedBomId) {
      return;
    }

    const bom = this.boms.find((b) => b.id === this.selectedBomId);
    if (!bom) return;

    this.formData.finishedItemId = bom.finishedItemId;
    this.formData.assembledQty = Number(bom.producedQty) || 1;
    this.formData.additionalLaborCost = Number(bom.estimatedLaborCost) || 0;
    this.formData.additionalOverheadCost = Number(bom.estimatedOverheadCost) || 0;

    // Fetch full BOM details if items are not present
    if (!bom.items || bom.items.length === 0) {
      this.manufacturingService.getBomById(bom.id).subscribe({
        next: (fullBom) => {
          this.populateLinesFromBom(fullBom);
        },
      });
    } else {
      this.populateLinesFromBom(bom);
    }
  }

  populateLinesFromBom(bom: any) {
    const scaleFactor = (Number(this.formData.assembledQty) || 1) / (Number(bom.producedQty) || 1);
    this.lines = (bom.items || []).map((it: any) => {
      const consumedQty = Number(it.consumedQty) * scaleFactor;
      const unitRate = Number(it.unitRate) || 0;
      return {
        itemId: it.itemId,
        variantId: it.variantId || null,
        consumedQty,
        unitRate,
        amount: consumedQty * unitRate,
        notes: it.notes,
      };
    });
  }

  onAssembledQtyChange() {
    if (this.selectedBomId) {
      const bom = this.boms.find((b) => b.id === this.selectedBomId);
      if (bom) {
        this.populateLinesFromBom(bom);
      }
    }
  }

  addComponentLine() {
    this.lines.push({
      itemId: '',
      consumedQty: 1,
      unitRate: 0,
      amount: 0,
    });
  }

  removeComponentLine(idx: number) {
    this.lines.splice(idx, 1);
  }

  onItemSelect(line: ProductionLine) {
    const it = this.items.find((i) => i.id === line.itemId);
    if (it) {
      line.unitRate = Number(it.purchaseRate) || Number(it.saleRate) || 0;
      this.updateLineTotal(line);
    }
  }

  updateLineTotal(line: ProductionLine) {
    const qty = Number(line.consumedQty) || 0;
    const rate = Number(line.unitRate) || 0;
    line.amount = qty * rate;
  }

  recalculateTotals() {
    // updates getter calculation
  }

  saveProductionEntry() {
    if (!this.formData.finishedItemId) {
      this.errorMessage = 'Please select a finished product to produce.';
      return;
    }
    if (!this.formData.assembledQty || Number(this.formData.assembledQty) <= 0) {
      this.errorMessage = 'Quantity to assemble must be greater than zero.';
      return;
    }
    if (!this.formData.sourceGodownId) {
      this.errorMessage = 'Please select a source warehouse for raw material deduction.';
      return;
    }
    if (!this.formData.targetGodownId) {
      this.errorMessage = 'Please select a target warehouse for finished product deposit.';
      return;
    }
    if (this.lines.length === 0 || !this.lines.some((l) => l.itemId)) {
      this.errorMessage = 'Please specify at least one consumed raw material item.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const companyId = this.tenantService.currentCompany()?.id || localStorage.getItem('zeno_company_id');

    const payload = {
      ...this.formData,
      companyId,
      bomId: this.selectedBomId || null,
      items: this.lines.filter((l) => l.itemId),
    };

    this.manufacturingService.createProductionEntry(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.toast.success(
          `Production Assembly Run ${res?.voucherNo || ''} recorded successfully! Produced ${this.formData.assembledQty} units.`,
          'Production Recorded',
        );
        this.backToList();
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Failed to record assembly run';
        this.toast.error(this.errorMessage, 'Recording Failed');
      },
    });
  }

  viewEntryDetails(entry: any) {
    this.manufacturingService.getProductionEntryById(entry.id).subscribe({
      next: (fullEntry) => {
        this.selectedEntry = fullEntry;
        this.viewMode = 'view';
      },
      error: () => {
        this.selectedEntry = entry;
        this.viewMode = 'view';
      },
    });
  }

  reverseEntry(entry: any) {
    if (
      !confirm(
        `Are you sure you want to reverse Assembly Run "${entry.voucherNo}"? This will return all consumed raw materials to stock and remove finished goods from inventory.`,
      )
    ) {
      return;
    }

    this.manufacturingService.cancelProductionEntry(entry.id).subscribe({
      next: () => {
        this.toast.success(`Assembly Run "${entry.voucherNo}" reversed and inventory balanced.`, 'Production Reversed');
        if (this.selectedEntry && this.selectedEntry.id === entry.id) {
          this.backToList();
        }
        this.loadData();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to reverse assembly run';
        this.toast.error(msg, 'Reversal Failed');
        alert(msg);
      },
    });
  }
}
