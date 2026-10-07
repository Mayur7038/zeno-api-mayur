import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-form-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="zeno-form-group"
      [class.has-error]="!!error"
      [class.layout-horizontal]="layout === 'horizontal'"
      [class.span-2]="span === 2"
      [class.span-3]="span === 3"
      [class.full-width]="span === 3"
    >
      @if (label) {
        <label class="zeno-form-label" [class.required]="required">
          {{ label }}
          @if (required) {
            <span class="required-star">*</span>
          }
        </label>
      }

      <div class="zeno-control-container">
        <ng-content></ng-content>

        @if (hint && !error) {
          <span class="zeno-form-hint">{{ hint }}</span>
        }

        @if (error) {
          <span class="zeno-form-error">
            <i class="pi pi-exclamation-circle"></i> {{ error }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .zeno-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
      width: 100%;

      &.layout-horizontal {
        flex-direction: row;
        align-items: center;
        gap: 16px;

        .zeno-form-label {
          min-width: 140px;
          margin-bottom: 0;
        }
        .zeno-control-container {
          flex: 1;
        }
      }
    }
    .zeno-form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-700, #334155);
      user-select: none;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .required-star {
      color: var(--danger, #ef4444);
      font-weight: 700;
    }
    .zeno-control-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .zeno-form-hint {
      font-size: 0.75rem;
      color: var(--surface-500, #64748b);
      line-height: 1.3;
    }
    .zeno-form-error {
      font-size: 0.75rem;
      color: var(--danger, #ef4444);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
  `]
})
export class ZenoFormGroupComponent {
  @Input() label?: string;
  @Input() required = false;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  @Input() span: 1 | 2 | 3 = 1;
}
