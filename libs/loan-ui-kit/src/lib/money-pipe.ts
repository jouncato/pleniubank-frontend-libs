import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney } from '@pleniu/loan-domain';

@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  transform(
    amount: string | number | null | undefined,
    currency = 'COP',
    locale = 'es-CO',
  ): string {
    if (amount === null || amount === undefined || amount === '') return '—';
    try {
      return formatMoney({ amount: String(amount), currency }, locale);
    } catch {
      return `${amount} ${currency}`;
    }
  }
}
