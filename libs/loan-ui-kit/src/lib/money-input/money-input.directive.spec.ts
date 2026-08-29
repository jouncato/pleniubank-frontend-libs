import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MoneyInputDirective } from './money-input.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MoneyInputDirective],
  template: `
    <input
      moneyInput
      [moneyCurrency]="currency"
      [moneyLocale]="locale"
      [formControl]="control"
    />
  `,
})
class TestHostComponent {
  readonly control = new FormControl('');
  currency = 'COP';
  locale = 'es-CO';
}

describe('MoneyInputDirective', () => {
  function setup(
    currency = 'COP',
    locale = 'es-CO',
    value = '',
  ): { fixture: ComponentFixture<TestHostComponent>; host: HTMLInputElement } {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.currency = currency;
    fixture.componentInstance.locale = locale;
    fixture.componentInstance.control.setValue(value, { emitEvent: false });
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement.querySelector('input') as HTMLInputElement };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
  });

  it('formats Colombian integers and emits a canonical value', () => {
    const { host, fixture } = setup();

    host.value = '1234567';
    host.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('1.234.567,00');
    expect(fixture.componentInstance.control.value).toBe('1234567');
  });

  it('accepts Colombian cents without grouping in the model', () => {
    const { host, fixture } = setup();

    host.value = '1.234.567,89';
    host.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('1.234.567,89');
    expect(fixture.componentInstance.control.value).toBe('1234567.89');
  });

  it('uses the Mexico locale for an MXN control', () => {
    const { host } = setup('MXN', 'es-MX', '1234567.89');

    expect(host.value).toBe('1,234,567.89');
  });

  it('reports precision errors without truncating user input', () => {
    const { host, fixture } = setup();

    host.value = '1,234';
    host.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('1,234');
    expect(fixture.componentInstance.control.value).toBe('1.234');
    expect(fixture.componentInstance.control.errors?.['moneyPrecision']).toBe(true);
  });

  it('clears to an empty model value', () => {
    const { host, fixture } = setup();

    host.value = '';
    host.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('');
    expect(fixture.componentInstance.control.value).toBe('');
  });
});
