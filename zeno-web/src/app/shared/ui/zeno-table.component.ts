import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zeno-table-container">
      @if (hasToolbar) {
        <div class="zeno-table-toolbar">
          <div class="zeno-toolbar-left">
            <ng-content select="[toolbar-left]"></ng-content>
          </div>
          <div class="zeno-toolbar-right">
            <ng-content select="[toolbar-right]"></ng-content>
          </div>
        </div>
      }

      <div class="zeno-table-scroll-wrap">
        <ng-content></ng-content>

        @if (loading) {
          <div class="zeno-table-state-box loading">
            <i class="pi pi-spin pi-spinner zeno-spinner-icon"></i>
            <span>{{ loadingMessage }}</span>
          </div>
        } @else if (empty) {
          <div class="zeno-table-state-box empty">
            <div class="zeno-empty-icon-wrap">
              <i [class]="emptyIcon"></i>
            </div>
            <p class="zeno-empty-title">{{ emptyMessage }}</p>
            @if (emptyActionText) {
              <button
                type="button"
                class="btn-primary"
                style="margin-top: 12px;"
                (click)="emptyAction.emit()"
              >
                {{ emptyActionText }}
              </button>
            }
          </div>
        }
      </div>

      <div class="zeno-table-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './zeno-table.component.scss'
})
export class ZenoTableComponent {
  @Input() hasToolbar = true;
  @Input() loading = false;
  @Input() empty = false;
  @Input() loadingMessage = 'Loading data...';
  @Input() emptyMessage = 'No records found.';
  @Input() emptyIcon = 'pi pi-folder-open';
  @Input() emptyActionText?: string;

  @Output() emptyAction = new EventEmitter<void>();
}
