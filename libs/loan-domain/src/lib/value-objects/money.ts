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

export interface FormatMoneyOptions {
  /** 'suffix' (default): agrega el código ISO al final, salvo que Intl ya lo
   * use como símbolo (p.ej. MXN en es-CO, que emite "MXN 100,00" sin signo
   * propio — agregar el sufijo ahí lo duplicaría). 'none': nunca agrega el
   * código. */
  codeDisplay?: 'suffix' | 'none';
  /** 'sign' (default): signo menos nativo de Intl. 'parentheses': envuelve
   * en paréntesis contables y omite el signo (convención de libro mayor). */
  negativeStyle?: 'sign' | 'parentheses';
}

export function formatMoney(m: Money, locale = 'es-CO', options: FormatMoneyOptions = {}): string {
  const { codeDisplay = 'suffix', negativeStyle = 'sign' } = options;
  const currency = m.currency.toUpperCase();
  const value = Number(m.amount);
  const isNegative = value < 0;
  const magnitude = negativeStyle === 'parentheses' ? Math.abs(value) : value;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(magnitude);
  const currencyPart = formatter.formatToParts(magnitude).find((p) => p.type === 'currency')?.value ?? '';
  const alreadyShowsCode = currencyPart.toUpperCase() === currency;
  const withCode = codeDisplay === 'suffix' && !alreadyShowsCode ? `${formatted} ${currency}` : formatted;
  return negativeStyle === 'parentheses' && isNegative ? `(${withCode})` : withCode;
}
