import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ZenoTabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

@Component({
  selector: 'zeno-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zeno-tabs-bar" [class]="'zeno-tabs-' + variant">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          class="zeno-tab-item"
          [class.active]="activeTab === tab.id"
          (click)="selectTab(tab.id)"
        >
          @if (tab.icon) {
            <i [class]="tab.icon + ' zeno-tab-icon'"></i>
          }
          <span class="zeno-tab-label">{{ tab.label }}</span>
          @if (tab.badge !== undefined && tab.badge !== null) {
            <span class="zeno-tab-badge">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 20px;
    }
    .zeno-tabs-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    /* Underline variant */
    .zeno-tabs-underline {
      border-bottom: 2px solid var(--surface-200, #e2e8f0);
      gap: 24px;

      .zeno-tab-item {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 10px 4px;
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--surface-500, #64748b);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease-in-out;
        white-space: nowrap;

        &:hover {
          color: var(--surface-900, #0f172a);
        }

        &.active {
          color: var(--primary-600, #2563eb);
          border-bottom-color: var(--primary-600, #2563eb);
          font-weight: 600;

          .zeno-tab-icon {
            color: var(--primary-600, #2563eb);
          }
        }
      }
    }

    /* Pill variant */
    .zeno-tabs-pill {
      background: var(--surface-100, #f1f5f9);
      padding: 4px;
      border-radius: var(--radius-sm, 6px);
      display: inline-flex;

      .zeno-tab-item {
        background: transparent;
        border: none;
        border-radius: 4px;
        padding: 6px 14px;
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--surface-600, #475569);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease-in-out;
        white-space: nowrap;

        &:hover {
          color: var(--surface-900, #0f172a);
        }

        &.active {
          background-color: var(--surface-0, #ffffff);
          color: var(--surface-900, #0f172a);
          font-weight: 600;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
      }
    }

    .zeno-tab-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--surface-200, #e2e8f0);
      color: var(--surface-700, #334155);
    }
  `]
})
export class ZenoTabsComponent {
  @Input({ required: true }) tabs: ZenoTabItem[] = [];
  @Input({ required: true }) activeTab = '';
  @Input() variant: 'underline' | 'pill' = 'underline';

  @Output() tabChange = new EventEmitter<string>();

  selectTab(id: string) {
    if (this.activeTab !== id) {
      this.activeTab = id;
      this.tabChange.emit(id);
    }
  }
}
