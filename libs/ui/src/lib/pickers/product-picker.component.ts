import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { CustomerPickerComponent } from './customer-picker.component';
import type { PickerOption } from './picker-option';

/**
 * Selector de producto. Delega toda la lógica UI a `<app-customer-picker>` —
 * sin herencia, evitando el doble host element que generaba `extends`.
 */
@Component({
  selector: 'app-product-picker',
  standalone: true,
  imports: [CustomerPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-customer-picker
      [label]="label"
      [placeholder]="placeholder"
      [options]="options"
      [value]="value"
      [loading]="loading"
      [error]="error"
      [minSearchLength]="minSearchLength"
      [allowRawUuid]="allowRawUuid"
      (queryChange)="queryChange.emit($event)"
      (valueChange)="valueChange.emit($event)"
    />
  `,
})
export class ProductPickerComponent {
  @Input() label = 'Producto';
  @Input() placeholder = 'Buscar producto por nombre o identificador';
  @Input() options: PickerOption[] = [];
  @Input() value: string | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() minSearchLength = 2;
  @Input() allowRawUuid = false;

  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly valueChange = new EventEmitter<string | null>();
}
