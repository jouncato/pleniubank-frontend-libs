import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMoney } from '@pleniu/loan-domain';

const NULL_PLACEHOLDER = '—';

@Component({
  selector: 'pleniu-money-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="money-display" [attr.title]="raw()">{{ formatted() }}</span>`,
  styles: `
    :host-context(td) {
      display: block;
      text-align: right;
    }

    .money-display {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      text-align: right;
      white-space: nowrap;
    }
  `,
})
export class MoneyDisplayComponent {
  readonly amount = input.required<string | number | null | undefined>();
  readonly currency = input<string>('COP');
  readonly locale = input<string>('es-CO');

  // Mismo criterio que AmountPipe (customer-portal): null/undefined/'' → '—',
  // nunca Number(...) → 0 → "$ 0,00" real.
  private readonly hasValue = computed(() => {
    const value = this.amount();
    return value !== null && value !== undefined && value !== '';
  });

  readonly raw = computed(() =>
    this.hasValue() ? `${this.amount()} ${this.currency()}` : NULL_PLACEHOLDER,
  );

  readonly formatted = computed(() => {
    if (!this.hasValue()) {
      return NULL_PLACEHOLDER;
    }
    try {
      return formatMoney({ amount: String(this.amount()), currency: this.currency() }, this.locale());
    } catch {
      return `${this.amount()} ${this.currency()}`;
    }
  });
}
