import { describe, expect, it } from 'vitest';
import { LendingProductType, ProductType } from './product-type';

describe('LendingProductType', () => {
  it('should have 6 members', () => {
    expect(Object.values(LendingProductType)).toHaveLength(6);
  });

  it('should match backend string values exactly', () => {
    expect(LendingProductType.PayrollAdvance).toBe('PAYROLL_ADVANCE');
    expect(LendingProductType.PayrollDeduction).toBe('PAYROLL_DEDUCTION');
    expect(LendingProductType.Generic).toBe('GENERIC');
    expect(LendingProductType.Personal).toBe('PERSONAL');
    expect(LendingProductType.Mortgage).toBe('MORTGAGE');
    expect(LendingProductType.InvoiceFinancing).toBe('INVOICE_FINANCING');
  });
});

describe('ProductType alias', () => {
  it('should be an alias for LendingProductType', () => {
    expect(ProductType).toBe(LendingProductType);
  });

  it('should expose the same values as LendingProductType', () => {
    expect(ProductType.PayrollAdvance).toBe(LendingProductType.PayrollAdvance);
    expect(ProductType.Personal).toBe(LendingProductType.Personal);
    expect(ProductType.Mortgage).toBe(LendingProductType.Mortgage);
  });
});
