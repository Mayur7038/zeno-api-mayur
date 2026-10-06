import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../../core/services/sales.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MastersService } from '../../../core/services/masters.service';

@Component({
  selector: 'app-sales-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sales-page">
      @if (viewMode === 'list') {
        <!-- HEADER -->
        <div class="page-header">
          <h1>Sales Invoices</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreateModal()">
              <i class="pi pi-plus"></i> Create Sales Invoice
            </button>
          </div>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class="pi pi-file-o"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Invoiced</span>
              <span class="kpi-value">{{ invoices.length }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class="pi pi-check"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Paid Invoices</span>
              <span class="kpi-value">{{ paidCount }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon orange"><i class="pi pi-exclamation-circle"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Unpaid Receivable</span>
              <span class="kpi-value">₹{{ totalReceivables | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class="pi pi-dollar"></i></div>
            <div class="kpi-info">
              <span class="kpi-label">Total Sales Volume</span>
              <span class="kpi-value">₹{{ totalSalesValue | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- FILTER & TOOLBAR -->
        <div class="zeno-card">
          <div class="filter-card">
            <div class="filter-group">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                placeholder="Search by invoice #, customer..."
                [(ngModel)]="searchQuery"
                (input)="loadInvoices()"
              />
            </div>

            <div class="status-tabs">
              <button [class.active]="selectedStatus === ''" (click)="filterStatus('')">All</button>
              <button [class.active]="selectedStatus === 'PENDING'" (click)="filterStatus('PENDING')">Unpaid</button>
              <button [class.active]="selectedStatus === 'PARTIALLY_PAID'" (click)="filterStatus('PARTIALLY_PAID')">Partially Paid</button>
              <button [class.active]="selectedStatus === 'PAID'" (click)="filterStatus('PAID')">Fully Paid</button>
            </div>
          </div>

          <!-- INVOICES TABLE -->
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Taxable</th>
                <th>GST</th>
                <th>Grand Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    <i class="pi pi-spin pi-spinner"></i> Loading tax invoices...
                  </td>
                </tr>
              } @else if (invoices.length === 0) {
                <tr>
                  <td colspan="9" class="text-center" style="padding: 40px; color: var(--surface-500)">
                    No sales invoices found. Create a bill directly or convert from delivery challan.
                  </td>
                </tr>
              } @else {
                @for (inv of invoices; track inv.id) {
                  <tr (click)="viewInvoice(inv.id)" style="cursor: pointer;">
                    <td class="font-bold" style="color: var(--primary-700)">{{ inv.voucherNo }}</td>
                    <td>{{ inv.invoiceDate }}</td>
                    <td>
                      <div class="font-bold">{{ inv.customerLedger?.name }}</div>
                      <div style="font-size: 0.75rem; color: var(--surface-500)">{{ inv.customerLedger?.gstin || 'Unregistered' }}</div>
                    </td>
                    <td>₹{{ inv.taxableTotal | number:'1.2-2' }}</td>
                    <td>₹{{ (Number(inv.cgstTotal || 0) + Number(inv.sgstTotal || 0) + Number(inv.igstTotal || 0)) | number:'1.2-2' }}</td>
                    <td class="font-bold">₹{{ inv.grandTotal | number:'1.2-2' }}</td>
                    <td class="font-bold text-danger">
                      ₹{{ (inv.grandTotal - (inv.paidAmount || 0)) | number:'1.2-2' }}
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(inv.status)">{{ formatStatus(inv.status) }}</span>
                    </td>
                    <td class="text-right" (click)="$event.stopPropagation()">
                      <button class="btn-icon" title="View Tax Invoice" (click)="viewInvoice(inv.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                      @if (inv.status !== 'PAID') {
                        <button class="btn-icon text-success" title="Record Receipt" (click)="recordPayment(inv)">
                          <i class="pi pi-wallet"></i>
                        </button>
                      }
                      <button class="btn-icon text-orange" title="Issue Credit Note (Sales Return)" (click)="createReturn(inv)">
                        <i class="pi pi-replay"></i>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- CREATE SALES INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Create Sales Tax Invoice</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitInvoice()" [disabled]="submitting || !isValidInvoice()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Ledger Entries...
              } @else {
                <i class="pi pi-check"></i> Post Tax Invoice
              }
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="form-grid">
            <div class="form-group">
              <label class="required">Customer / Debtor</label>
              <select [(ngModel)]="newInv.customerLedgerId" (change)="onCustomerSelected()">
                <option value="">Select Customer...</option>
                @for (cust of customers; track cust.id) {
                  <option [value]="cust.id">{{ cust.name }} ({{ cust.gstin || 'Unregistered' }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">Invoice Date</label>
              <input type="date" [(ngModel)]="newInv.invoiceDate" />
            </div>

            <div class="form-group">
              <label>Payment Due Date</label>
              <input type="date" [(ngModel)]="newInv.paymentDueDate" />
            </div>

            <div class="form-group">
              <label>Place of Supply State</label>
              <input type="text" [(ngModel)]="newInv.placeOfSupplyStateCode" placeholder="27 (Maharashtra)" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 14px;">
            <div class="form-group">
              <label>Customer Billing Address</label>
              <input type="text" [(ngModel)]="newInv.billingAddress" placeholder="Registered premises address" />
            </div>
            <div class="form-group">
              <label>Shipping / Consignee Address</label>
              <input type="text" [(ngModel)]="newInv.shippingAddress" placeholder="Delivery destination address" />
            </div>
          </div>

          <!-- PULL PENDING CHALLANS TRIGGER -->
          @if (newInv.customerLedgerId) {
            <div class="pull-orders-box">
              <div class="pull-orders-info">
                <i class="pi pi-truck"></i>
                <span>Pull unbilled delivery challans for this customer</span>
              </div>
              <button class="btn-sm btn-outline" type="button" (click)="pullPendingChallans()" [disabled]="loadingPendingChallans">
                @if (loadingPendingChallans) {
                  <i class="pi pi-spin pi-spinner"></i> Loading...
                } @else {
                  <i class="pi pi-download"></i> Load Unbilled Challans
                }
              </button>
            </div>
          }

          <!-- ITEMS SECTION -->
          <div class="items-section">
            <div class="section-title-row">
              <h3>Billed Line Items</h3>
              <button class="btn-sm btn-outline" type="button" (click)="addItemRow()">
                <i class="pi pi-plus"></i> Add Item Line
              </button>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 32%">Product / Item</th>
                  <th style="width: 12%">Billed Qty</th>
                  <th style="width: 15%">Unit Rate (₹)</th>
                  <th style="width: 13%">Discount (₹)</th>
                  <th style="width: 10%">GST Rate</th>
                  <th style="width: 14%">Taxable Line</th>
                  <th style="width: 4%"></th>
                </tr>
              </thead>
              <tbody>
                @for (row of newInv.items; track $index; let i = $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="row.itemId" (change)="onItemSelect(i)">
                        <option value="">Select Item...</option>
                        @for (it of itemsList; track it.id) {
                          <option [value]="it.id">{{ it.name }} ({{ it.sku || 'N/A' }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        [(ngModel)]="row.billedQty"
                        (input)="recalculateTotals()"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        [(ngModel)]="row.unitPrice"
                        (input)="recalculateTotals()"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        [(ngModel)]="row.discountAmount"
                        (input)="recalculateTotals()"
                      />
                    </td>
                    <td>
                      <select [(ngModel)]="row.taxRate" (change)="recalculateTotals()">
                        <option [value]="0">0%</option>
                        <option [value]="5">5%</option>
                        <option [value]="12">12%</option>
                        <option [value]="18">18%</option>
                        <option [value]="28">28%</option>
                      </select>
                    </td>
                    <td class="font-bold">
                      ₹{{ (Math.max(0, (row.billedQty * row.unitPrice) - row.discountAmount)) | number:'1.2-2' }}
                    </td>
                    <td class="text-right">
                      @if (newInv.items.length > 1) {
                        <button class="btn-icon text-danger" (click)="removeItemRow(i)">
                          <i class="pi pi-trash"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- SUMMARY & TOTALS -->
          <div class="totals-summary-card">
            <div class="summary-line">
              <span>Taxable Subtotal:</span>
              <strong>₹{{ modalTotals.taxableSubtotal | number:'1.2-2' }}</strong>
            </div>
            @if (modalTotals.igstTotal > 0) {
              <div class="summary-line">
                <span>Integrated GST (IGST):</span>
                <span>₹{{ modalTotals.igstTotal | number:'1.2-2' }}</span>
              </div>
            } @else {
              <div class="summary-line">
                <span>Central GST (CGST):</span>
                <span>₹{{ modalTotals.cgstTotal | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line">
                <span>State GST (SGST):</span>
                <span>₹{{ modalTotals.sgstTotal | number:'1.2-2' }}</span>
              </div>
            }
            <div class="summary-line">
              <span>Round Off:</span>
              <span>₹{{ modalTotals.roundOff | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total">
              <span>Grand Total:</span>
              <strong>₹{{ modalTotals.grandTotal | number:'1.2-2' }}</strong>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button class="btn-primary" (click)="submitInvoice()" [disabled]="submitting || !isValidInvoice()">
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting Ledger Entries...
              } @else {
                <i class="pi pi-check"></i> Post Tax Invoice
              }
            </button>
          </div>
        </div>
      } @else if (viewMode === 'view' && selectedInvoice) {
        <!-- VIEW SALES INVOICE FULL PAGE VIEW -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>Tax Invoice #{{ selectedInvoice.voucherNo }}</h1>
            <span class="badge" [ngClass]="getStatusBadge(selectedInvoice.status)">
              {{ formatStatus(selectedInvoice.status) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Back to List</button>
            <button class="btn-primary" (click)="printInvoice()">
              <i class="pi pi-print"></i> Print Tax Invoice
            </button>
          </div>
        </div>

        <div class="zeno-card form-page-card">
          <div class="detail-card-grid">
            <div class="info-block">
              <span class="label">Billed To Customer</span>
              <strong>{{ selectedInvoice.customerLedger?.name }}</strong>
              <p>{{ selectedInvoice.customerLedger?.gstin ? 'GSTIN: ' + selectedInvoice.customerLedger?.gstin : 'Unregistered Consumer' }}</p>
              <p>{{ selectedInvoice.billingAddress }}</p>
            </div>
            <div class="info-block">
              <span class="label">Tax Place of Supply</span>
              <p>State Code: {{ selectedInvoice.placeOfSupplyStateCode || '27' }}</p>
              <p>{{ selectedInvoice.isInterstate ? 'Inter-State Transaction (IGST)' : 'Intra-State Transaction (CGST + SGST)' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Invoice Metadata</span>
              <p><strong>Invoice Date:</strong> {{ selectedInvoice.invoiceDate }}</p>
              <p><strong>Due Date:</strong> {{ selectedInvoice.paymentDueDate || 'Immediate' }}</p>
            </div>
            <div class="info-block">
              <span class="label">Dispatch Details</span>
              <p>{{ selectedInvoice.shippingAddress || 'Consignee Address' }}</p>
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: var(--surface-700)">Itemized Goods &amp; Services</h4>
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Item &amp; HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Taxable</th>
                <th>GST</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of selectedInvoice.items; track item.id) {
                <tr>
                  <td>
                    <strong>{{ item.item?.name }}</strong>
                    <div style="font-size: 0.72rem; color: var(--surface-500)">HSN/SAC: {{ item.item?.hsnSac || '8517' }}</div>
                  </td>
                  <td>{{ item.billedQty }} {{ item.unit?.code || 'NOS' }}</td>
                  <td>₹{{ item.rate | number:'1.2-2' }}</td>
                  <td>₹{{ item.taxableAmount | number:'1.2-2' }}</td>
                  <td>
                    @if (item.igstAmount > 0) {
                      <span>IGST: ₹{{ item.igstAmount | number:'1.2-2' }} ({{ item.gstRate }}%)</span>
                    } @else {
                      <span>CGST: ₹{{ item.cgstAmount | number:'1.2-2' }} + SGST: ₹{{ item.sgstAmount | number:'1.2-2' }}</span>
                    }
                  </td>
                  <td class="text-right font-bold">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="totals-summary-card" style="margin-top: 20px;">
            <div class="summary-line">
              <span>Taxable Value:</span>
              <strong>₹{{ selectedInvoice.taxableTotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line">
              <span>CGST:</span>
              <span>₹{{ selectedInvoice.cgstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>SGST:</span>
              <span>₹{{ selectedInvoice.sgstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>IGST:</span>
              <span>₹{{ selectedInvoice.igstTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line">
              <span>Round Off:</span>
              <span>₹{{ selectedInvoice.roundOffTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line grand-total">
              <span>Grand Total:</span>
              <strong>₹{{ selectedInvoice.grandTotal | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-line text-success font-bold">
              <span>Amount Paid:</span>
              <span>₹{{ (selectedInvoice.paidAmount || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="summary-line text-danger font-bold">
              <span>Balance Due:</span>
              <span>₹{{ (selectedInvoice.grandTotal - (selectedInvoice.paidAmount || 0)) | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h1 { font-size: 1.25rem; font-weight: 700; color: var(--surface-900); margin: 0; }
      .header-actions { display: flex; gap: 10px; }
    }
    .header-back-title { display: flex; align-items: center; gap: 12px; }
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
      &:hover { background: var(--surface-200); color: var(--surface-900); }
    }
    .form-page-card { padding: 24px; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.orange { background: #FFF7ED; color: #EA580C; }
    .kpi-icon.green { background: #F0FDF4; color: #16A34A; }
    .kpi-icon.purple { background: #FAF5FF; color: #9333EA; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; color: var(--surface-500); font-weight: 500; text-transform: uppercase; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--surface-900); }

    .zeno-card { background: #fff; border: 1px solid var(--surface-200); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
    .filter-card { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .filter-group { position: relative; width: 320px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--surface-400); }
    .filter-group input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .status-tabs { display: flex; gap: 6px; background: var(--surface-100); padding: 4px; border-radius: 8px; }
    .status-tabs button { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; color: var(--surface-600); cursor: pointer; transition: all 0.2s; }
    .status-tabs button.active { background: #fff; color: var(--primary-700); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
    .badge-pending { background: #FEF3C7; color: #D97706; }
    .badge-partially-paid { background: #E0E7FF; color: #4338CA; }
    .badge-paid { background: #DCFCE7; color: #15803D; }

    .btn-icon { background: transparent; border: none; color: var(--surface-500); width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--surface-100); color: var(--surface-800); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary-600); color: var(--primary-600); font-weight: 600; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--surface-700); }
    .form-group label.required::after { content: ' *'; color: #EF4444; }
    .form-group select, .form-group input { padding: 8px 12px; border: 1px solid var(--surface-300); border-radius: 8px; font-size: 0.875rem; }

    .pull-orders-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .pull-orders-info { display: flex; align-items: center; gap: 8px; color: #1E40AF; font-size: 0.85rem; }

    .items-section { margin-top: 16px; }
    .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--surface-200); border-radius: 8px; overflow: hidden; }
    .items-table th { background: var(--surface-100); padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: var(--surface-600); }
    .items-table td { padding: 8px 10px; border-bottom: 1px solid var(--surface-200); }
    .items-table select, .items-table input { width: 100%; padding: 6px 8px; border: 1px solid var(--surface-300); border-radius: 6px; font-size: 0.85rem; }

    .totals-summary-card { background: var(--surface-50); border: 1px solid var(--surface-200); border-radius: 8px; padding: 16px; width: 340px; margin-left: auto; margin-top: 16px; }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 8px; color: var(--surface-700); }
    .summary-line.grand-total { border-top: 2px solid var(--surface-300); padding-top: 10px; font-size: 1.1rem; color: var(--primary-700); }

    .detail-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .info-block { background: var(--surface-50); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-200); }
    .info-block .label { font-size: 0.72rem; text-transform: uppercase; color: var(--surface-500); font-weight: 600; display: block; margin-bottom: 4px; }
    .text-success { color: #16A34A; }
    .text-orange { color: #EA580C; }
    .text-danger { color: #DC2626; }
  `]
})
export class SalesInvoicesComponent implements OnInit {
  viewMode: 'list' | 'create' | 'view' = 'list';
  invoices: any[] = [];
  customers: any[] = [];
  itemsList: any[] = [];
  loading = false;
  submitting = false;
  loadingPendingChallans = false;

  searchQuery = '';
  selectedStatus = '';
  selectedInvoice: any = null;

  Number = Number;
  Math = Math;

  newInv: any = {
    customerLedgerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentDueDate: '',
    placeOfSupplyStateCode: '27',
    billingAddress: '',
    shippingAddress: '',
    dcIds: [] as string[],
    items: [
      { itemId: '', billedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18, isInterstate: false }
    ]
  };

  modalTotals = {
    taxableSubtotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 0
  };

  constructor(
    private salesService: SalesService,
    private tenantService: TenantService,
    private mastersService: MastersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.loadMasters();
  }

  get companyId(): string {
    return this.tenantService.currentCompany()?.id || '';
  }

  get branchId(): string {
    return this.tenantService.currentBranch()?.id || '';
  }

  get paidCount(): number {
    return this.invoices.filter(i => i.status === 'PAID').length;
  }

  get totalSalesValue(): number {
    return this.invoices.reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
  }

  get totalReceivables(): number {
    return this.invoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + (Number(i.grandTotal || 0) - Number(i.paidAmount || 0)), 0);
  }

  loadInvoices() {
    if (!this.companyId) return;
    this.loading = true;
    this.salesService.getSalesInvoices(this.companyId, this.selectedStatus, this.searchQuery).subscribe({
      next: (res) => {
        this.invoices = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMasters() {
    if (!this.companyId) return;
    this.mastersService.getLedgers(this.companyId, false, true).subscribe((data) => {
      this.customers = data || [];
    });
    this.mastersService.getItems(this.companyId).subscribe((data) => {
      this.itemsList = data || [];
    });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.loadInvoices();
  }

  openCreateModal() {
    this.newInv = {
      customerLedgerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentDueDate: '',
      placeOfSupplyStateCode: this.tenantService.currentCompany()?.stateCode || '27',
      billingAddress: '',
      shippingAddress: '',
      dcIds: [],
      items: [
        { itemId: '', billedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18, isInterstate: false }
      ]
    };
    this.recalculateTotals();
    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedInvoice = null;
    this.loadInvoices();
  }

  onCustomerSelected() {
    const cust = this.customers.find(c => c.id === this.newInv.customerLedgerId);
    if (cust) {
      this.newInv.billingAddress = cust.addressLine1 || '';
      this.newInv.shippingAddress = cust.addressLine1 || '';
      this.newInv.placeOfSupplyStateCode = cust.stateCode || '27';
      const compState = this.tenantService.currentCompany()?.stateCode || '27';
      const isInter = compState !== (cust.stateCode || '27');
      this.newInv.items.forEach((it: any) => it.isInterstate = isInter);
      this.recalculateTotals();
    }
  }

  addItemRow() {
    const compState = this.tenantService.currentCompany()?.stateCode || '27';
    const isInter = compState !== (this.newInv.placeOfSupplyStateCode || '27');
    this.newInv.items.push({
      itemId: '',
      billedQty: 1,
      unitPrice: 0,
      discountAmount: 0,
      taxRate: 18,
      isInterstate: isInter
    });
  }

  removeItemRow(index: number) {
    this.newInv.items.splice(index, 1);
    this.recalculateTotals();
  }

  onItemSelect(index: number) {
    const row = this.newInv.items[index];
    const item = this.itemsList.find(i => i.id === row.itemId);
    if (item) {
      row.unitPrice = Number(item.salesPrice || item.purchasePrice || 0);
      row.taxRate = Number(item.taxRate || 18);
      this.recalculateTotals();
    }
  }

  pullPendingChallans() {
    if (!this.newInv.customerLedgerId) return;
    this.loadingPendingChallans = true;
    this.salesService.getCustomerPendingChallans(this.newInv.customerLedgerId, this.companyId).subscribe({
      next: (challans) => {
        this.loadingPendingChallans = false;
        if (!challans || challans.length === 0) {
          alert('No unbilled delivery challans found for this customer.');
          return;
        }

        const lines: any[] = [];
        const dcIds: string[] = [];

        for (const dc of challans) {
          dcIds.push(dc.id);
          for (const item of dc.items || []) {
            const pendingQty = Number(item.dispatchedQty || 0) - Number(item.invoicedQty || 0);
            if (pendingQty > 0) {
              lines.push({
                itemId: item.itemId,
                billedQty: pendingQty,
                unitPrice: Number(item.rate || 0),
                discountAmount: Number(item.discountAmount || 0),
                taxRate: Number(item.gstRate || 18),
                isInterstate: false,
                dcItemId: item.id
              });
            }
          }
        }

        if (lines.length > 0) {
          this.newInv.items = lines;
          this.newInv.dcIds = dcIds;
          this.recalculateTotals();
        } else {
          alert('All items in dispatched challans have already been billed.');
        }
      },
      error: () => {
        this.loadingPendingChallans = false;
      }
    });
  }

  recalculateTotals() {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const r of this.newInv.items) {
      const qty = Number(r.billedQty || 0);
      const rate = Number(r.unitPrice || 0);
      const disc = Number(r.discountAmount || 0);
      const taxable = Math.max(0, qty * rate - disc);
      const taxRate = Number(r.taxRate || 0);

      subtotal += taxable;
      if (r.isInterstate) {
        igst += (taxable * taxRate) / 100;
      } else {
        cgst += (taxable * (taxRate / 2)) / 100;
        sgst += (taxable * (taxRate / 2)) / 100;
      }
    }

    const unrounded = subtotal + cgst + sgst + igst;
    const rounded = Math.round(unrounded);
    const roundOff = rounded - unrounded;

    this.modalTotals = {
      taxableSubtotal: subtotal,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      roundOff: roundOff,
      grandTotal: rounded
    };
  }

  isValidInvoice(): boolean {
    return (
      !!this.newInv.customerLedgerId &&
      this.newInv.items.length > 0 &&
      this.newInv.items.every((i: any) => !!i.itemId && Number(i.billedQty) > 0)
    );
  }

  submitInvoice() {
    if (!this.isValidInvoice()) return;
    this.submitting = true;
    const payload = {
      companyId: this.companyId,
      branchId: this.branchId,
      ...this.newInv
    };

    this.salesService.createSalesInvoice(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.viewMode = 'list';
        this.loadInvoices();
      },
      error: (err) => {
        this.submitting = false;
        alert(err?.error?.message || 'Failed to create sales invoice');
      }
    });
  }

  viewInvoice(id: string) {
    this.salesService.getSalesInvoiceById(id).subscribe({
      next: (inv) => {
        this.selectedInvoice = inv;
        this.viewMode = 'view';
      }
    });
  }

  recordPayment(inv: any) {
    this.router.navigate(['/sales/customer-receipts'], {
      queryParams: { invoiceId: inv.id, customerId: inv.customerLedgerId }
    });
  }

  createReturn(inv: any) {
    this.router.navigate(['/sales/sales-returns'], {
      queryParams: { invoiceId: inv.id, customerId: inv.customerLedgerId }
    });
  }

  printInvoice() {
    window.print();
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIALLY_PAID': return 'badge-partially-paid';
      case 'PAID': return 'badge-paid';
      default: return '';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || '';
  }
}
