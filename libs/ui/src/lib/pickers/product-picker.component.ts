import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomerPickerComponent } from './customer-picker.component';

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
export class ProductPickerComponent extends CustomerPickerComponent {
  override label = 'Producto';
  override placeholder = 'Buscar producto por nombre o identificador';
}
