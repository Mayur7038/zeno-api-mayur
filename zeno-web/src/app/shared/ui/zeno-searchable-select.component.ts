import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'zeno-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenoSearchableSelectComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="search-select-container"
      [class.is-open]="isOpen"
      [class.is-disabled]="disabled"
      [class.has-value]="value !== null && value !== ''"
    >
      <div class="select-trigger" (click)="toggleDropdown()">
        <i class="pi pi-search search-icon"></i>
        @if (!isOpen) {
          <span class="selected-text" [class.placeholder]="!selectedOption">
            {{ selectedOption ? getDisplayLabel(selectedOption) : (placeholder || emptyLabel || 'Select...') }}
          </span>
        } @else {
          <input
            #searchInput
            type="text"
            class="search-input"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (click)="$event.stopPropagation()"
            (keydown)="onKeyDown($event)"
            [placeholder]="selectedOption ? getDisplayLabel(selectedOption) : 'Type to search...'"
          />
        }

        <div class="trigger-actions">
          @if (allowClear && value !== null && value !== '' && !disabled) {
            <i class="pi pi-times clear-btn" (click)="clearSelection($event)" title="Clear selection"></i>
          }
          <i class="pi pi-chevron-down arrow-icon" [class.rotated]="isOpen"></i>
        </div>
      </div>

      @if (isOpen) {
        <div class="dropdown-menu">
          @if (filteredOptions.length === 0) {
            <div class="no-options">
              <i class="pi pi-exclamation-circle"></i> No results found
            </div>
          } @else {
            <ul class="options-list" #optionsList>
              @for (opt of filteredOptions; track getOptionValue(opt); let i = $index) {
                <li
                  class="option-item"
                  [class.is-active]="i === activeIndex"
                  [class.is-selected]="getOptionValue(opt) === value"
                  (click)="selectOption(opt, $event)"
                  (mouseenter)="activeIndex = i"
                >
                  <div class="option-main">
                    <span class="option-title">{{ getOptionLabel(opt) }}</span>
                    @if (getSecondaryLabel(opt)) {
                      <span class="option-sub">{{ getSecondaryLabel(opt) }}</span>
                    }
                  </div>
                  @if (getOptionValue(opt) === value) {
                    <i class="pi pi-check check-icon"></i>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .search-select-container {
      position: relative;
      width: 100%;

      &.is-disabled {
        opacity: 0.65;
        pointer-events: none;
      }
    }

    .select-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 38px;
      padding: 0 10px;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-300, #cbd5e1);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      box-sizing: border-box;

      &:hover {
        border-color: var(--primary-400, #60a5fa);
      }

      .search-icon {
        color: var(--surface-400, #94a3b8);
        font-size: 0.85rem;
        flex-shrink: 0;
      }
    }

    .is-open .select-trigger {
      border-color: var(--primary-600, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .selected-text {
      flex: 1;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--surface-900, #0f172a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.placeholder {
        color: var(--surface-400, #94a3b8);
        font-weight: 400;
      }
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.85rem;
      color: var(--surface-900, #0f172a);
      padding: 0;
      margin: 0;
      width: 100%;
    }

    .trigger-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;

      .clear-btn {
        font-size: 0.75rem;
        color: var(--surface-400, #94a3b8);
        padding: 2px;
        border-radius: 50%;

        &:hover {
          color: var(--danger, #ef4444);
          background: var(--surface-100, #f1f5f9);
        }
      }

      .arrow-icon {
        font-size: 0.75rem;
        color: var(--surface-400, #94a3b8);
        transition: transform 0.2s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 1050;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-200, #e2e8f0);
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }

    .no-options {
      padding: 12px;
      font-size: 0.82rem;
      color: var(--surface-500, #64748b);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .options-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.12s ease;

      &.is-active {
        background: var(--surface-100, #f1f5f9);
      }

      &.is-selected {
        background: var(--primary-50, #eff6ff);
        color: var(--primary-700, #1d4ed8);
        font-weight: 600;
      }

      .option-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
      }

      .option-title {
        font-size: 0.84rem;
        color: var(--surface-800, #1e293b);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .option-sub {
        font-size: 0.75rem;
        color: var(--surface-500, #64748b);
      }

      .check-icon {
        font-size: 0.8rem;
        color: var(--primary-600, #2563eb);
      }
    }
  `]
})
export class ZenoSearchableSelectComponent implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() labelKey: string = 'name';
  @Input() valueKey: string = 'id';
  @Input() secondaryKey?: string;
  @Input() placeholder: string = 'Search & select...';
  @Input() disabled = false;
  @Input() allowClear = true;
  @Input() emptyLabel?: string;

  @Output() selectChange = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  value: any = null;
  isOpen = false;
  searchQuery = '';
  filteredOptions: any[] = [];
  activeIndex = 0;
  selectedOption: any = null;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  constructor(private elementRef: ElementRef) {}

  writeValue(val: any): void {
    this.value = val;
    this.updateSelectedOption();
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnChanges(): void {
    this.filterOptions();
    this.updateSelectedOption();
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.isOpen = true;
    this.searchQuery = '';
    this.filterOptions();
    this.activeIndex = 0;
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 50);
  }

  closeDropdown(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchQuery = '';
      this.onTouched();
    }
  }

  onSearchInput(): void {
    this.filterOptions();
    this.activeIndex = 0;
  }

  filterOptions(): void {
    if (!this.options) {
      this.filteredOptions = [];
      return;
    }
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.filteredOptions = [...this.options];
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredOptions = this.options.filter(opt => {
      const label = this.getOptionLabel(opt).toLowerCase();
      const sec = this.getSecondaryLabel(opt).toLowerCase();
      return label.includes(q) || sec.includes(q);
    });
  }

  updateSelectedOption(): void {
    if (!this.options || this.value === null || this.value === undefined || this.value === '') {
      this.selectedOption = null;
      return;
    }
    this.selectedOption = this.options.find(opt => this.getOptionValue(opt) === this.value) || null;
  }

  selectOption(opt: any, event?: Event): void {
    if (event) event.stopPropagation();
    const val = this.getOptionValue(opt);
    this.value = val;
    this.selectedOption = opt;
    this.onChange(val);
    this.selectChange.emit(val);
    this.optionSelected.emit(opt);
    this.closeDropdown();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.value = null;
    this.selectedOption = null;
    this.onChange(null);
    this.selectChange.emit(null);
    this.optionSelected.emit(null);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.activeIndex < this.filteredOptions.length - 1) {
        this.activeIndex++;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.activeIndex > 0) {
        this.activeIndex--;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.filteredOptions[this.activeIndex]) {
        this.selectOption(this.filteredOptions[this.activeIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
    }
  }

  getOptionLabel(opt: any): string {
    if (!opt) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    if (this.labelKey && opt[this.labelKey] !== undefined) return String(opt[this.labelKey]);
    return opt.name || opt.label || opt.title || String(opt);
  }

  getSecondaryLabel(opt: any): string {
    if (!opt || typeof opt !== 'object') return '';
    if (this.secondaryKey && opt[this.secondaryKey] !== undefined) {
      const val = opt[this.secondaryKey];
      return val ? String(val) : '';
    }
    if (opt.sku) return `SKU: ${opt.sku}`;
    if (opt.gstin) return `GSTIN: ${opt.gstin}`;
    if (opt.code) return `Code: ${opt.code}`;
    return '';
  }

  getDisplayLabel(opt: any): string {
    const main = this.getOptionLabel(opt);
    const sec = this.getSecondaryLabel(opt);
    return sec ? `${main} (${sec})` : main;
  }

  getOptionValue(opt: any): any {
    if (opt === null || opt === undefined) return null;
    if (typeof opt === 'string' || typeof opt === 'number') return opt;
    if (this.valueKey && opt[this.valueKey] !== undefined) return opt[this.valueKey];
    return opt.id !== undefined ? opt.id : opt.value !== undefined ? opt.value : opt;
  }
}
