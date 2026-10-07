import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="zeno-card-container"
      [class.padded]="padded"
      [class.overflow-hidden]="overflowHidden"
    >
      @if (title || hasHeaderActions) {
        <div class="zeno-card-header">
          <div>
            @if (title) {
              <h3 class="zeno-card-title">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="zeno-card-subtitle">{{ subtitle }}</p>
            }
          </div>
          <div class="zeno-card-header-actions">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </div>
      }

      <div class="zeno-card-body">
        <ng-content></ng-content>
      </div>

      <div class="zeno-card-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 24px;
    }
    .zeno-card-container {
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-subtle, 0 1px 3px 0 rgba(0, 0, 0, 0.05));
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;

      &.padded .zeno-card-body {
        padding: 24px;
      }

      &.overflow-hidden {
        overflow: hidden;
      }

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
    .zeno-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--surface-200, #e2e8f0);
      background-color: var(--surface-0, #ffffff);
    }
    .zeno-card-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--surface-900, #0f172a);
      margin: 0;
      line-height: 1.25;
    }
    .zeno-card-subtitle {
      font-size: 0.8125rem;
      color: var(--surface-500, #64748b);
      margin: 4px 0 0 0;
    }
    .zeno-card-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .zeno-card-body {
      width: 100%;
    }
    .zeno-card-footer:empty {
      display: none;
    }
    .zeno-card-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--surface-200, #e2e8f0);
      background-color: var(--surface-50, #f8fafc);
    }
  `]
})
export class ZenoCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padded = false;
  @Input() overflowHidden = false;
  @Input() hasHeaderActions = false;
}
