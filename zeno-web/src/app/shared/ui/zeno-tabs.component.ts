import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ZenoTabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

@Component({
  selector: 'zeno-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zeno-tabs-bar" [class]="'zeno-tabs-' + variant">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          class="zeno-tab-item"
          [class.active]="activeTab === tab.id"
          (click)="selectTab(tab.id)"
        >
          @if (tab.icon) {
            <i [class]="tab.icon + ' zeno-tab-icon'"></i>
          }
          <span class="zeno-tab-label">{{ tab.label }}</span>
          @if (tab.badge !== undefined && tab.badge !== null) {
            <span class="zeno-tab-badge">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './zeno-tabs.component.scss'
})
export class ZenoTabsComponent {
  @Input({ required: true }) tabs: ZenoTabItem[] = [];
  @Input({ required: true }) activeTab = '';
  @Input() variant: 'underline' | 'pill' = 'underline';

  @Output() tabChange = new EventEmitter<string>();

  selectTab(id: string) {
    if (this.activeTab !== id) {
      this.activeTab = id;
      this.tabChange.emit(id);
    }
  }
}
