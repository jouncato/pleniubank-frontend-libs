import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { PickerOption } from './picker-option';

/**
 * `app-unit-picker` — selector de unidad de negocio (company_code u otra entidad finita).
 *
 * A diferencia de `app-customer-picker` (búsqueda server-side), este picker está pensado
 * para listas finitas pre-cargadas (típicamente las unidades autorizadas para la sesión
 * vía `CoreClientContractsApiService.listAllowedCompanyCodes()`):
 *
 *  - Filtrado local sobre `[options]` por `label` (case-insensitive) o `id` (prefix match).
 *  - Auto-select cuando se pasa exactamente una opción.
 *  - API consistente con `app-customer-picker`: `[value]`, `(valueChange)`, `[disabled]`,
 *    `[placeholder]`, `[label]`, `[loading]`, `[error]`.
 *  - El consumidor mantiene la responsabilidad de cargar las opciones (boundary policy:
 *    `@pleniu/ui` no depende de `core-data-access`).
 */
@Component({
  selector: 'app-unit-picker',
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
        [attr.aria-expanded]="filtered().length > 0 && !value"
        [attr.aria-controls]="listId"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [ngModel]="display()"
        (ngModelChange)="onQueryChange($event)"
        (focus)="onFocus()"
      />

      @if (loading) {
        <p class="pb-picker__hint" role="status">Cargando unidades…</p>
      } @else if (error) {
        <p class="pb-picker__error" role="alert">{{ error }}</p>
        @if (retryLabel) {
          <button type="button" class="pb-picker__retry" (click)="retry.emit()">{{ retryLabel }}</button>
        }
      } @else if (showList() && filtered().length > 0) {
        <ul class="pb-picker__list" role="listbox" [id]="listId">
          @for (option of filtered(); track option.id) {
            <li>
              <button
                type="button"
                role="option"
                class="pb-picker__option"
                [attr.aria-selected]="option.id === value"
                (click)="select(option)"
              >
                <span>{{ option.label }}</span>
                @if (option.description) {
                  <small>{{ option.description }}</small>
                }
              </button>
            </li>
          }
        </ul>
      } @else if (showList() && filtered().length === 0 && options.length > 0) {
        <p class="pb-picker__hint" role="status">Sin coincidencias para "{{ query() }}".</p>
      }

      @if (value) {
        <button type="button" class="pb-picker__clear" (click)="clear()">Limpiar selección</button>
      }
    </div>
  `,
})
export class UnitPickerComponent implements OnChanges {
  readonly inputId = `unit-picker-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  readonly listId = `${this.inputId}-options`;

  @Input() label = 'Unidad de negocio';
  @Input() placeholder = 'Buscar unidad por nombre o código';
  @Input() options: PickerOption[] = [];
  @Input() value: string | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() disabled = false;
  @Input() retryLabel: string | null = null;
  /** Si `true` y `options` tiene exactamente una entrada, se selecciona automáticamente. */
  @Input() autoSelectSingle = true;

  @Output() readonly valueChange = new EventEmitter<string | null>();
  @Output() readonly retry = new EventEmitter<void>();

  /** Estado interno para filtrado local. */
  readonly query = signal('');
  /** Controla si el listbox está abierto (focus o tipeo). */
  private readonly listOpen = signal(false);

  readonly filtered = computed<PickerOption[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.options;
    }
    return this.options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.id.toLowerCase().startsWith(q),
    );
  });

  /** Texto mostrado en el input: label de la opción seleccionada o el query del usuario. */
  readonly display = computed<string>(() => {
    if (this.value) {
      const selected = this.options.find((opt) => opt.id === this.value);
      if (selected) {
        return selected.label;
      }
    }
    return this.query();
  });

  readonly showList = computed<boolean>(() => this.listOpen() && !this.value);

  ngOnChanges(changes: SimpleChanges): void {
    // Auto-select cuando se entrega exactamente una opción y no hay valor seleccionado.
    if (
      this.autoSelectSingle &&
      changes['options'] &&
      this.options.length === 1 &&
      !this.value
    ) {
      const only = this.options[0];
      this.valueChange.emit(only.id);
    }
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.listOpen.set(true);
    // Si el usuario edita el texto teniendo un valor seleccionado, limpiar la selección.
    if (this.value) {
      this.valueChange.emit(null);
    }
  }

  onFocus(): void {
    if (!this.value) {
      this.listOpen.set(true);
    }
  }

  select(option: PickerOption): void {
    this.query.set('');
    this.listOpen.set(false);
    this.valueChange.emit(option.id);
  }

  clear(): void {
    this.query.set('');
    this.listOpen.set(true);
    this.valueChange.emit(null);
  }
}
