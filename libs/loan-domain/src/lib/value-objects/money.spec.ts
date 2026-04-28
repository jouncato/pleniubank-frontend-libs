import { describe, expect, it } from 'vitest';
import { formatMoney, money } from './money';

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
  it('should format with es-CO locale', () => {
    const m = money('10000000', 'COP');
    const formatted = formatMoney(m, 'es-CO');
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
    expect(formatted).toContain('000');
  });

  it('should format with en-US locale', () => {
    const m = money('1500.50', 'USD');
    const formatted = formatMoney(m, 'en-US');
    expect(formatted).toContain('1,500.50');
  });

  it('should default to es-CO locale', () => {
    const m = money('1000', 'COP');
    const defaultFormatted = formatMoney(m);
    const explicitFormatted = formatMoney(m, 'es-CO');
    expect(defaultFormatted).toBe(explicitFormatted);
  });
});
