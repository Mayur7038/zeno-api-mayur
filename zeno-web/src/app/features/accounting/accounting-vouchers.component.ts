import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccountingService,
  AccountingVoucher,
} from '../../core/services/accounting.service';
import { TenantService } from '../../core/services/tenant.service';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../core/services/toast.service';
import { exportToCsv } from '../../core/utils/export.util';
import { ZenoSearchableSelectComponent } from '../../shared/ui/zeno-searchable-select.component';

interface JournalLine {
  type: 'DR' | 'CR';
  ledgerId: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

interface StandardLine {
  ledgerId: string;
  amount: number;
  narration?: string;
}

@Component({
  selector: 'app-accounting-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, ZenoSearchableSelectComponent],
  template: `
    <div class="accounting-page">
      @if (viewMode === 'list') {
        <!-- LIST PAGE HEADER -->
        <div class="page-header">
          <h1>{{ config.listTitle }}</h1>
          <div class="header-actions">
            <button class="btn-primary" (click)="openCreate()">
              <i class="pi pi-plus"></i> {{ config.createButtonText }}
            </button>
          </div>
        </div>
        
        <!-- FILTER CARD -->
        <div class="zeno-card filter-card">
          <div class="filter-group">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="loadVouchers()"
            />
          </div>

          <div class="date-filters">
            <div class="date-input-group">
              <span class="date-label">From:</span>
              <input type="date" [(ngModel)]="startDate" (change)="loadVouchers()" />
            </div>
            <div class="date-input-group">
              <span class="date-label">To:</span>
              <input type="date" [(ngModel)]="endDate" (change)="loadVouchers()" />
            </div>
          </div>

          <div class="filter-actions">
            <select
              class="filter-select"
              [(ngModel)]="selectedStatus"
              (change)="filterStatus(selectedStatus)"
            >
              <option value="">All Statuses</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button class="btn-export" (click)="exportVouchers()" [disabled]="filteredVouchers.length === 0" title="Export to CSV">
              <i class="pi pi-download"></i> Export
            </button>
          </div>
        </div>

        <!-- TABLE CARD -->
        <div class="zeno-card">
          <table class="zeno-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>{{ config.primaryAccountColumn }}</th>
                <th>Mode / Ref</th>
                <th>Remarks / Narration</th>
                <th class="text-right">Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredVouchers.length === 0) {
                <tr>
                  <td colspan="8" class="text-center" style="padding: 42px; color: var(--surface-500);">
                    No {{ config.listTitle.toLowerCase() }} found. Click "{{ config.createButtonText }}" to record one.
                  </td>
                </tr>
              }
              @for (v of filteredVouchers; track v.id) {
                <tr>
                  <td class="font-mono font-bold" style="color: var(--primary-700)">
                    {{ v.voucherNo }}
                  </td>
                  <td>{{ v.voucherDate }}</td>
                  <td>
                    <div class="account-cell">
                      <span class="font-bold">{{ getVoucherPrimaryAccountName(v) }}</span>
                      @if (v.lines && v.lines.length) {
                        <span class="sub-text">{{ getVoucherSecondaryAccountsSummary(v) }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="mode-badge">{{ v.paymentMode || 'CASH' }}</span>
                    @if (v.referenceNo) {
                      <div class="ref-sub-text">Ref: {{ v.referenceNo }}</div>
                    }
                  </td>
                  <td class="narration-cell" [title]="v.narration || ''">
                    {{ v.narration || '—' }}
                  </td>
                  <td class="font-mono font-bold text-right" style="font-size: 0.95rem;">
                    ₹{{ v.totalAmount | number:'1.2-2' }}
                  </td>
                  <td>
                    <span
                      class="badge-pill"
                      [ngClass]="{
                        'badge-cleared': v.status === 'POSTED',
                        'badge-cancelled': v.status === 'CANCELLED'
                      }"
                    >
                      {{ v.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="action-btn" title="View & Print Voucher" (click)="viewVoucher(v.id)">
                        <i class="pi pi-eye"></i>
                      </button>
                      @if (v.status === 'POSTED') {
                        <button class="action-btn danger" title="Cancel & Reverse Voucher" (click)="promptCancelVoucher(v)">
                          <i class="pi pi-ban"></i>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (viewMode === 'create') {
        <!-- FULL-PAGE TRANSACTION CREATION -->
        <div class="page-header">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>{{ config.createTitle }}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="backToList()">Cancel</button>
            <button
              class="btn-primary"
              (click)="submitVoucher()"
              [disabled]="submitting || !isFormValid()"
            >
              @if (submitting) {
                <i class="pi pi-spin pi-spinner"></i> Posting...
              } @else {
                <i class="pi pi-check"></i> Save & Post Voucher
              }
            </button>
          </div>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <div class="zeno-card padded-card form-container">
          <!-- VOUCHER HEADER FIELDS -->
          <div class="form-grid-4">
            <div class="form-group">
              <label>Voucher Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="createForm.voucherDate" />
            </div>

            @if (voucherType !== 'JOURNAL') {
              <div class="form-group">
                <label>{{ config.primaryAccountLabel }} <span class="required">*</span></label>
                <zeno-searchable-select
                  [options]="getAvailablePrimaryLedgers()"
                  labelKey="name"
                  valueKey="id"
                  placeholder="-- Choose Account --"
                  [(ngModel)]="createForm.sourceAccountLedgerId"
                ></zeno-searchable-select>
              </div>
            }

            @if (voucherType === 'CONTRA') {
              <div class="form-group">
                <label>Transfer To (Destination Bank / Cash) <span class="required">*</span></label>
                <zeno-searchable-select
                  [options]="cashBankLedgers"
                  labelKey="name"
                  valueKey="id"
                  placeholder="-- Choose Destination Account --"
                  [(ngModel)]="createForm.destinationLedgerId"
                ></zeno-searchable-select>
              </div>
            }

            @if (voucherType === 'PAYMENT' || voucherType === 'RECEIPT' || voucherType === 'CONTRA') {
              <div class="form-group">
                <label>Payment Mode</label>
                <select [(ngModel)]="createForm.paymentMode">
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="NEFT_RTGS">NEFT / RTGS</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            }

            <div class="form-group">
              <label>{{ config.refLabel }}</label>
              <input
                type="text"
                [(ngModel)]="createForm.referenceNo"
              />
            </div>

            <div class="form-group">
              <label>Reference Date</label>
              <input type="date" [(ngModel)]="createForm.referenceDate" />
            </div>
          </div>

          <!-- CONTRA SINGLE AMOUNT -->
          @if (voucherType === 'CONTRA') {
            <div class="contra-amount-box">
              <div class="form-group" style="max-width: 320px;">
                <label>Transfer Amount (₹) <span class="required">*</span></label>
                <div class="currency-input-wrap">
                  <span class="currency-symbol">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    [(ngModel)]="contraAmount"
                    class="font-mono font-bold"
                    style="font-size: 1.1rem;"
                  />
                </div>
              </div>
            </div>
          }

          <!-- JOURNAL MULTI-LINE DR/CR GRID -->
          @if (voucherType === 'JOURNAL') {
            <div class="line-items-section">
              <div class="section-header-flex">
                <span class="section-title">Journal Debit & Credit Entries</span>
                <span class="section-help">Every journal must have balanced Debits and Credits.</span>
              </div>

              <table class="line-table">
                <thead>
                  <tr>
                    <th style="width: 110px;">By / To</th>
                    <th>Account Ledger</th>
                    <th style="width: 160px;" class="text-right">Debit (Dr) ₹</th>
                    <th style="width: 160px;" class="text-right">Credit (Cr) ₹</th>
                    <th>Particulars / Narration</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (jLine of journalLines; track $index) {
                    <tr>
                      <td>
                        <select [(ngModel)]="jLine.type" (change)="onJournalTypeChange(jLine)">
                          <option value="DR">By (Dr)</option>
                          <option value="CR">To (Cr)</option>
                        </select>
                      </td>
                      <td>
                        <zeno-searchable-select
                          [options]="allLedgers"
                          labelKey="name"
                          valueKey="id"
                          placeholder="-- Select Ledger Account --"
                          [(ngModel)]="jLine.ledgerId"
                        ></zeno-searchable-select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          [(ngModel)]="jLine.debitAmount"
                          [disabled]="jLine.type === 'CR'"
                          class="text-right font-mono"
                          (input)="onJournalAmountChange(jLine, 'DR')"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          [(ngModel)]="jLine.creditAmount"
                          [disabled]="jLine.type === 'DR'"
                          class="text-right font-mono"
                          (input)="onJournalAmountChange(jLine, 'CR')"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          [(ngModel)]="jLine.narration"
                        />
                      </td>
                      <td class="text-center">
                        @if (journalLines.length > 2) {
                          <button class="remove-line-btn" (click)="removeJournalLine($index)">
                            <i class="pi pi-trash"></i>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="line-actions-flex">
                <button type="button" class="btn-secondary add-line-btn" (click)="addJournalLine()">
                  <i class="pi pi-plus"></i> Add Entry Line
                </button>

                <div class="journal-totals-bar">
                  <div class="total-badge">
                    <span>Total Debits:</span>
                    <strong class="font-mono">₹{{ totalJournalDebits | number:'1.2-2' }}</strong>
                  </div>
                  <div class="total-badge">
                    <span>Total Credits:</span>
                    <strong class="font-mono">₹{{ totalJournalCredits | number:'1.2-2' }}</strong>
                  </div>
                  <div
                    class="diff-badge"
                    [class.balanced]="journalDifference === 0"
                    [class.unbalanced]="journalDifference !== 0"
                  >
                    @if (journalDifference === 0) {
                      <i class="pi pi-check-circle"></i> Balanced (Diff: ₹0.00)
                    } @else {
                      <i class="pi pi-exclamation-circle"></i> Difference: ₹{{ journalDifference | number:'1.2-2' }}
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- STANDARD LINE ITEMS FOR PAYMENT, RECEIPT, DEBIT/CREDIT NOTES -->
          @if (voucherType !== 'CONTRA' && voucherType !== 'JOURNAL') {
            <div class="line-items-section">
              <div class="section-header-flex">
                <span class="section-title">{{ config.linesSectionTitle }}</span>
                <span class="section-help">{{ config.linesSectionHelp }}</span>
              </div>

              <table class="line-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Account Particulars</th>
                    <th style="width: 200px;" class="text-right">Amount (₹)</th>
                    <th>Line Remarks / Reference</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of standardLines; track $index) {
                    <tr>
                      <td class="text-muted">{{ $index + 1 }}</td>
                      <td>
                        <zeno-searchable-select
                          [options]="getAvailableLineLedgers()"
                          labelKey="name"
                          valueKey="id"
                          placeholder="-- Select Particulars / Account --"
                          [(ngModel)]="line.ledgerId"
                        ></zeno-searchable-select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          [(ngModel)]="line.amount"
                          class="text-right font-mono font-bold"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          [(ngModel)]="line.narration"
                        />
                      </td>
                      <td class="text-center">
                        @if (standardLines.length > 1) {
                          <button class="remove-line-btn" (click)="removeStandardLine($index)">
                            <i class="pi pi-trash"></i>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="line-actions-flex">
                <button type="button" class="btn-secondary add-line-btn" (click)="addStandardLine()">
                  <i class="pi pi-plus"></i> Add Line Particular
                </button>

                <div class="total-sum-display">
                  <span>Total Amount:</span>
                  <span class="font-mono amount-number">₹{{ totalStandardAmount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          }

          <!-- FOOTER NARRATION & GL PREVIEW -->
          <div class="bottom-split-grid">
            <div class="form-group narration-group">
              <label>Overall Narration / Remarks</label>
              <textarea
                rows="3"
                [(ngModel)]="createForm.narration"
              ></textarea>
            </div>
          </div>
        </div>
      } @else if (viewMode === 'view' && viewingVoucher) {
        <!-- FULL-PAGE VOUCHER DETAIL & AUDIT SLIP -->
        <div class="page-header no-print">
          <div class="header-back-title">
            <button class="btn-back" (click)="backToList()"><i class="pi pi-arrow-left"></i></button>
            <h1>{{ viewingVoucher.voucherNo }} - {{ config.shortName }} Voucher</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" (click)="printVoucher()">
              <i class="pi pi-print"></i> Print Slip
            </button>
            @if (viewingVoucher.status === 'POSTED') {
              <button class="btn-secondary danger-outline" (click)="promptCancelVoucher(viewingVoucher)">
                <i class="pi pi-ban"></i> Cancel Voucher
              </button>
            }
          </div>
        </div>

        <!-- PRINTABLE SLIP CONTAINER -->
        <div class="zeno-card padded-card voucher-slip-container">
          <!-- SLIP HEADER -->
          <div class="slip-header">
            <div class="org-info">
              <h2 class="org-name">{{ tenant.currentCompany()?.legalName || 'Organization' }}</h2>
              <div class="org-sub">
                @if (tenant.currentCompany()?.gstin) {
                  <span>GSTIN: <strong>{{ tenant.currentCompany()?.gstin }}</strong></span>
                }
                @if (tenant.currentBranch()?.branchName) {
                  <span>Branch: {{ tenant.currentBranch()?.branchName }}</span>
                }
              </div>
            </div>
            <div class="slip-voucher-meta">
              <div class="voucher-title-pill">{{ config.listTitle }}</div>
              <div class="slip-meta-grid">
                <div><span>Voucher No:</span> <strong class="font-mono">{{ viewingVoucher.voucherNo }}</strong></div>
                <div><span>Date:</span> <strong>{{ viewingVoucher.voucherDate }}</strong></div>
                <div><span>Status:</span> <span class="badge-pill font-bold" [ngClass]="viewingVoucher.status === 'POSTED' ? 'badge-cleared' : 'badge-cancelled'">{{ viewingVoucher.status }}</span></div>
                @if (viewingVoucher.paymentMode) {
                  <div><span>Mode:</span> <strong>{{ viewingVoucher.paymentMode }}</strong></div>
                }
                @if (viewingVoucher.referenceNo) {
                  <div><span>Ref / Instrument:</span> <span class="font-mono">{{ viewingVoucher.referenceNo }}</span></div>
                }
              </div>
            </div>
          </div>

          <!-- PRIMARY ACCOUNT / HEADER HIGHLIGHT -->
          @if (viewingVoucher.sourceAccountLedger) {
            <div class="source-account-box">
              <span class="box-label">{{ config.primaryAccountLabel }}:</span>
              <span class="box-val font-bold">{{ viewingVoucher.sourceAccountLedger.name }}</span>
              <span class="box-group">({{ viewingVoucher.sourceAccountLedger.ledgerGroup?.name || 'Account' }})</span>
            </div>
          }

          <!-- LINE ITEMS BREAKDOWN -->
          <table class="zeno-table slip-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Account Particulars</th>
                <th>Narration / Remarks</th>
                <th class="text-right" style="width: 140px;">Debit (₹)</th>
                <th class="text-right" style="width: 140px;">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              @for (l of viewingVoucher.lines; track $index) {
                <tr>
                  <td>{{ $index + 1 }}</td>
                  <td>
                    <strong>{{ l.ledger?.name || 'Ledger Account' }}</strong>
                    <div class="text-muted" style="font-size: 0.75rem;">
                      {{ l.ledger?.ledgerGroup?.name || '' }}
                    </div>
                  </td>
                  <td>{{ l.narration || '—' }}</td>
                  <td class="font-mono text-right">
                    {{ (l.debitAmount && l.debitAmount > 0) ? (l.debitAmount | number:'1.2-2') : '—' }}
                  </td>
                  <td class="font-mono text-right">
                    {{ (l.creditAmount && l.creditAmount > 0) ? (l.creditAmount | number:'1.2-2') : '—' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="slip-total-row">
                <td colspan="3" class="text-right font-bold">TOTAL VOUCHER AMOUNT:</td>
                <td colspan="2" class="font-mono font-bold text-right slip-grand-total">
                  ₹{{ viewingVoucher.totalAmount | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>

          @if (viewingVoucher.narration) {
            <div class="slip-narration">
              <strong>Narration:</strong> {{ viewingVoucher.narration }}
            </div>
          }

          <!-- GENERAL LEDGER DOUBLE ENTRY AUDIT TRAIL -->
          <div class="audit-trail-section">
            <div class="audit-title">
              <i class="pi pi-database"></i> General Ledger Double-Entry Audit Trail
            </div>
            <table class="zeno-table audit-table">
              <thead>
                <tr>
                  <th>Posting Account</th>
                  <th>Ledger Group</th>
                  <th class="text-right">Debit (Dr)</th>
                  <th class="text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of viewingVoucher.ledgerEntries; track entry.id) {
                  <tr>
                    <td class="font-bold">{{ entry.ledger?.name || 'Account' }}</td>
                    <td class="text-muted">{{ entry.ledger?.ledgerGroup?.name || '—' }}</td>
                    <td class="font-mono text-right text-dr">
                      {{ (entry.debitAmount > 0) ? ('₹' + (entry.debitAmount | number:'1.2-2')) : '—' }}
                    </td>
                    <td class="font-mono text-right text-cr">
                      {{ (entry.creditAmount > 0) ? ('₹' + (entry.creditAmount | number:'1.2-2')) : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- SIGNATURES BLOCK -->
          <div class="signatures-grid">
            <div class="signature-box">
              <div class="sig-line"></div>
              <span>Prepared By</span>
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <span>Verified / Checked By</span>
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .accounting-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
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

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 4px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--surface-200);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.blue { background: #eff6ff; color: #2563eb; }
      &.orange { background: #fff7ed; color: #ea580c; }
      &.green { background: #f0fdf4; color: #16a34a; }
      &.purple { background: #faf5ff; color: #9333ea; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.72rem;
      color: var(--surface-500);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--surface-900);
      margin-top: 2px;
    }

    /* Filter Card */
    .filter-card {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      .filter-group {
        position: relative;
        flex: 1;
        min-width: 260px;
        max-width: 380px;

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--surface-400);
        }

        input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid var(--surface-200);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          outline: none;
        }
      }

      .date-filters {
        display: flex;
        align-items: center;
        gap: 12px;

        .date-input-group {
          display: flex;
          align-items: center;
          gap: 6px;

          .date-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--surface-500);
          }

          input {
            padding: 6px 10px;
            border: 1px solid var(--surface-200);
            border-radius: var(--radius-sm);
            font-size: 0.8125rem;
          }
        }
      }

      .status-tabs {
        display: flex;
        gap: 6px;

        button {
          background: none;
          border: 1px solid transparent;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--surface-600);
          cursor: pointer;

          &.active {
            background-color: var(--primary-50);
            color: var(--primary-700);
            border-color: var(--primary-200);
          }
        }
      }
    }

    /* Table & Cells */
    .account-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .sub-text {
        font-size: 0.75rem;
        color: var(--surface-500);
      }
    }

    .mode-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--surface-100);
      color: var(--surface-700);
      border: 1px solid var(--surface-200);
    }

    .ref-sub-text {
      font-size: 0.72rem;
      color: var(--surface-500);
      margin-top: 2px;
      font-family: var(--font-mono);
    }

    .narration-cell {
      white-space: nowrap !important;
      color: var(--surface-600);
      font-size: 0.8125rem;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--surface-200);
      background: var(--surface-0);
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--surface-600);
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-100);
        color: var(--surface-900);
      }

      &.danger:hover {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fca5a5;
      }
    }

    /* Form Container */
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .required {
      color: var(--danger);
    }

    .currency-input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .currency-symbol {
        position: absolute;
        left: 10px;
        color: var(--surface-500);
        font-weight: 700;
      }

      input {
        padding-left: 26px;
        width: 100%;
      }
    }

    .contra-amount-box {
      background: var(--surface-50);
      border: 1px dashed var(--primary-300);
      border-radius: var(--radius-sm);
      padding: 16px 20px;
      margin: 8px 0;
    }

    /* Line Items Section */
    .line-items-section {
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 16px;
      background: var(--surface-50);

      .section-header-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--surface-900);
        }

        .section-help {
          font-size: 0.75rem;
          color: var(--surface-500);
        }
      }

      .line-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #ffffff;
        border: 1px solid var(--surface-200);
        border-radius: var(--radius-sm);

        th {
          background-color: var(--surface-100);
          color: var(--surface-600);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          padding: 8px 12px;
          border-bottom: 1px solid var(--surface-200);
        }

        td {
          padding: 6px 10px;
          border-bottom: 1px solid var(--surface-100);
          vertical-align: middle;

          input, select {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid var(--surface-200);
            border-radius: var(--radius-sm);
            font-size: 0.8125rem;

            &:focus {
              border-color: var(--primary-600);
              outline: none;
            }
          }
        }
      }

      .line-actions-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
      }

      .add-line-btn {
        font-size: 0.8125rem;
        padding: 6px 12px;
      }

      .remove-line-btn {
        background: none;
        border: none;
        color: var(--danger);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;

        &:hover {
          background: #fee2e2;
        }
      }
    }

    .journal-totals-bar {
      display: flex;
      align-items: center;
      gap: 16px;

      .total-badge {
        font-size: 0.8125rem;
        color: var(--surface-700);
        display: flex;
        gap: 6px;
      }

      .diff-badge {
        font-size: 0.8125rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 6px;

        &.balanced {
          background: #dcfce7;
          color: #166534;
        }

        &.unbalanced {
          background: #fee2e2;
          color: #991b1b;
        }
      }
    }

    .total-sum-display {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--surface-700);

      .amount-number {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--primary-700);
      }
    }

    .bottom-split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 4px;
    }

    .narration-group {
      textarea {
        width: 100%;
        resize: vertical;
      }
    }

    .gl-impact-preview {
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 12px 16px;

      .preview-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--surface-600);
        letter-spacing: 0.04em;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .preview-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .entry-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.8125rem;
        padding: 4px 8px;
        border-radius: 4px;

        &.dr {
          background: #eff6ff;
        }

        &.cr {
          background: #f0fdf4;
        }

        .dr-cr-badge {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 3px;

          &.dr { background: #2563eb; color: #fff; }
          &.cr { background: #16a34a; color: #fff; }
        }

        .entry-desc {
          flex: 1;
          margin-left: 10px;
          color: var(--surface-800);
        }
      }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Voucher Slip View */
    .voucher-slip-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--surface-300);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .slip-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid var(--surface-300);
      padding-bottom: 16px;

      .org-name {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--surface-900);
      }

      .org-sub {
        font-size: 0.8125rem;
        color: var(--surface-600);
        display: flex;
        gap: 12px;
        margin-top: 4px;
      }

      .voucher-title-pill {
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--surface-100);
        padding: 4px 12px;
        border-radius: 4px;
        text-align: right;
        display: inline-block;
        margin-bottom: 8px;
      }

      .slip-meta-grid {
        display: grid;
        grid-template-columns: auto;
        gap: 3px;
        font-size: 0.8125rem;

        span { color: var(--surface-500); }
      }
    }

    .source-account-box {
      background: var(--surface-50);
      border-left: 4px solid var(--primary-600);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;

      .box-label { color: var(--surface-600); }
      .box-group { color: var(--surface-500); font-size: 0.8rem; }
    }

    .slip-table {
      border: 1px solid var(--surface-200);

      .slip-total-row {
        background: var(--surface-100);
      }

      .slip-grand-total {
        font-size: 1.1rem;
        color: var(--surface-900);
      }
    }

    .slip-narration {
      font-size: 0.875rem;
      color: var(--surface-700);
      background: var(--surface-50);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
    }

    .audit-trail-section {
      margin-top: 10px;
      border-top: 1px dashed var(--surface-300);
      padding-top: 16px;

      .audit-title {
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--surface-600);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .audit-table {
        font-size: 0.8125rem;

        .text-dr { color: #1d4ed8; font-weight: 600; }
        .text-cr { color: #15803d; font-weight: 600; }
      }
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      margin-top: 36px;
      padding-top: 20px;

      .signature-box {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .sig-line {
          width: 80%;
          border-top: 1px solid var(--surface-400);
        }

        span {
          font-size: 0.75rem;
          color: var(--surface-600);
          font-weight: 600;
          text-transform: uppercase;
        }
      }
    }

    .danger-outline {
      color: #dc2626 !important;
      border-color: #fca5a5 !important;

      &:hover {
        background: #fee2e2 !important;
      }
    }

    @media print {
      .no-print { display: none !important; }
      .voucher-slip-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
  `],
})
export class AccountingVouchersComponent implements OnInit {
  @Input() voucherType: 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'DEBIT_NOTE' | 'CREDIT_NOTE' = 'PAYMENT';

