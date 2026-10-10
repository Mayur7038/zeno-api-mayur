import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zeno-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="zeno-badge"
      [class]="'badge-' + type + (pill ? ' is-pill' : '')"
    >
      @if (icon) {
        <i [class]="icon + ' zeno-badge-icon'"></i>
      }
      <ng-content></ng-content>
    </span>
  `,
  styleUrl: './zeno-badge.component.scss'
})
export class ZenoBadgeComponent {
  @Input() type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' = 'neutral';
  @Input() icon?: string;
  @Input() pill = true;
}
