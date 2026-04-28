import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMoney } from '@pleniu/loan-domain';

@Component({
  selector: 'pleniu-money-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="money-display" [attr.title]="raw()">{{ formatted() }}</span>`,
  styles: `
    .money-display {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  `,
})
export class MoneyDisplayComponent {
  readonly amount = input.required<string>();
  readonly currency = input<string>('COP');
  readonly locale = input<string>('es-CO');

  readonly raw = computed(() => `${this.amount()} ${this.currency()}`);

  readonly formatted = computed(() => {
    try {
      return formatMoney({ amount: this.amount(), currency: this.currency() }, this.locale());
    } catch {
      return `${this.amount()} ${this.currency()}`;
    }
  });
}
