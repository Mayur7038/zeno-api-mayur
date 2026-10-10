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
  styleUrl: './zeno-input.component.scss'
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
