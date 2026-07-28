import {
  PAYROLL_ADVANCE_MANUAL_REVIEW_REASON_CODES,
  PAYROLL_ADVANCE_POLICY_DECISION_TYPES,
  PAYROLL_ADVANCE_POLICY_REASON_CODES,
  PAYROLL_ADVANCE_UNAVAILABLE_REASON_CODES,
  type PayrollAdvanceEffectivePolicy,
  type PayrollAdvanceEligibilityResponse,
  type PayrollAdvancePolicyDecision,
} from './payroll-advance-policy.models';

describe('payroll-advance-policy.models', () => {
  it('expone los 4 tipos de decisión canónicos', () => {
    expect(PAYROLL_ADVANCE_POLICY_DECISION_TYPES).toEqual([
      'APPROVED',
      'REJECTED',
      'MANUAL_REVIEW',
      'UNAVAILABLE',
    ]);
  });

  it('expone los 28 reason_codes espejo del enum Python PayrollAdvancePolicyReasonCode', () => {
    // OpenSpec reconcile-risk-engines-aggregator-co: +1
    // (PAYROLL_ADVANCE_RISK_ENGINE_DISAGREEMENT) sobre los 27 anteriores.
    expect(PAYROLL_ADVANCE_POLICY_REASON_CODES).toHaveLength(28);
    // Sin duplicados.
    expect(new Set(PAYROLL_ADVANCE_POLICY_REASON_CODES).size).toBe(28);
  });

  it('MANUAL_REVIEW y UNAVAILABLE reason_codes son subconjuntos de la lista completa y no se solapan', () => {
    const all = new Set(PAYROLL_ADVANCE_POLICY_REASON_CODES);
    for (const code of PAYROLL_ADVANCE_MANUAL_REVIEW_REASON_CODES) {
      expect(all.has(code)).toBe(true);
    }
    for (const code of PAYROLL_ADVANCE_UNAVAILABLE_REASON_CODES) {
      expect(all.has(code)).toBe(true);
    }
    const manualSet = new Set(PAYROLL_ADVANCE_MANUAL_REVIEW_REASON_CODES);
    const overlap = PAYROLL_ADVANCE_UNAVAILABLE_REASON_CODES.filter((c) => manualSet.has(c));
    expect(overlap).toEqual([]);
  });

  it('un fixture completo de PayrollAdvanceEffectivePolicy/Decision/EligibilityResponse compila y conserva snake_case', () => {
    const policy: PayrollAdvanceEffectivePolicy = {
      policy_version: 'pa-policy-abc123',
      country_code: 'CO',
      product_type: 'PAYROLL_ADVANCE',
      currency: 'COP',
      employer_id: 'employer-1',
      evaluated_at: '2026-07-18T10:00:00Z',
      effective_from: '2026-07-17T00:00:00Z',
      effective_to: null,
      global_values: {
        max_salary_percentage: 0.3,
        min_salary_percentage: 0.05,
        min_tenure_months: 6,
        max_monthly_frequency: 2,
        max_active_count: 2,
        max_discount_days: 45,
        employer_daily_limit_amount: 50000000,
      },
      employer_overrides: null,
      effective_values: {
        max_salary_percentage: 0.3,
        min_salary_percentage: 0.05,
        min_tenure_months: 6,
        max_monthly_frequency: 2,
        max_active_count: 2,
        max_discount_days: 45,
        employer_daily_limit_amount: 50000000,
      },
      sources: { max_salary_percentage: 'GLOBAL' },
      source_value_ids: ['val-1'],
    };

    const decision: PayrollAdvancePolicyDecision = {
      decision: 'APPROVED',
      reason_codes: [],
      policy,
      evaluated_at: '2026-07-18T10:00:00Z',
      correlation_id: null,
      effective_max_amount: 600000,
      effective_min_amount: 40000,
      monthly_disbursed_count: 0,
      max_monthly_frequency: 2,
      remaining_monthly_quota: 2,
      has_active_advance: false,
      tenure_months: 8,
      min_tenure_months: 6,
      provisional: false,
      is_final: true,
      observed: {},
    };

    const eligibility: PayrollAdvanceEligibilityResponse = {
      customer_id: 'cust-1',
      employer_id: 'employer-1',
      decision,
      unavailable_reason: null,
    };

    expect(eligibility.decision?.decision).toBe('APPROVED');
    expect(eligibility.decision?.policy.effective_values.max_salary_percentage).toBe(0.3);
  });
});
