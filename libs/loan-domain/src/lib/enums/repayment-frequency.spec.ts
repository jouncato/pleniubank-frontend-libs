import { describe, expect, it } from 'vitest';
import { RepaymentFrequency } from './repayment-frequency';

describe('RepaymentFrequency', () => {
  it('should have 4 members', () => {
    expect(Object.values(RepaymentFrequency)).toHaveLength(4);
  });

  it('should match backend string values exactly', () => {
    expect(RepaymentFrequency.Monthly).toBe('MONTHLY');
    expect(RepaymentFrequency.Biweekly).toBe('BIWEEKLY');
    expect(RepaymentFrequency.Weekly).toBe('WEEKLY');
    expect(RepaymentFrequency.Bullet).toBe('BULLET');
  });
});
