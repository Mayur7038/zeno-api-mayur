import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="zeno-card-container"
      [class.padded]="padded"
      [class.overflow-hidden]="overflowHidden"
    >
      @if (title || hasHeaderActions) {
        <div class="zeno-card-header">
          <div>
            @if (title) {
              <h3 class="zeno-card-title">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="zeno-card-subtitle">{{ subtitle }}</p>
            }
          </div>
          <div class="zeno-card-header-actions">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </div>
      }

      <div class="zeno-card-body">
        <ng-content></ng-content>
      </div>

      <div class="zeno-card-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './zeno-card.component.scss'
})
export class ZenoCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padded = false;
  @Input() overflowHidden = false;
  @Input() hasHeaderActions = false;
}
