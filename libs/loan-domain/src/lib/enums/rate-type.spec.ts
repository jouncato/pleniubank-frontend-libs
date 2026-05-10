import { describe, expect, it } from 'vitest';
import { RateType } from './rate-type';

describe('RateType', () => {
  it('should have 3 members', () => {
    expect(Object.values(RateType)).toHaveLength(3);
  });

  it('should match backend string values exactly', () => {
    expect(RateType.Fixed).toBe('FIXED');
    expect(RateType.Variable).toBe('VARIABLE');
    expect(RateType.Compound).toBe('COMPOUND');
  });
});
