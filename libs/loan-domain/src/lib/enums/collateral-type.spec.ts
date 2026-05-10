import { describe, expect, it } from 'vitest';
import { CollateralPerfectionStatus, CollateralType } from './collateral-type';

describe('CollateralType', () => {
  it('should have 7 members', () => {
    expect(Object.values(CollateralType)).toHaveLength(7);
  });

  it('should match backend string values exactly', () => {
    expect(CollateralType.PayrollAssignment).toBe('PAYROLL_ASSIGNMENT');
    expect(CollateralType.Invoice).toBe('INVOICE');
    expect(CollateralType.Vehicle).toBe('VEHICLE');
    expect(CollateralType.RealEstate).toBe('REAL_ESTATE');
    expect(CollateralType.GuaranteeLetter).toBe('GUARANTEE_LETTER');
    expect(CollateralType.Deposit).toBe('DEPOSIT');
    expect(CollateralType.Other).toBe('OTHER');
  });
});

describe('CollateralPerfectionStatus', () => {
  it('should have 4 members', () => {
    expect(Object.values(CollateralPerfectionStatus)).toHaveLength(4);
  });

  it('should match backend string values exactly', () => {
    expect(CollateralPerfectionStatus.Pending).toBe('PENDING');
    expect(CollateralPerfectionStatus.Perfected).toBe('PERFECTED');
    expect(CollateralPerfectionStatus.Released).toBe('RELEASED');
    expect(CollateralPerfectionStatus.Invalid).toBe('INVALID');
  });
});
