import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'zeno-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenoInputComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="zeno-input-wrap"
      [class.has-icon]="!!icon"
      [class.is-disabled]="disabled"
      [class.has-error]="error"
    >
      @if (icon) {
        <i [class]="icon + ' zeno-input-prefix-icon'"></i>
      }
      <input
        [type]="type"
        [ngModel]="value"
        [disabled]="disabled"
        [readonly]="readonly"
        [min]="min"
        [max]="max"
        [step]="step"
        [class.uppercase]="uppercase"
        [class.font-mono]="mono"
        class="zeno-base-input"
        (ngModelChange)="onValueChange($event)"
        (blur)="onBlur($event)"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .zeno-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200, #e2e8f0);
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

        .zeno-base-input {
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
    .zeno-input-prefix-icon {
      position: absolute;
      left: 12px;
      color: var(--surface-400, #94a3b8);
      font-size: 0.875rem;
      pointer-events: none;
    }
    .zeno-base-input {
      width: 100%;
      padding: 9px 12px;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--surface-900, #0f172a);
      outline: none;
      border-radius: var(--radius-sm, 6px);

      &.uppercase {
        text-transform: uppercase;
      }
      &.font-mono {
        font-family: var(--font-mono, monospace);
      }
    }
    .zeno-input-wrap.has-icon .zeno-base-input {
      padding-left: 36px;
    }
  `]
})
export class ZenoInputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'number' | 'email' | 'password' | 'date' | 'tel' = 'text';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() uppercase = false;
  @Input() mono = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: string;
  @Input() icon?: string;
  @Input() error = false;

  @Output() inputChange = new EventEmitter<any>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();

  value: any = '';

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val !== undefined && val !== null ? val : '';
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

  onValueChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.inputChange.emit(val);
  }

  onBlur(event: FocusEvent) {
    this.onTouched();
    this.inputBlur.emit(event);
  }
}
