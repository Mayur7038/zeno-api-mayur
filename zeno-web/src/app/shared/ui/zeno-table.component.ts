import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zeno-table-container">
      @if (hasToolbar) {
        <div class="zeno-table-toolbar">
          <div class="zeno-toolbar-left">
            <ng-content select="[toolbar-left]"></ng-content>
          </div>
          <div class="zeno-toolbar-right">
            <ng-content select="[toolbar-right]"></ng-content>
          </div>
        </div>
      }

      <div class="zeno-table-scroll-wrap">
        <ng-content></ng-content>

        @if (loading) {
          <div class="zeno-table-state-box loading">
            <i class="pi pi-spin pi-spinner zeno-spinner-icon"></i>
            <span>{{ loadingMessage }}</span>
          </div>
        } @else if (empty) {
          <div class="zeno-table-state-box empty">
            <div class="zeno-empty-icon-wrap">
              <i [class]="emptyIcon"></i>
            </div>
            <p class="zeno-empty-title">{{ emptyMessage }}</p>
            @if (emptyActionText) {
              <button
                type="button"
                class="btn-primary"
                style="margin-top: 12px;"
                (click)="emptyAction.emit()"
              >
                {{ emptyActionText }}
              </button>
            }
          </div>
        }
      </div>

      <div class="zeno-table-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .zeno-table-container {
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-subtle, 0 1px 3px 0 rgba(0, 0, 0, 0.05));
      overflow: hidden;
    }
    .zeno-table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      gap: 16px;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--surface-200, #e2e8f0);
      background-color: var(--surface-0, #ffffff);
    }
    .zeno-toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .zeno-toolbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    :host ::ng-deep [toolbar-left] {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    :host ::ng-deep [toolbar-right] {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .zeno-table-scroll-wrap {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;

      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-track {
        background: var(--surface-100, #f1f5f9);
      }
      &::-webkit-scrollbar-thumb {
        background: var(--surface-300, #cbd5e1);
        border-radius: var(--radius-full, 9999px);
      }
    }
    .zeno-table-state-box {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--surface-500, #64748b);
      font-size: 0.875rem;

      &.loading {
        gap: 12px;
        .zeno-spinner-icon {
          font-size: 1.75rem;
          color: var(--primary-600, #2563eb);
        }
      }

      &.empty {
        .zeno-empty-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background-color: var(--surface-100, #f1f5f9);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          color: var(--surface-400, #94a3b8);
          font-size: 1.5rem;
        }
        .zeno-empty-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--surface-600, #475569);
          margin: 0;
        }
      }
    }
    .zeno-table-footer:empty {
      display: none;
    }
    .zeno-table-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--surface-200, #e2e8f0);
      background-color: var(--surface-50, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  `]
})
export class ZenoTableComponent {
  @Input() hasToolbar = true;
  @Input() loading = false;
  @Input() empty = false;
  @Input() loadingMessage = 'Loading data...';
  @Input() emptyMessage = 'No records found.';
  @Input() emptyIcon = 'pi pi-folder-open';
  @Input() emptyActionText?: string;

  @Output() emptyAction = new EventEmitter<void>();
}
