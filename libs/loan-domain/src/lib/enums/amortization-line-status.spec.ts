import { describe, expect, it } from 'vitest';
import { AmortizationLineStatus } from './amortization-line-status';

describe('AmortizationLineStatus', () => {
  it('should have 5 members', () => {
    expect(Object.values(AmortizationLineStatus)).toHaveLength(5);
  });

  it('should match backend string values exactly', () => {
    expect(AmortizationLineStatus.Pending).toBe('PENDING');
    expect(AmortizationLineStatus.Partial).toBe('PARTIAL');
    expect(AmortizationLineStatus.Paid).toBe('PAID');
    expect(AmortizationLineStatus.Overdue).toBe('OVERDUE');
    expect(AmortizationLineStatus.Cancelled).toBe('CANCELLED');
  });

  it('should contain all expected keys', () => {
    const keys = Object.keys(AmortizationLineStatus);
    expect(keys).toContain('Pending');
    expect(keys).toContain('Partial');
    expect(keys).toContain('Paid');
    expect(keys).toContain('Overdue');
    expect(keys).toContain('Cancelled');
  });
});
