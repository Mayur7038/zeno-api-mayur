import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zeno-page-header">
      <div class="zeno-page-header-info">
        <div class="zeno-title-row">
          <h1 class="zeno-page-title">{{ title }}</h1>
          @if (badge) {
            <span class="zeno-page-badge" [class]="'badge-' + badgeType">{{ badge }}</span>
          }
        </div>
        @if (subtitle) {
          <p class="zeno-page-subtitle">{{ subtitle }}</p>
        }
      </div>

      <div class="zeno-page-header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
    <ng-content></ng-content>
  `,
  styleUrl: './zeno-page-header.component.scss'
})
export class ZenoPageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  @Input() badge?: string;
  @Input() badgeType: 'neutral' | 'primary' | 'success' | 'warning' = 'neutral';
}
