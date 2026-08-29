const FRONTEND_CURRENCY_FRACTION_DIGITS: Readonly<Record<string, number>> = {
  COP: 2,
  MXN: 2,
};

export function currencyFractionDigits(currency: string, locale = 'es-CO'): number {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Invalid currency: ${currency}`);
  }
  return FRONTEND_CURRENCY_FRACTION_DIGITS[normalized]
    ?? new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalized,
    }).resolvedOptions().maximumFractionDigits
    ?? 2;
}

interface NumericSeparators {
  readonly group: string;
  readonly decimal: string;
}

function numericSeparators(locale: string): NumericSeparators {
  const parts = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).formatToParts(1234567.8);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

function decimalSeparatorFor(currency: string, locale: string): NumericSeparators {
  currencyFractionDigits(currency, locale);
  return numericSeparators(locale);
}

function lastSeparatorIndex(value: string): number {
  return Math.max(value.lastIndexOf(','), value.lastIndexOf('.'));
}

function splitInput(value: string, currency: string, locale: string): { integer: string; fraction?: string; negative: boolean } {
  const { group, decimal } = decimalSeparatorFor(currency, locale);
  const negative = value.includes('-');
  const unsigned = value.replace(/[^0-9,.-]/g, '').replace(/-/g, '');
  const separatorIndex = lastSeparatorIndex(unsigned);
  const separator = separatorIndex >= 0 ? unsigned[separatorIndex] : null;
  const trailingLength = separatorIndex >= 0 ? unsigned.length - separatorIndex - 1 : 0;
  const fractionDigits = currencyFractionDigits(currency, locale);
  let decimalIndex = -1;

  if (separator !== null) {
    const hasBothSeparators = unsigned.includes(',') && unsigned.includes('.');
    if (separator === decimal) {
      decimalIndex = separatorIndex;
    } else if (hasBothSeparators) {
      decimalIndex = trailingLength <= fractionDigits ? separatorIndex : -1;
    } else if (separator === group) {
      const groupCount = unsigned.split(group).length - 1;
      const integerLength = unsigned.slice(0, separatorIndex).replace(/[.,]/g, '').length;
      const looksGrouped = trailingLength === 3 && (groupCount > 1 || integerLength <= 3);
      decimalIndex = looksGrouped ? -1 : trailingLength <= 4 ? separatorIndex : -1;
    } else {
      decimalIndex = trailingLength <= fractionDigits ? separatorIndex : -1;
    }
  }

  const integerPart = (decimalIndex >= 0 ? unsigned.slice(0, decimalIndex) : unsigned).replace(/[.,]/g, '');
  const fractionPart = decimalIndex >= 0 ? unsigned.slice(decimalIndex + 1).replace(/[.,]/g, '') : undefined;
  return {
    integer: integerPart || '0',
    fraction: fractionPart,
    negative,
  };
}

export function normalizeMoneyInput(
  value: string | number | null | undefined,
  currency = 'COP',
  locale = 'es-CO',
): string {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const raw = String(value).trim();
  if (raw === '-') return '-';
  const { integer, fraction, negative } = splitInput(raw, currency, locale);
  const normalizedInteger = integer.replace(/^0+(?=\d)/, '') || '0';
  const sign = negative ? '-' : '';
  return `${sign}${normalizedInteger}${fraction !== undefined ? `.${fraction}` : ''}`;
}

export function isCanonicalMoneyAmountValid(
  value: string | number | null | undefined,
  currency = 'COP',
  locale = 'es-CO',
): boolean {
  const raw = String(value ?? '').trim();
  if (raw === '' || raw === '-') return true;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return false;
  const fraction = raw.split('.')[1];
  return fraction === undefined || fraction.length <= currencyFractionDigits(currency, locale);
}

export function isMoneyInputValid(
  value: string | number | null | undefined,
  currency = 'COP',
  locale = 'es-CO',
): boolean {
  const raw = String(value ?? '').trim();
  if (raw === '' || raw === '-') return true;
  const normalized = normalizeMoneyInput(raw, currency, locale);
  const { group, decimal } = decimalSeparatorFor(currency, locale);
  if (raw.includes(decimal)) {
    const fraction = raw.slice(raw.lastIndexOf(decimal) + 1).replace(/[.,]/g, '');
    return fraction.length <= currencyFractionDigits(currency, locale);
  }
  if (group !== decimal && raw.includes(group)) {
    const groups = raw.replace(/[^0-9.,]/g, '').split(group);
    const groupedInteger = groups.length > 1 && groups.slice(1).every((part) => part.length === 3);
    if (groupedInteger) return true;
  }
  return isCanonicalMoneyAmountValid(normalized, currency, locale);
}

function groupInteger(integer: string, separator: string): string {
  let result = '';
  for (let index = integer.length; index > 0; index -= 3) {
    const start = Math.max(0, index - 3);
    const group = integer.slice(start, index);
    result = result ? `${group}${separator}${result}` : group;
  }
  return result;
}

export function formatMoneyInput(
  value: string | number | null | undefined,
  currency = 'COP',
  locale = 'es-CO',
): string {
  const normalized = normalizeMoneyInput(value, currency, locale);
  if (!normalized || normalized === '-') return normalized;
  if (!isCanonicalMoneyAmountValid(normalized, currency, locale)) return String(value ?? '');
  const { group, decimal } = decimalSeparatorFor(currency, locale);
  const digits = currencyFractionDigits(currency, locale);
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [integer, fraction = ''] = unsigned.split('.');
  return `${negative ? '-' : ''}${groupInteger(integer, group)}${decimal}${fraction.padEnd(digits, '0')}`;
}

export function moneyInputToNumberString(
  value: string | number | null | undefined,
  currency = 'COP',
  locale = 'es-CO',
): string | null {
  const normalized = normalizeMoneyInput(value, currency, locale);
  if (
    normalized === ''
    || normalized === '-'
    || !isCanonicalMoneyAmountValid(normalized, currency, locale)
  ) {
    return null;
  }
  return normalized;
}
