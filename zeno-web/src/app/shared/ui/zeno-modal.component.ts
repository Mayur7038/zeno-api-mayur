import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="zeno-modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="zeno-modal-dialog"
          [class]="'zeno-modal-' + size"
          (click)="$event.stopPropagation()"
        >
          <div class="zeno-modal-header">
            <div>
              <h3 class="zeno-modal-title">{{ title }}</h3>
              @if (subtitle) {
                <p class="zeno-modal-subtitle">{{ subtitle }}</p>
              }
            </div>
            <div class="zeno-modal-header-actions">
              <ng-content select="[header-actions]"></ng-content>
              @if (closable) {
                <button
                  type="button"
                  class="zeno-modal-close-btn"
                  (click)="handleClose()"
                  title="Close (Esc)"
                >
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>
          </div>

          <div class="zeno-modal-body">
            <ng-content></ng-content>
          </div>

          <div class="zeno-modal-footer">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .zeno-modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease-out;
      padding: 20px;
    }
    .zeno-modal-dialog {
      background: var(--surface-0, #ffffff);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-elevated, 0 10px 15px -3px rgba(0, 0, 0, 0.08));
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.15s ease-out;
      width: 100%;
    }

    /* Sizes */
    .zeno-modal-sm {
      max-width: 440px;
    }
    .zeno-modal-md {
      max-width: 600px;
    }
    .zeno-modal-lg {
      max-width: 860px;
    }
    .zeno-modal-xl {
      max-width: 1100px;
    }
    .zeno-modal-full {
      max-width: 96vw;
      height: 94vh;
    }

    .zeno-modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--surface-200, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background-color: var(--surface-0, #ffffff);
      flex-shrink: 0;
    }
    .zeno-modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--surface-900, #0f172a);
      margin: 0;
    }
    .zeno-modal-subtitle {
      font-size: 0.8125rem;
      color: var(--surface-500, #64748b);
      margin: 4px 0 0 0;
    }
    .zeno-modal-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .zeno-modal-close-btn {
      background: none;
      border: none;
      color: var(--surface-400, #94a3b8);
      cursor: pointer;
      font-size: 1rem;
      padding: 6px;
      border-radius: var(--radius-sm, 6px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background-color: var(--surface-100, #f1f5f9);
        color: var(--surface-700, #334155);
      }
    }
    .zeno-modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .zeno-modal-footer {
      padding: 14px 24px;
      border-top: 1px solid var(--surface-200, #e2e8f0);
      background-color: var(--surface-50, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-shrink: 0;
    }
    .zeno-modal-footer:empty {
      display: none;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.97);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ZenoModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() closable = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen && this.closable) {
      this.handleClose();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop && this.closable) {
      this.handleClose();
    }
  }

  handleClose() {
    this.close.emit();
  }
}
