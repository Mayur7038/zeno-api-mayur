import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'zeno-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenoRadioComponent),
      multi: true
    }
  ],
  template: `
    <label class="zeno-radio-label" [class.is-disabled]="disabled">
      <input
        type="radio"
        [name]="name"
        [checked]="modelValue === value"
        [disabled]="disabled"
        (change)="onSelect()"
      />
      <span class="zeno-radio-custom">
        <span class="zeno-radio-inner"></span>
      </span>
      <span class="zeno-radio-text">
        @if (label) {
          {{ label }}
        } @else {
          <ng-content></ng-content>
        }
      </span>
    </label>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .zeno-radio-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--surface-700, #334155);

      &.is-disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      input[type="radio"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        margin: 0;

        &:checked + .zeno-radio-custom {
          border-color: var(--primary-600, #2563eb);

          .zeno-radio-inner {
            transform: scale(1);
            opacity: 1;
          }
        }

        &:focus-visible + .zeno-radio-custom {
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }
      }
    }
    .zeno-radio-custom {
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--surface-300, #cbd5e1);
      border-radius: 50%;
      background-color: var(--surface-0, #ffffff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease-in-out;
      flex-shrink: 0;
    }
    .zeno-radio-inner {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary-600, #2563eb);
      transform: scale(0);
      opacity: 0;
      transition: all 0.15s ease-in-out;
    }
    .zeno-radio-text {
      line-height: 1.25;
    }
  `]
})
export class ZenoRadioComponent implements ControlValueAccessor {
  @Input({ required: true }) value: any;
  @Input() name = 'zeno-radio';
  @Input() label?: string;
  @Input() disabled = false;

  @Output() change = new EventEmitter<any>();

  modelValue: any;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.modelValue = val;
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

  onSelect() {
    this.modelValue = this.value;
    this.onChange(this.value);
    this.onTouched();
    this.change.emit(this.value);
  }
}
