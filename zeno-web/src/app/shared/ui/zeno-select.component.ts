import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'zeno-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenoSelectComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="zeno-select-wrap"
      [class.is-disabled]="disabled"
      [class.has-error]="error"
    >
      <select
        [ngModel]="value"
        [disabled]="disabled"
        class="zeno-base-select"
        (ngModelChange)="onValueChange($event)"
        (blur)="onBlur($event)"
      >
        @if (allowEmpty) {
          <option [ngValue]="null">{{ emptyLabel || 'Select...' }}</option>
        }
        @if (options && options.length > 0) {
          @for (opt of options; track $index) {
            <option
              [ngValue]="getOptionValue(opt)"
              [disabled]="opt?.disabled"
            >
              {{ getOptionLabel(opt) }}
            </option>
          }
        }
        <ng-content></ng-content>
      </select>
      <i class="pi pi-chevron-down zeno-select-arrow"></i>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      vertical-align: middle;
    }
    .zeno-select-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 38px;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-300, #cbd5e1);
      border-radius: var(--radius-sm, 6px);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:focus-within {
        border-color: var(--primary-600, #2563eb);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &.is-disabled {
        background-color: var(--surface-100, #f1f5f9);
        border-color: var(--surface-200, #e2e8f0);
        cursor: not-allowed;

        .zeno-base-select {
          cursor: not-allowed;
          color: var(--surface-500, #64748b);
        }
      }

      &.has-error {
        border-color: var(--danger, #ef4444);

        &:focus-within {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
      }
    }
    .zeno-base-select {
      width: 100%;
      height: 100%;
      padding: 0 32px 0 12px;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.84rem;
      font-weight: 500;
      color: var(--surface-900, #0f172a);
      outline: none;
      border-radius: var(--radius-sm, 6px);
      appearance: none;
      cursor: pointer;

      option {
        background-color: var(--surface-0, #ffffff);
        color: var(--surface-900, #0f172a);
      }
    }
    .zeno-select-arrow {
      position: absolute;
      right: 12px;
      color: var(--surface-400, #94a3b8);
      font-size: 0.75rem;
      pointer-events: none;
    }
  `]
})
export class ZenoSelectComponent implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() labelKey?: string;
  @Input() valueKey?: string;
  @Input() disabled = false;
  @Input() allowEmpty = false;
  @Input() emptyLabel?: string;
  @Input() error = false;

  @Output() selectChange = new EventEmitter<any>();
  @Output() selectBlur = new EventEmitter<FocusEvent>();

  value: any = null;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getOptionLabel(opt: any): string {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    if (this.labelKey && opt[this.labelKey] !== undefined) return String(opt[this.labelKey]);
    return opt.label || opt.name || opt.title || String(opt);
  }

  getOptionValue(opt: any): any {
    if (opt === null || opt === undefined) return null;
    if (typeof opt === 'string' || typeof opt === 'number') return opt;
    if (this.valueKey && opt[this.valueKey] !== undefined) return opt[this.valueKey];
    return opt.value !== undefined ? opt.value : opt.id !== undefined ? opt.id : opt;
  }

  onValueChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.selectChange.emit(val);
  }

  onBlur(event: FocusEvent) {
    this.onTouched();
    this.selectBlur.emit(event);
  }
}