  viewMode: 'list' | 'create' | 'view' = 'list';
  vouchers: AccountingVoucher[] = [];
  filteredVouchers: AccountingVoucher[] = [];
  viewingVoucher: any = null;

  allLedgers: any[] = [];
  cashBankLedgers: any[] = [];

  searchQuery = '';
  selectedStatus = '';
  startDate = '';
  endDate = '';
  submitting = false;
  errorMessage = '';

  contraAmount = 0;

  createForm: any = {
    voucherDate: new Date().toISOString().split('T')[0],
    sourceAccountLedgerId: '',
    destinationLedgerId: '',
    paymentMode: 'CASH',
    referenceNo: '',
    referenceDate: '',
    narration: '',
  };

  standardLines: StandardLine[] = [
    { ledgerId: '', amount: 0, narration: '' },
  ];

  journalLines: JournalLine[] = [
    { type: 'DR', ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
    { type: 'CR', ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
  ];

  constructor(
    private accountingService: AccountingService,
    public tenant: TenantService,
    private masters: MastersService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      if (data && data['voucherType']) {
        this.voucherType = data['voucherType'];
      }
      this.initData();
    });
  }

  initData() {
    this.tenant.loadHierarchy().subscribe({
      next: () => {
        this.loadLedgers();
        this.loadVouchers();
      },
    });
  }

