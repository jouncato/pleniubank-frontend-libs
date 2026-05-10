import { describe, expect, it } from 'vitest';
import { AmortizationType } from './amortization-type';

describe('AmortizationType', () => {
  it('should have 6 members', () => {
    expect(Object.values(AmortizationType)).toHaveLength(6);
  });

  it('should match backend string values exactly', () => {
    expect(AmortizationType.French).toBe('FRENCH');
    expect(AmortizationType.German).toBe('GERMAN');
    expect(AmortizationType.American).toBe('AMERICAN');
    expect(AmortizationType.Balloon).toBe('BALLOON');
    expect(AmortizationType.InterestOnly).toBe('INTEREST_ONLY');
    expect(AmortizationType.Custom).toBe('CUSTOM');
  });

  it('should contain all expected keys', () => {
    const keys = Object.keys(AmortizationType);
    expect(keys).toContain('French');
    expect(keys).toContain('German');
    expect(keys).toContain('American');
    expect(keys).toContain('Balloon');
    expect(keys).toContain('InterestOnly');
    expect(keys).toContain('Custom');
  });
});
