import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'zeno-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenoSearchComponent),
      multi: true
    }
  ],
  template: `
    <div class="zeno-search-wrapper" [class.disabled]="disabled">
      <i class="pi pi-search zeno-search-icon"></i>
      <input
        type="text"
        class="zeno-search-input"
        [ngModel]="value"
        [disabled]="disabled"
        (ngModelChange)="onInputChange($event)"
      />
      @if (value) {
        <button
          type="button"
          class="zeno-search-clear"
          (click)="clearSearch()"
          title="Clear search"
        >
          <i class="pi pi-times"></i>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      min-width: 260px;
      vertical-align: middle;
    }
    .zeno-search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 38px;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-300, #cbd5e1);
      border-radius: var(--radius-sm, 6px);
      transition: all 0.15s ease-in-out;

      &:focus-within {
        border-color: var(--primary-600, #2563eb);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--surface-50, #f8fafc);
      }
    }
    .zeno-search-icon {
      position: absolute;
      left: 12px;
      color: var(--surface-400, #94a3b8);
      font-size: 0.875rem;
      pointer-events: none;
    }
    .zeno-search-input {
      width: 100%;
      height: 100%;
      padding: 0 34px 0 34px;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--surface-900, #0f172a);
      outline: none;
    }
    .zeno-search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: var(--surface-400, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.75rem;
      transition: all 0.15s ease;

      &:hover {
        background-color: var(--surface-100, #f1f5f9);
        color: var(--surface-700, #334155);
      }
    }
  `]
})
export class ZenoSearchComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Output() searchChange = new EventEmitter<string>();

  value = '';

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(val: string) {
    this.value = val;
    this.onChange(val);
    this.searchChange.emit(val);
  }

  clearSearch() {
    this.value = '';
    this.onChange('');
    this.searchChange.emit('');
  }
}
