import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { PickerOption } from './picker-option';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generic server-side combobox picker.
 *
 * `CustomerPickerComponent` and `ProductPickerComponent` are thin wrappers
 * that set domain-specific defaults and delegate rendering here.
 */
@Component({
  selector: 'app-picker',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./picker.styles.css'],
  template: `
    <div class="pb-picker">
      <label class="pb-picker__label" [for]="inputId">{{ label }}</label>
      <input
        class="pb-picker__input"
        [id]="inputId"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="options.length > 0"
        [attr.aria-controls]="listId"
        [placeholder]="placeholder"
        [ngModel]="query"
        (ngModelChange)="onQueryChange($event)"
      />

      @if (loading) {
        <p class="pb-picker__hint" role="status">Buscando...</p>
      } @else if (error) {
        <p class="pb-picker__error" role="alert">{{ error }}</p>
      } @else if (options.length > 0) {
        <ul class="pb-picker__list" role="listbox" [id]="listId">
          @for (option of options; track option.id) {
            <li>
              <button type="button" role="option" class="pb-picker__option" (click)="select(option)">
                <span>{{ option.label }}</span>
                @if (option.description) {
                  <small>{{ option.description }}</small>
                }
              </button>
            </li>
          }
        </ul>
      }

      @if (value) {
        <button type="button" class="pb-picker__clear" (click)="clear()">Limpiar selección</button>
      }
    </div>
  `,
})
export class PickerComponent {
  readonly inputId = `picker-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  readonly listId = `${this.inputId}-options`;

  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: PickerOption[] = [];
  @Input() value: string | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() minSearchLength = 2;
  @Input() allowRawUuid = false;

  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly valueChange = new EventEmitter<string | null>();

  query = '';

  onQueryChange(value: string): void {
    this.query = value;
    const trimmed = value.trim();
    if (this.allowRawUuid && UUID_PATTERN.test(trimmed)) {
      this.value = trimmed;
      this.valueChange.emit(trimmed);
      return;
    }
    if (trimmed.length >= this.minSearchLength) {
      this.queryChange.emit(trimmed);
    }
  }

  select(option: PickerOption): void {
    this.value = option.id;
    this.query = option.label;
    this.valueChange.emit(option.id);
  }

  clear(): void {
    this.value = null;
    this.query = '';
    this.valueChange.emit(null);
  }
}
