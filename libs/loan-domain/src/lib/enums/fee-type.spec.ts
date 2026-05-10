import { describe, expect, it } from 'vitest';
import { ChargeFrequency, FeeType } from './fee-type';

describe('FeeType', () => {
  it('should have 7 members', () => {
    expect(Object.values(FeeType)).toHaveLength(7);
  });

  it('should match backend string values exactly', () => {
    expect(FeeType.Origination).toBe('ORIGINATION');
    expect(FeeType.Admin).toBe('ADMIN');
    expect(FeeType.Late).toBe('LATE');
    expect(FeeType.Prepayment).toBe('PREPAYMENT');
    expect(FeeType.Disbursement).toBe('DISBURSEMENT');
    expect(FeeType.Stamp).toBe('STAMP');
    expect(FeeType.Tax).toBe('TAX');
  });
});

describe('ChargeFrequency', () => {
  it('should have 3 members', () => {
    expect(Object.values(ChargeFrequency)).toHaveLength(3);
  });

  it('should match backend string values exactly', () => {
    expect(ChargeFrequency.OneTime).toBe('ONE_TIME');
    expect(ChargeFrequency.Monthly).toBe('MONTHLY');
    expect(ChargeFrequency.PerEvent).toBe('PER_EVENT');
  });
});
