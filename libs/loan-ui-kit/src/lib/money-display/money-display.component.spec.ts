import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MoneyDisplayComponent } from './money-display.component';

@Component({
  standalone: true,
  imports: [MoneyDisplayComponent],
  template: `<pleniu-money-display [amount]="amount" [currency]="currency" [locale]="locale" />`,
})
class TestHostComponent {
  amount = '10000000.00';
  currency = 'COP';
  locale = 'es-CO';
}

describe('MoneyDisplayComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHostComponent] }));

  it('renders formatted COP amount using Intl', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text).toContain('10');
    expect(text).toContain('000');
  });

  it('renders without throwing for non-numeric amount', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.amount = 'invalid';
    expect(() => f.detectChanges()).not.toThrow();
    const text = (f.nativeElement.querySelector('.money-display') as HTMLElement).textContent ?? '';
    expect(text.length).toBeGreaterThan(0);
  });

  it('title attribute contains raw value', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const span = f.nativeElement.querySelector('.money-display') as HTMLElement;
    expect(span.getAttribute('title')).toContain('10000000.00');
  });
});
