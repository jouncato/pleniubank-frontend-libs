import { describe, expect, it } from 'vitest';
import { DayCountConvention } from './day-count-convention';

describe('DayCountConvention', () => {
  it('should have 3 members', () => {
    expect(Object.values(DayCountConvention)).toHaveLength(3);
  });

  it('should match backend string values exactly', () => {
    expect(DayCountConvention.Thirty360).toBe('30/360');
    expect(DayCountConvention.Act360).toBe('ACT/360');
    expect(DayCountConvention.Act365).toBe('ACT/365');
  });
});
