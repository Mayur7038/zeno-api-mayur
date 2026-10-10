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
  styleUrl: './zeno-modal.component.scss'
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
