import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZenoSearchableSelectComponent } from './zeno-searchable-select.component';

@Component({
  selector: 'zeno-item-fast-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent],
  template: `
    <div class="fast-entry-wrapper">
      <div class="fast-entry-grid" [class.has-free]="showFreeQty">
        <!-- ITEM SELECT -->
        <div class="entry-field item-field">
          <label class="entry-label">Item / Product *</label>
          <zeno-searchable-select
            [options]="itemsList"
            labelKey="name"
            valueKey="id"
            secondaryKey="sku"
            placeholder="Search Item (Name or SKU)..."
            [(ngModel)]="newItem.itemId"
            (optionSelected)="onItemSelect($event)"
          ></zeno-searchable-select>
        </div>

        <!-- UNIT -->
        <div class="entry-field unit-field">
          <label class="entry-label">Unit</label>
          <input type="text" class="entry-input readonly-input" [value]="getUnitDisplay()" readonly />
        </div>

        <!-- QTY -->
        <div class="entry-field qty-field">
          <label class="entry-label">Qty *</label>
          <input
            type="number"
            min="1"
            class="entry-input"
            [(ngModel)]="newItem.qty"
            (keydown.enter)="addItem()"
          />
        </div>

        <!-- RATE -->
        <div class="entry-field rate-field">
          <label class="entry-label">Rate (₹) *</label>
          <input
            type="number"
            step="any"
            class="entry-input"
            [(ngModel)]="newItem.rate"
            (keydown.enter)="addItem()"
          />
        </div>

        <!-- DISCOUNT -->
        @if (showDiscount) {
          <div class="entry-field discount-field">
            <label class="entry-label">Disc (₹)</label>
            <input
              type="number"
              step="any"
              class="entry-input"
              [(ngModel)]="newItem.discount"
              (keydown.enter)="addItem()"
            />
          </div>
        }

        <!-- FREE QTY (IF APPLICABLE) -->
        @if (showFreeQty) {
          <div class="entry-field free-field">
            <label class="entry-label">Free Qty</label>
            <input
              type="number"
              min="0"
              class="entry-input"
              [(ngModel)]="newItem.freeQty"
              (keydown.enter)="addItem()"
            />
          </div>
        }

        <!-- GST % -->
        @if (showGst) {
          <div class="entry-field gst-field">
            <label class="entry-label">GST %</label>
            <select class="entry-input select-input" [(ngModel)]="newItem.gstRate">
              <option [value]="0">0%</option>
              <option [value]="5">5%</option>
              <option [value]="12">12%</option>
              <option [value]="18">18%</option>
              <option [value]="28">28%</option>
            </select>
          </div>
        }

        <!-- AMOUNT PREVIEW -->
        <div class="entry-field amount-field">
          <label class="entry-label">Amount (₹)</label>
          <div class="amount-display">
            ₹{{ getCalculatedAmount() | number:'1.2-2' }}
          </div>
        </div>

        <!-- ADD / UPDATE BUTTON -->
        <div class="entry-field action-field" style="display: flex; gap: 6px;">
          <button
            type="button"
            class="btn-add-item"
            [class.btn-update-item]="editIndex !== null"
            [disabled]="!newItem.itemId || newItem.qty <= 0"
            (click)="addItem()"
          >
            @if (editIndex !== null) {
              <i class="pi pi-check"></i> Update
            } @else {
              <i class="pi pi-plus"></i> Add Item
            }
          </button>
          @if (editIndex !== null) {
            <button
              type="button"
              class="btn-cancel-edit"
              (click)="cancelEdit()"
              title="Cancel editing"
            >
              <i class="pi pi-times"></i>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './zeno-item-fast-entry.component.scss'
})
export class ZenoItemFastEntryComponent {
  @Input() itemsList: any[] = [];
  @Input() showFreeQty = false;
  @Input() showDiscount = true;
  @Input() showGst = true;
  @Input() isPurchase = false;

  @Input() set editData(data: { item: any, index: number } | null) {
    if (data && data.item) {
      this.editIndex = data.index;
      const it = data.item;
      const uVal = it.unit || it.unitCode;
      const uStr = typeof uVal === 'object' ? (uVal.code || uVal.name || 'PCS') : (uVal || 'PCS');
      this.newItem = {
        itemId: it.itemId || '',
        itemName: it.itemName || '',
        unit: uStr,
        qty: it.billedQty || it.orderedQty || it.dispatchedQty || it.receivedQty || it.returnedQty || 1,
        rate: it.unitPrice || it.rate || 0,
        discount: it.discountAmount || it.discount || 0,
        freeQty: it.freeQty || 0,
        gstRate: it.taxRate !== undefined ? it.taxRate : (it.gstRate !== undefined ? it.gstRate : 18),
        selectedItemObj: this.itemsList.find(i => i.id === it.itemId) || null
      };
    } else {
      this.editIndex = null;
    }
  }

  @Output() itemAdded = new EventEmitter<any>();
  @Output() itemUpdated = new EventEmitter<any>();

  editIndex: number | null = null;

  newItem: any = {
    itemId: '',
    itemName: '',
    unit: 'PCS',
    qty: 1,
    rate: 0,
    discount: 0,
    freeQty: 0,
    gstRate: 18,
    selectedItemObj: null
  };

  getUnitDisplay(): string {
    const val = this.newItem.unit;
    if (!val) return 'PCS';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.code || val.name || val.unitCode || 'PCS';
    return String(val);
  }

  onItemSelect(opt: any): void {
    if (!opt) {
      this.newItem.selectedItemObj = null;
      this.newItem.itemName = '';
      this.newItem.unit = 'PCS';
      this.newItem.rate = 0;
      this.newItem.gstRate = 18;
      return;
    }
    this.newItem.selectedItemObj = opt;
    this.newItem.itemName = opt.name || opt.itemName || '';
    const uVal = opt.primaryUnit || opt.unitCode || opt.unit;
    this.newItem.unit = typeof uVal === 'object' ? (uVal.code || uVal.name || 'PCS') : (uVal || 'PCS');
    const pRate = opt.purchaseRate ?? opt.purchasePrice ?? opt.rate ?? 0;
    const sRate = opt.salesRate ?? opt.salePrice ?? opt.rate ?? 0;
    this.newItem.rate = Number(this.isPurchase ? (pRate || sRate) : (sRate || pRate));
    this.newItem.gstRate = opt.gstRate !== undefined ? Number(opt.gstRate) : (opt.gstPercent !== undefined ? Number(opt.gstPercent) : 18);
  }

  getCalculatedAmount(): number {
    const qty = Math.max(0, Number(this.newItem.qty) || 0);
    const rate = Math.max(0, Number(this.newItem.rate) || 0);
    const disc = Math.max(0, Number(this.newItem.discount) || 0);
    return Math.max(0, (qty * rate) - disc);
  }

  addItem(): void {
    if (!this.newItem.itemId || this.newItem.qty <= 0) return;

    const payload = {
      index: this.editIndex,
      itemId: this.newItem.itemId,
      itemName: this.newItem.itemName || (this.newItem.selectedItemObj ? this.newItem.selectedItemObj.name : ''),
      itemObj: this.newItem.selectedItemObj,
      unit: this.newItem.unit,
      qty: Number(this.newItem.qty) || 1,
      rate: Number(this.newItem.rate) || 0,
      discount: Number(this.newItem.discount) || 0,
      freeQty: Number(this.newItem.freeQty) || 0,
      gstRate: Number(this.newItem.gstRate) || 0,
      amount: this.getCalculatedAmount()
    };

    if (this.editIndex !== null) {
      this.itemUpdated.emit(payload);
    } else {
      this.itemAdded.emit(payload);
    }

    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editIndex = null;
    this.newItem = {
      itemId: '',
      itemName: '',
      unit: 'PCS',
      qty: 1,
      rate: 0,
      discount: 0,
      freeQty: 0,
      gstRate: 18,
      selectedItemObj: null
    };
  }
}