  get config() {
    switch (this.voucherType) {
      case 'PAYMENT':
        return {
          shortName: 'Payment',
          listTitle: 'Payment Vouchers',
          createTitle: 'Record Payment Voucher (Direct Expenses / Outflows)',
          createButtonText: 'Record Payment',
          icon: 'pi pi-arrow-circle-up',
          kpi2Label: 'CASH PAYMENTS',
          kpi3Label: 'BANK & DIGITAL',
          primaryAccountColumn: 'Paid From (Account)',
          primaryAccountLabel: 'Paid Through (Cash / Bank Account)',
          linesSectionTitle: 'Direct / Indirect Expenses & Debit Accounts',
          linesSectionHelp: 'Select expense or vendor ledgers being paid',
          refLabel: 'Cheque / UTR / Reference No',
          refPlaceholder: 'e.g. UTR-98213 or Cheque #004312',
        };
      case 'RECEIPT':
        return {
          shortName: 'Receipt',
          listTitle: 'Receipt Vouchers',
          createTitle: 'Record Receipt Voucher (Direct Income / Collections)',
          createButtonText: 'Record Receipt',
          icon: 'pi pi-arrow-circle-down',
          kpi2Label: 'CASH RECEIPTS',
          kpi3Label: 'BANK & DIGITAL',
          primaryAccountColumn: 'Received In (Account)',
          primaryAccountLabel: 'Deposit Into (Cash / Bank Account)',
          linesSectionTitle: 'Direct / Indirect Incomes & Credit Accounts',
          linesSectionHelp: 'Select revenue, customer, or income ledgers received',
          refLabel: 'Cheque / Txn / Ref No',
          refPlaceholder: 'e.g. UPI-Ref or Cheque #',
        };
      case 'CONTRA':
        return {
          shortName: 'Contra',
          listTitle: 'Contra Vouchers',
          createTitle: 'Record Contra Voucher (Cash & Bank Transfer)',
          createButtonText: 'Record Contra',
          icon: 'pi pi-sync',
          kpi2Label: 'CASH DEPOSITS',
          kpi3Label: 'BANK WITHDRAWALS',
          primaryAccountColumn: 'Source Account (Cr)',
          primaryAccountLabel: 'Transfer From (Source Account - Cr)',
          linesSectionTitle: 'Transfer Information',
          linesSectionHelp: 'Transfers funds between internal cash and bank ledgers',
          refLabel: 'Slip / Cheque / UTR No',
          refPlaceholder: 'e.g. Deposit Slip # or ATM withdrawal ref',
        };
      case 'JOURNAL':
        return {
          shortName: 'Journal',
          listTitle: 'Journal Vouchers',
          createTitle: 'Record General Journal Voucher',
          createButtonText: 'Record Journal',
          icon: 'pi pi-book',
          kpi2Label: 'BALANCED ENTRIES',
          kpi3Label: 'ACTIVE POSTINGS',
          primaryAccountColumn: 'Journal Summary',
          primaryAccountLabel: 'Journal Particulars',
          linesSectionTitle: 'Debit & Credit Accounts',
          linesSectionHelp: 'Total Debits must match Total Credits',
          refLabel: 'Voucher Ref / Document No',
          refPlaceholder: 'e.g. ADJ-001 or memo #',
        };
      case 'DEBIT_NOTE':
        return {
          shortName: 'Debit Note',
          listTitle: 'Debit Notes',
          createTitle: 'Record Accounting Debit Note',
          createButtonText: 'Create Debit Note',
          icon: 'pi pi-file-export',
          kpi2Label: 'VENDOR NOTES',
          kpi3Label: 'POSTED NOTES',
          primaryAccountColumn: 'Debit Party Account',
          primaryAccountLabel: 'Debit Party (Vendor / Customer)',
          linesSectionTitle: 'Offset Account(s) to Credit',
          linesSectionHelp: 'Purchase Return, Rate Difference, or Discount accounts',
          refLabel: 'Original Invoice Reference #',
          refPlaceholder: 'e.g. Bill #PI-2026-004',
        };
      case 'CREDIT_NOTE':
        return {
          shortName: 'Credit Note',
          listTitle: 'Credit Notes',
          createTitle: 'Record Accounting Credit Note',
          createButtonText: 'Create Credit Note',
          icon: 'pi pi-file-import',
          kpi2Label: 'CUSTOMER NOTES',
          kpi3Label: 'POSTED NOTES',
          primaryAccountColumn: 'Credit Party Account',
          primaryAccountLabel: 'Credit Party (Customer / Vendor)',
          linesSectionTitle: 'Offset Account(s) to Debit',
          linesSectionHelp: 'Sales Return, Allowance, or Rebate accounts',
          refLabel: 'Original Invoice Reference #',
          refPlaceholder: 'e.g. Tax Invoice #SI-2026-009',
        };
    }
  }

