export interface Money {
  readonly amount: string;
  readonly currency: string;
}

export function money(amount: string | number, currency: string): Money {
  const a = typeof amount === 'number' ? amount.toFixed(2) : amount;
  if (!/^\d+(\.\d{1,4})?$/.test(a)) throw new Error(`Invalid amount: ${amount}`);
  if (currency.length !== 3) throw new Error(`Invalid currency: ${currency}`);
  return { amount: a, currency: currency.toUpperCase() };
}

export function formatMoney(m: Money, locale = 'es-CO'): string {
  const currency = m.currency.toUpperCase();
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(m.amount));
  return `${formatted} ${currency}`;
}
