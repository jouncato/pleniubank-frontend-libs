import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MoneyDisplayComponent } from './money-display.component';

@Component({
  standalone: true,
  imports: [MoneyDisplayComponent],
  template: `<pleniu-money-display [amount]="amount" [currency]="currency" [locale]="locale" />`,
})
class TestHostComponent {
  amount: string | number | null | undefined = '10000000.00';
  currency = 'COP';
  locale = 'es-CO';
}

describe('MoneyDisplayComponent', () => {
  // Ver money.spec.ts (loan-domain): Intl separa símbolo y valor con U+00A0.
  const NBSP = ' ';

  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHostComponent] }));

  it('renders formatted COP amount using Intl', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe(`$${NBSP}10.000.000,00 COP`);
  });

  it('renders without throwing for non-numeric amount (Intl.format(NaN) does not throw)', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = 'invalid';
    expect(() => f.detectChanges()).not.toThrow();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe(`$${NBSP}NaN COP`);
  });

  it('accepts a plain number for amount', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = 1000;
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe(`$${NBSP}1.000,00 COP`);
  });

  it('renders the null placeholder for null, never "$ 0,00"', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = null;
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe('—');
  });

  it('renders the null placeholder for undefined', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = undefined;
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe('—');
  });

  it('renders the null placeholder for an empty string', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = '';
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toBe('—');
  });

  it('title attribute contains raw value', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const span = f.nativeElement.querySelector('.money-display') as HTMLElement;
    expect(span.getAttribute('title')).toContain('10000000.00');
  });

  it('title attribute is the null placeholder when amount is null', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = null;
    f.detectChanges();
    const span = f.nativeElement.querySelector('.money-display') as HTMLElement;
    expect(span.getAttribute('title')).toBe('—');
  });
});
