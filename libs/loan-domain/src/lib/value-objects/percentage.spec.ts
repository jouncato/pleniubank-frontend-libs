import { describe, expect, it } from 'vitest';
import { formatPercentagePoints, formatRateAsPercentage } from './percentage';

describe('formatRateAsPercentage() — tasa decimal, hace la conversion ×100', () => {
  it('formats a decimal rate as percentage', () => {
    expect(formatRateAsPercentage(0.18)).toBe('18,00 %');
  });

  it('formats a decimal rate with more than 2 significant fraction digits', () => {
    expect(formatRateAsPercentage(0.02755)).toBe('2,755 %');
  });

  it('accepts a numeric string', () => {
    expect(formatRateAsPercentage('0.18')).toBe('18,00 %');
  });

  it('returns the placeholder for null', () => {
    expect(formatRateAsPercentage(null)).toBe('—');
  });

  it('returns the placeholder for undefined', () => {
    expect(formatRateAsPercentage(undefined)).toBe('—');
  });

  it('returns the placeholder for an empty string', () => {
    expect(formatRateAsPercentage('')).toBe('—');
  });

  it('returns the placeholder for a non-numeric string', () => {
    expect(formatRateAsPercentage('abc')).toBe('—');
  });
});

describe('formatPercentagePoints() — el valor ya esta en puntos, NO se multiplica', () => {
  it('formats percentage points as-is', () => {
    expect(formatPercentagePoints(18)).toBe('18,00 %');
  });

  it('formats percentage points with extra precision as-is', () => {
    expect(formatPercentagePoints(2.755)).toBe('2,755 %');
  });

  it('accepts a numeric string', () => {
    expect(formatPercentagePoints('18')).toBe('18,00 %');
  });

  it('returns the placeholder for null', () => {
    expect(formatPercentagePoints(null)).toBe('—');
  });

  it('same input, different unit, deliberately different output (documents why the two functions must never be conflated)', () => {
    const decimalRate = 0.18;
    const asIfItWerePoints = formatPercentagePoints(decimalRate);
    const asRate = formatRateAsPercentage(decimalRate);
    expect(asIfItWerePoints).toBe('0,18 %');
    expect(asRate).toBe('18,00 %');
    expect(asIfItWerePoints).not.toBe(asRate);
  });
});
