import {
  extractActiveSubEnterpriseIds,
  isPayrollAdvanceAmountCoherent,
} from './payroll-advance-master-contract-assignment.util';

describe('isPayrollAdvanceAmountCoherent', () => {
  it('is coherent when employeeAmount <= limit', () => {
    expect(isPayrollAdvanceAmountCoherent(1000, 500)).toBe(true);
    expect(isPayrollAdvanceAmountCoherent(1000, 1000)).toBe(true);
  });

  it('is not coherent when employeeAmount > limit', () => {
    expect(isPayrollAdvanceAmountCoherent(1000, 1001)).toBe(false);
  });

  it('treats null/undefined on either side as coherent (not yet defined)', () => {
    expect(isPayrollAdvanceAmountCoherent(null, 500)).toBe(true);
    expect(isPayrollAdvanceAmountCoherent(1000, null)).toBe(true);
    expect(isPayrollAdvanceAmountCoherent(undefined, undefined)).toBe(true);
  });
});

describe('extractActiveSubEnterpriseIds', () => {
  it('returns only sub_enterprise_id of ACTIVE assignments', () => {
    const result = extractActiveSubEnterpriseIds([
      { sub_enterprise_id: 'a', status: 'ACTIVE' },
      { sub_enterprise_id: 'b', status: 'REVOKED' },
      { sub_enterprise_id: 'c', status: 'ACTIVE' },
    ]);
    expect(result).toEqual(new Set(['a', 'c']));
  });

  it('returns an empty set when there are no active assignments', () => {
    expect(extractActiveSubEnterpriseIds([{ sub_enterprise_id: 'a', status: 'REVOKED' }])).toEqual(
      new Set(),
    );
  });

  it('returns an empty set for an empty list', () => {
    expect(extractActiveSubEnterpriseIds([])).toEqual(new Set());
  });
});
