import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CustomerPickerComponent } from './customer-picker.component';
import { PickerComponent } from './picker.component';
import type { PickerOption } from './picker-option';

/**
 * `CustomerPickerComponent` es un wrapper delgado que delega toda la lógica
 * (query, selección, limpieza) a `<app-picker>` (`PickerComponent`); por eso
 * este spec interactúa vía DOM en vez de llamar métodos que ya no existen
 * en el wrapper (`onQueryChange`/`select`/`clear`/`query` viven en el picker
 * genérico, no aquí).
 */
describe('CustomerPickerComponent', () => {
  let fixture: ComponentFixture<CustomerPickerComponent>;
  let component: CustomerPickerComponent;

  const OPTIONS: PickerOption[] = [
    { id: 'customer-1', label: 'Juan Perez', description: 'CC 123' },
  ];

  function inputEl(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input')).nativeElement;
  }

  function setQuery(value: string): void {
    const input = inputEl();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('applies B2C/B2B customer defaults and forwards them to the inner picker', () => {
    expect(component.label).toBe('Cliente');
    expect(component.minSearchLength).toBe(2);
    expect(component.allowRawUuid).toBe(true);
    expect(inputEl().placeholder).toBe('Buscar cliente por nombre o documento');
  });

  it('emits query only when the minimum length is reached', () => {
    const querySpy = vi.fn();
    component.queryChange.subscribe(querySpy);

    setQuery('J');
    setQuery('Ju');

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith('Ju');
  });

  it('selects an option and emits its id', () => {
    const valueSpy = vi.fn();
    component.valueChange.subscribe(valueSpy);
    component.options = OPTIONS;
    fixture.detectChanges();

    const optionButton = fixture.debugElement.query(By.css('[role="option"]')).nativeElement as HTMLButtonElement;
    optionButton.click();
    fixture.detectChanges();

    // El picker interno (`PickerComponent`) mantiene su propio estado
    // (`query`/`value`); el wrapper no lo expone. La reflexión de `query`
    // hacia el DOM del `<input>` vía `[ngModel]` unidireccional no se
    // sincroniza de forma síncrona en este entorno de test (jsdom) tras una
    // mutación programática — por eso se verifica el estado del componente
    // interno, no el valor del input, que sí se cubre por interacción real
    // de usuario en el test de "emits query".
    const inner = fixture.debugElement.query(By.directive(PickerComponent)).componentInstance as PickerComponent;
    expect(inner.query).toBe('Juan Perez');
    expect(valueSpy).toHaveBeenCalledWith('customer-1');
  });

  it('accepts raw UUID input when enabled', () => {
    const valueSpy = vi.fn();
    component.valueChange.subscribe(valueSpy);

    setQuery('123e4567-e89b-12d3-a456-426614174000');

    expect(valueSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('clears the selected value', () => {
    const valueSpy = vi.fn();
    component.options = OPTIONS;
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[role="option"]')).nativeElement.click();
    fixture.detectChanges();
    component.valueChange.subscribe(valueSpy);

    const inner = fixture.debugElement.query(By.directive(PickerComponent)).componentInstance as PickerComponent;
    expect(inner.value).toBe('customer-1');

    fixture.debugElement.query(By.css('.pb-picker__clear')).nativeElement.click();
    fixture.detectChanges();

    expect(inner.value).toBeNull();
    expect(inner.query).toBe('');
    expect(valueSpy).toHaveBeenCalledWith(null);
    expect(fixture.debugElement.query(By.css('.pb-picker__clear'))).toBeNull();
  });
});
