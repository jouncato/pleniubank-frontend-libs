import { describe, expect, it } from 'vitest';
import { formatMoney, money, type Money } from './money';

describe('money()', () => {
  it('should create Money from string amount', () => {
    const m = money('10000000.00', 'COP');
    expect(m.amount).toBe('10000000.00');
    expect(m.currency).toBe('COP');
  });

  it('should create Money from number amount', () => {
    const m = money(5000, 'USD');
    expect(m.amount).toBe('5000.00');
    expect(m.currency).toBe('USD');
  });

  it('should uppercase currency', () => {
    const m = money('100', 'cop');
    expect(m.currency).toBe('COP');
  });

  it('should accept up to 4 decimal places', () => {
    const m = money('100.1234', 'COP');
    expect(m.amount).toBe('100.1234');
  });

  it('should reject non-numeric amount string', () => {
    expect(() => money('abc', 'COP')).toThrow('Invalid amount');
  });

  it('should reject negative amount string', () => {
    expect(() => money('-100', 'COP')).toThrow('Invalid amount');
  });

  it('should reject amount with more than 4 decimals', () => {
    expect(() => money('100.12345', 'COP')).toThrow('Invalid amount');
  });

  it('should reject empty amount string', () => {
    expect(() => money('', 'COP')).toThrow('Invalid amount');
  });

  it('should reject currency with wrong length', () => {
    expect(() => money('100', 'US')).toThrow('Invalid currency');
    expect(() => money('100', 'USDX')).toThrow('Invalid currency');
  });

  it('should accept integer string without decimals', () => {
    const m = money('100', 'MXN');
    expect(m.amount).toBe('100');
  });
});

describe('formatMoney()', () => {
  // Intl inserta un espacio de no separación (U+00A0) entre el símbolo y el
  // valor — usar un espacio normal aquí haría fallar la igualdad exacta.
  const NBSP = ' ';

  it('should format with es-CO locale', () => {
    const m = money('10000000', 'COP');
    expect(formatMoney(m, 'es-CO')).toBe(`$${NBSP}10.000.000,00 COP`);
  });

  it('should format with en-US locale', () => {
    const m = money('1500.50', 'USD');
    expect(formatMoney(m, 'en-US')).toBe('$1,500.50 USD');
  });

  it('should default to es-CO locale', () => {
    const m = money('1000', 'COP');
    const defaultFormatted = formatMoney(m);
    const explicitFormatted = formatMoney(m, 'es-CO');
    expect(defaultFormatted).toBe(explicitFormatted);
    expect(defaultFormatted).toBe(`$${NBSP}1.000,00 COP`);
  });

  it('should not duplicate the currency code for MXN (bug fix: Intl already emits it as the symbol)', () => {
    const m = money('100', 'MXN');
    expect(formatMoney(m, 'es-CO')).toBe(`MXN${NBSP}100,00`);
  });

  it('should omit the currency code with codeDisplay: none', () => {
    const m = money('10000000', 'COP');
    expect(formatMoney(m, 'es-CO', { codeDisplay: 'none' })).toBe(`$${NBSP}10.000.000,00`);
  });

  it('codeDisplay: none should not affect MXN either (already had no suffix to omit)', () => {
    const m = money('100', 'MXN');
    expect(formatMoney(m, 'es-CO', { codeDisplay: 'none' })).toBe(`MXN${NBSP}100,00`);
  });

  it('should render accounting parentheses for negative amounts with negativeStyle: parentheses', () => {
    const negative: Money = { amount: '-1500000', currency: 'COP' };
    expect(formatMoney(negative, 'es-CO', { negativeStyle: 'parentheses' })).toBe(
      `($${NBSP}1.500.000,00 COP)`,
    );
  });

  it('should keep the native minus sign by default (negativeStyle: sign)', () => {
    const negative: Money = { amount: '-1500000', currency: 'COP' };
    expect(formatMoney(negative, 'es-CO')).toBe(`-$${NBSP}1.500.000,00 COP`);
  });
});