  // --- Master Data Loaders ---
  loadLedgers() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.masters.getLedgers(compId).subscribe({
      next: (res: any[]) => {
        this.allLedgers = res || [];
        this.cashBankLedgers = this.allLedgers.filter((l) => {
          const grp = (l.ledgerGroup?.name || '').toLowerCase();
          const nm = (l.name || '').toLowerCase();
          return (
            grp.includes('cash') ||
            grp.includes('bank') ||
            nm.includes('cash') ||
            nm.includes('bank') ||
            nm.includes('petty')
          );
        });
        if (this.cashBankLedgers.length === 0) {
          this.cashBankLedgers = this.allLedgers;
        }
      },
    });
  }

  loadVouchers() {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.accountingService
      .getVouchers(compId, this.voucherType, this.startDate, this.endDate, this.searchQuery)
      .subscribe({
        next: (res: any[]) => {
          this.vouchers = res || [];
          this.applyStatusFilter();
        },
      });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;
    this.applyStatusFilter();
  }

  applyStatusFilter() {
    if (!this.selectedStatus) {
      this.filteredVouchers = [...this.vouchers];
    } else {
      this.filteredVouchers = this.vouchers.filter((v) => v.status === this.selectedStatus);
    }
  }

  exportVouchers() {
    if (!this.filteredVouchers || this.filteredVouchers.length === 0) return;
    const headers = ['Voucher No', 'Date', this.config?.primaryAccountColumn || 'Account', 'Payment Mode', 'Reference No', 'Narration', 'Amount', 'Status'];
    const rows = this.filteredVouchers.map((v) => [
      v.voucherNo || '',
      v.voucherDate || '',
      this.getVoucherPrimaryAccountName(v) || '',
      v.paymentMode || 'CASH',
      v.referenceNo || '',
      v.narration || '',
      v.totalAmount || 0,
      v.status || ''
    ]);
    exportToCsv(`${this.voucherType || 'Accounting'}_Vouchers`, headers, rows);
    this.toast.success('Vouchers exported successfully!', 'Export Complete');
  }

  // --- KPIs Calculations ---
  get kpi2Value(): number {
    if (this.voucherType === 'PAYMENT' || this.voucherType === 'RECEIPT') {
      return this.vouchers.filter((v) => (v.paymentMode || 'CASH') === 'CASH').length;
    }
    if (this.voucherType === 'CONTRA') {
      return this.vouchers.filter((v) => (v.sourceAccountLedger?.name || '').toLowerCase().includes('cash')).length;
    }
    return this.vouchers.filter((v) => v.status === 'POSTED').length;
  }

  get kpi3Value(): number {
    if (this.voucherType === 'PAYMENT' || this.voucherType === 'RECEIPT') {
      return this.vouchers.filter((v) => (v.paymentMode || 'CASH') !== 'CASH').length;
    }
    if (this.voucherType === 'CONTRA') {
      return this.vouchers.filter((v) => (v.sourceAccountLedger?.name || '').toLowerCase().includes('bank')).length;
    }
    return this.vouchers.filter((v) => v.status === 'POSTED').length;
  }

  get totalVoucherValue(): number {
    return this.vouchers.reduce((sum, v) => sum + Number(v.totalAmount || 0), 0);
  }

  // --- Navigation & View Modes ---
  openCreate() {
    this.errorMessage = '';
    const defaultSourceId = this.cashBankLedgers[0]?.id || this.allLedgers[0]?.id || '';
    const defaultDestId = this.cashBankLedgers[1]?.id || this.allLedgers[1]?.id || '';

    this.createForm = {
      voucherDate: new Date().toISOString().split('T')[0],
      sourceAccountLedgerId: defaultSourceId,
      destinationLedgerId: defaultDestId,
      paymentMode: 'CASH',
      referenceNo: '',
      referenceDate: new Date().toISOString().split('T')[0],
      narration: '',
    };

    this.contraAmount = 0;

    this.standardLines = [
      { ledgerId: '', amount: 0, narration: '' },
    ];

    this.journalLines = [
      { type: 'DR', ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
      { type: 'CR', ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
    ];

    this.viewMode = 'create';
  }

  backToList() {
    this.viewMode = 'list';
    this.viewingVoucher = null;
    this.errorMessage = '';
    this.loadVouchers();
  }

  viewVoucher(id: string) {
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    if (!compId) return;
    this.accountingService.getVoucherById(id, compId).subscribe({
      next: (voucher: any) => {
        this.viewingVoucher = voucher;
        this.viewMode = 'view';
      },
      error: (err: any) => {
        alert(err.error?.message || 'Error loading voucher');
      },
    });
  }

  printVoucher() {
    window.print();
  }

  promptCancelVoucher(voucher: AccountingVoucher) {
    const reason = prompt(
      `Are you sure you want to cancel and reverse voucher ${voucher.voucherNo}? Enter reason for cancellation:`,
      'Manual cancellation',
    );
    if (reason !== null) {
      this.accountingService.cancelVoucher(voucher.id, reason).subscribe({
        next: () => {
          this.toast.success(`Voucher ${voucher.voucherNo} cancelled successfully and ledger entries reversed.`, 'Voucher Cancelled');
          if (this.viewMode === 'view') {
            this.viewVoucher(voucher.id);
          } else {
            this.loadVouchers();
          }
        },
        error: (err: any) => {
          const msg = err.error?.message || 'Error cancelling voucher';
          this.toast.error(msg, 'Cancellation Failed');
          alert(msg);
        },
      });
    }
  }

  // --- Line Item Helpers ---
  addStandardLine() {
    this.standardLines.push({ ledgerId: '', amount: 0, narration: '' });
  }

  removeStandardLine(index: number) {
    this.standardLines.splice(index, 1);
  }

  get totalStandardAmount(): number {
    return this.standardLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  }

  addJournalLine() {
    const nextType: 'DR' | 'CR' = this.totalJournalDebits > this.totalJournalCredits ? 'CR' : 'DR';
    const diff = Math.abs(this.totalJournalDebits - this.totalJournalCredits);
    this.journalLines.push({
      type: nextType,
      ledgerId: '',
      debitAmount: nextType === 'DR' ? diff : 0,
      creditAmount: nextType === 'CR' ? diff : 0,
      narration: '',
    });
  }

  removeJournalLine(index: number) {
    this.journalLines.splice(index, 1);
  }

  onJournalTypeChange(line: JournalLine) {
    if (line.type === 'DR') {
      line.debitAmount = line.creditAmount || 0;
      line.creditAmount = 0;
    } else {
      line.creditAmount = line.debitAmount || 0;
      line.debitAmount = 0;
    }
  }

  onJournalAmountChange(line: JournalLine, fromField: 'DR' | 'CR') {
    if (fromField === 'DR') {
      line.creditAmount = 0;
    } else {
      line.debitAmount = 0;
    }
  }

  get totalJournalDebits(): number {
    return this.journalLines.reduce((sum, l) => sum + Number(l.debitAmount || 0), 0);
  }

  get totalJournalCredits(): number {
    return this.journalLines.reduce((sum, l) => sum + Number(l.creditAmount || 0), 0);
  }

  get journalDifference(): number {
    return Math.abs(Number((this.totalJournalDebits - this.totalJournalCredits).toFixed(2)));
  }

  // --- Ledgers Filtering ---
  getAvailablePrimaryLedgers(): any[] {
    if (this.voucherType === 'PAYMENT' || this.voucherType === 'RECEIPT' || this.voucherType === 'CONTRA') {
      return this.cashBankLedgers.length > 0 ? this.cashBankLedgers : this.allLedgers;
    }
    return this.allLedgers;
  }

  getAvailableLineLedgers(): any[] {
    if (this.voucherType === 'PAYMENT') {
      // In payment, line accounts are expenses, suppliers, or assets
      return this.allLedgers;
    }
    if (this.voucherType === 'RECEIPT') {
      // In receipt, line accounts are incomes, customers, or revenues
      return this.allLedgers;
    }
    return this.allLedgers;
  }

  getLedgerName(id: string): string {
    const leg = this.allLedgers.find((l) => l.id === id);
    return leg ? leg.name : '';
  }

  getVoucherPrimaryAccountName(v: AccountingVoucher): string {
    if (v.sourceAccountLedger?.name) {
      return v.sourceAccountLedger.name;
    }
    if (v.voucherType === 'JOURNAL') {
      return `${v.lines?.length || 0} Accounts Entry`;
    }
    return 'General Account';
  }

  getVoucherSecondaryAccountsSummary(v: AccountingVoucher): string {
    if (!v.lines || v.lines.length === 0) return '';
    if (v.lines.length === 1) {
      return v.lines[0].ledger?.name ? `To: ${v.lines[0].ledger.name}` : '';
    }
    return `${v.lines.length} accounts (${v.lines[0].ledger?.name || 'Multiple'}, etc.)`;
  }

  isFormValid(): boolean {
    if (!this.createForm.voucherDate) return false;

    if (this.voucherType === 'CONTRA') {
      return (
        !!this.createForm.sourceAccountLedgerId &&
        !!this.createForm.destinationLedgerId &&
        this.createForm.sourceAccountLedgerId !== this.createForm.destinationLedgerId &&
        this.contraAmount > 0
      );
    }

    if (this.voucherType === 'JOURNAL') {
      if (this.journalLines.length < 2) return false;
      if (this.journalDifference !== 0) return false;
      if (this.totalJournalDebits <= 0) return false;
      return this.journalLines.every(
        (l) => !!l.ledgerId && (l.debitAmount > 0 || l.creditAmount > 0),
      );
    }

    // PAYMENT, RECEIPT, DEBIT_NOTE, CREDIT_NOTE
    if (!this.createForm.sourceAccountLedgerId) return false;
    if (this.standardLines.length === 0) return false;
    return (
      this.totalStandardAmount > 0 &&
      this.standardLines.every((l) => !!l.ledgerId && Number(l.amount) > 0)
    );
  }

  submitVoucher() {
    this.errorMessage = '';
    const compId = this.tenant.currentCompany()?.id || localStorage.getItem('zeno_company_id');
    const branchId = this.tenant.currentBranch()?.id || localStorage.getItem('zeno_branch_id');

    if (!compId || !branchId) {
      this.errorMessage = 'Active company and branch are required.';
      return;
    }

    this.submitting = true;

    let payload: any = {
      companyId: compId,
      branchId: branchId,
      voucherType: this.voucherType,
      voucherDate: this.createForm.voucherDate,
      paymentMode: this.createForm.paymentMode,
      referenceNo: this.createForm.referenceNo || undefined,
      referenceDate: this.createForm.referenceDate || undefined,
      narration: this.createForm.narration || undefined,
      sourceAccountLedgerId: this.createForm.sourceAccountLedgerId,
    };

    if (this.voucherType === 'CONTRA') {
      payload.destinationLedgerId = this.createForm.destinationLedgerId;
      payload.totalAmount = Number(this.contraAmount);
      payload.lines = [
        {
          ledgerId: this.createForm.destinationLedgerId,
          amount: Number(this.contraAmount),
          narration: this.createForm.narration || `Contra deposit/transfer`,
        },
      ];
    } else if (this.voucherType === 'JOURNAL') {
      delete payload.sourceAccountLedgerId;
      payload.lines = this.journalLines.map((j) => ({
        ledgerId: j.ledgerId,
        debitAmount: Number(j.debitAmount || 0),
        creditAmount: Number(j.creditAmount || 0),
        amount: Number(j.debitAmount || j.creditAmount || 0),
        narration: j.narration,
      }));
      payload.totalAmount = Number(this.totalJournalDebits);
    } else {
      payload.lines = this.standardLines.map((l) => ({
        ledgerId: l.ledgerId,
        amount: Number(l.amount),
        narration: l.narration,
      }));
      payload.totalAmount = Number(this.totalStandardAmount);
    }

    this.accountingService.createVoucher(payload).subscribe({
      next: (saved: any) => {
        this.submitting = false;
        this.toast.success(
          `Voucher ${saved.voucherNo || ''} posted successfully! Total: ₹${Number(saved.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${this.config.shortName} Saved`,
        );
        this.viewVoucher(saved.id);
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMessage =
          err.error?.message || 'Failed to post voucher. Please review entries.';
        this.toast.error(this.errorMessage, 'Voucher Error');
      },
    });
  }
}
