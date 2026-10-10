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
  styleUrl: './zeno-form-group.component.scss'
})
export class ZenoFormGroupComponent {
  @Input() label?: string;
  @Input() required = false;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  @Input() span: 1 | 2 | 3 = 1;
}
