import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [title]="title"
      [class]="'zeno-btn zeno-btn-' + variant + ' zeno-btn-' + size + (block ? ' zeno-btn-block' : '')"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <i class="pi pi-spin pi-spinner zeno-btn-spinner"></i>
      } @else if (icon && iconPos === 'left') {
        <i [class]="icon"></i>
      }

      <span class="zeno-btn-content">
        <ng-content></ng-content>
      </span>

      @if (!loading && icon && iconPos === 'right') {
        <i [class]="icon"></i>
      }
    </button>
  `,
  styleUrl: './zeno-button.component.scss'
})
export class ZenoButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'icon' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() icon?: string;
  @Input() iconPos: 'left' | 'right' = 'left';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() block = false;
  @Input() title = '';

  @Output() btnClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
