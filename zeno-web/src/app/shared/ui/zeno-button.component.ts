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
  styles: [`
    :host {
      display: inline-block;
    }
    :host(.block), :host([block]) {
      display: block;
      width: 100%;
    }
    .zeno-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      font-weight: 600;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      border: 1px solid transparent;
      white-space: nowrap;
      user-select: none;
      line-height: 1.25;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none !important;
        transform: none !important;
      }

      &:active:not(:disabled) {
        transform: translateY(1px);
      }
    }

    /* Sizes */
    .zeno-btn-sm {
      padding: 6px 12px;
      font-size: 0.75rem;
      gap: 6px;
    }
    .zeno-btn-md {
      padding: 8px 16px;
      font-size: 0.875rem;
      gap: 8px;
    }
    .zeno-btn-lg {
      padding: 10px 20px;
      font-size: 1rem;
      gap: 10px;
    }
    .zeno-btn-block {
      width: 100%;
    }

    /* Variants */
    .zeno-btn-primary {
      background-color: var(--primary-600, #2563eb);
      color: #ffffff;
      box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.2);

      &:hover:not(:disabled) {
        background-color: var(--primary-700, #1d4ed8);
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
      }
    }

    .zeno-btn-secondary {
      background-color: var(--surface-0, #ffffff);
      color: var(--surface-700, #334155);
      border-color: var(--surface-200, #e2e8f0);

      &:hover:not(:disabled) {
        background-color: var(--surface-50, #f8fafc);
        border-color: var(--surface-300, #cbd5e1);
        color: var(--surface-900, #0f172a);
      }
    }

    .zeno-btn-success {
      background-color: #059669;
      color: #ffffff;
      box-shadow: 0 1px 2px 0 rgba(5, 150, 105, 0.2);

      &:hover:not(:disabled) {
        background-color: #047857;
      }
    }

    .zeno-btn-danger {
      background-color: var(--danger, #ef4444);
      color: #ffffff;
      box-shadow: 0 1px 2px 0 rgba(239, 68, 68, 0.2);

      &:hover:not(:disabled) {
        background-color: #dc2626;
      }
    }

    .zeno-btn-warning {
      background-color: var(--warning, #f59e0b);
      color: #ffffff;

      &:hover:not(:disabled) {
        background-color: #d97706;
      }
    }

    .zeno-btn-ghost {
      background: transparent;
      color: var(--surface-600, #475569);
      border-color: transparent;

      &:hover:not(:disabled) {
        background: var(--surface-100, #f1f5f9);
        color: var(--surface-900, #0f172a);
      }
    }

    .zeno-btn-icon {
      background: transparent;
      color: var(--surface-500, #64748b);
      border-color: transparent;
      padding: 6px 8px;

      &:hover:not(:disabled) {
        background: var(--surface-100, #f1f5f9);
        color: var(--surface-800, #1e293b);
      }
    }

    .zeno-btn-content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .zeno-btn-spinner {
      margin-right: 2px;
    }
  `]
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
