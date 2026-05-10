import { describe, expect, it } from 'vitest';
import { FeeCalculationBasis } from './fee-calculation-basis';

describe('FeeCalculationBasis', () => {
  it('should have 4 members', () => {
    expect(Object.values(FeeCalculationBasis)).toHaveLength(4);
  });

  it('should match backend string values exactly', () => {
    expect(FeeCalculationBasis.Fixed).toBe('FIXED');
    expect(FeeCalculationBasis.PercentagePrincipal).toBe('PERCENTAGE_PRINCIPAL');
    expect(FeeCalculationBasis.PercentageOutstanding).toBe('PERCENTAGE_OUTSTANDING');
    expect(FeeCalculationBasis.PercentagePayment).toBe('PERCENTAGE_PAYMENT');
  });
});
