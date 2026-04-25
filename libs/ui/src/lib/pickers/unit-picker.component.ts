import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomerPickerComponent } from './customer-picker.component';

@Component({
  selector: 'app-unit-picker',
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
export class UnitPickerComponent extends CustomerPickerComponent {
  override label = 'Unidad de negocio';
  override placeholder = 'Buscar unidad por nombre o código';
}
