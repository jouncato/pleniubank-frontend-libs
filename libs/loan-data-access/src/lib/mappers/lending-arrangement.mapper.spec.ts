import { DayCountConvention, LendingStatus, ProductType, RateType, RepaymentFrequency } from '@pleniu/loan-domain';
import { toDomain, toCreateRequest } from './lending-arrangement.mapper';
import type { LendingArrangementResponse } from '../dtos/lending-arrangement.dto';

const mockDto: LendingArrangementResponse = {
  arrangement_id: 'ARR-001',
  version: 2,
  product_id: 'PROD-X',
  product_type: ProductType.PayrollDeduction,
  customer_id: 'CUST-99',
  jurisdiction: 'CO',
  currency: 'COP',
  principal_amount: '5000000.00',
  nominal_rate: 0.18,
  rate_type: RateType.Fixed,
  day_count_convention: DayCountConvention.Act360,
  repayment_frequency: RepaymentFrequency.Monthly,
  term_months: 24,
  effective_date: '2025-03-01',
  maturity_date: '2027-03-01',
  status: LendingStatus.Active,
  status_reason: 'disbursed',
  extension_data: { channel: 'WEB' },
  party_roles: [],
  created_at: '2025-03-01T10:00:00Z',
  created_by: 'admin',
  updated_at: '2025-03-02T10:00:00Z',
  updated_by: 'admin',
  correlation_id: 'corr-1',
};

describe('toDomain()', () => {
  it('maps arrangement_id → arrangementId', () => {
    expect(toDomain(mockDto).arrangementId).toBe('ARR-001');
  });

  it('maps product_type → productType enum', () => {
    expect(toDomain(mockDto).productType).toBe(ProductType.PayrollDeduction);
  });

  it('maps principal_amount + currency → Money', () => {
    const m = toDomain(mockDto).principal;
    expect(m.amount).toBe('5000000.00');
    expect(m.currency).toBe('COP');
  });

  it('maps status → LendingStatus enum', () => {
    expect(toDomain(mockDto).status).toBe(LendingStatus.Active);
  });

  it('maps optional fields correctly', () => {
    const d = toDomain(mockDto);
    expect(d.nominalRate).toBe(0.18);
    expect(d.termMonths).toBe(24);
    expect(d.maturityDate).toBe('2027-03-01');
    expect(d.correlationId).toBe('corr-1');
    expect(d.updatedBy).toBe('admin');
  });

  it('maps undefined optional fields as undefined', () => {
    const dto = { ...mockDto, nominal_rate: undefined, term_months: undefined };
    const d = toDomain(dto);
    expect(d.nominalRate).toBeUndefined();
    expect(d.termMonths).toBeUndefined();
  });
});

describe('toCreateRequest()', () => {
  it('converts camelCase payload to snake_case request', () => {
    const req = toCreateRequest({
      productType: ProductType.Personal,
      productId: 'PROD-P',
      customerId: 'CUST-1',
      jurisdiction: 'CO',
      currency: 'COP',
      principal: { amount: '2000000.00', currency: 'COP' },
      rateType: RateType.Fixed,
      dayCountConvention: DayCountConvention.Act360,
      repaymentFrequency: RepaymentFrequency.Monthly,
      effectiveDate: '2025-06-01',
    });
    expect(req.product_type).toBe(ProductType.Personal);
    expect(req.customer_id).toBe('CUST-1');
    expect(req.principal_amount).toBe('2000000.00');
    expect(req.effective_date).toBe('2025-06-01');
  });
});
