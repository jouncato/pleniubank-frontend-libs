import type { ApiEnvelope } from '@pleniu/shared-http';
import type {
  PayrollAdvanceEffectivePolicy,
  PayrollAdvanceEligibilityResponse,
  PayrollAdvanceManualReviewAcceptedResponse,
  PayrollAdvancePolicyDecision,
} from '@pleniu/core-domain';

import type { PayrollAdvanceAlertDto } from './core-payroll-advance-alerts-api.service';
import type { PayrollAdvanceManualReviewCaseDto } from './core-payroll-advance-manual-review-api.service';
import { payrollAdvancePolicyPrimaryReasonLabel } from './payroll-advance-policy-labels';

/**
 * Contract tests (OpenSpec centralize-payroll-advance-policy-co, fase 8,
 * tarea 8.6).
 *
 * Los fixtures de este archivo NO son datos inventados: replican, campo por
 * campo, los schemas Pydantic reales de Core:
 *   - `PayrollAdvanceEffectivePolicySchema`/`PayrollAdvancePolicyDecisionSchema`/
 *     `PayrollAdvanceEligibilityResponse` — `src/api/v1/schemas/
 *     payroll_advance_policy_schemas.py`
 *   - `PayrollAdvanceManualReviewResponse` — idem
 *   - `_serialize_alert()` — `src/api/v1/routers/payroll_advance_alerts_router.py`
 *   - `_serialize_case()` — `src/api/v1/routers/
 *     payroll_advance_manual_review_router.py`
 *
 * Si Core cambia un nombre de campo, este archivo deja de compilar (los
 * fixtures están tipados contra los tipos compartidos de `@pleniu/core-domain`
 * y de los clientes de esta lib) — es la señal de que el contrato se rompió.
 */
describe('payroll-advance-policy contract (fixtures espejo de Core)', () => {
  it('GET /payroll-advances/eligibility — decisión APPROVED', () => {
    const effectivePolicy: PayrollAdvanceEffectivePolicy = {
      policy_version: 'pa-policy-9f8e7d6c5b4a3210',
      country_code: 'CO',
      product_type: 'PAYROLL_ADVANCE',
      currency: 'COP',
      employer_id: '11111111-1111-1111-1111-111111111111',
      evaluated_at: '2026-07-18T15:04:00+00:00',
      effective_from: '2026-07-17T00:00:00+00:00',
      effective_to: null,
      global_values: {
        max_salary_percentage: 0.3,
        min_amount: 50000,
        min_tenure_months: 6,
        max_monthly_frequency: 2,
        max_active_count: 2,
        max_discount_days: 45,
        employer_daily_limit_amount: 50000000,
      },
      employer_overrides: {
        config_id: '22222222-2222-2222-2222-222222222222',
        employer_id: '11111111-1111-1111-1111-111111111111',
        country_code: 'CO',
        currency: 'COP',
        max_salary_percentage: 0.25,
        min_tenure_months: null,
        max_monthly_frequency: null,
        max_active_count: 2,
        max_discount_days: null,
        employer_daily_limit_amount: null,
        terms_version: 'v3',
        effective_from: '2026-06-01T00:00:00+00:00',
        effective_to: null,
      },
      effective_values: {
        max_salary_percentage: 0.25,
        min_amount: 50000,
        min_tenure_months: 6,
        max_monthly_frequency: 2,
        max_active_count: 2,
        max_discount_days: 45,
        employer_daily_limit_amount: 50000000,
      },
      sources: {
        max_salary_percentage: 'EMPLOYER',
        min_amount: 'GLOBAL',
        min_tenure_months: 'GLOBAL',
        max_monthly_frequency: 'GLOBAL',
        max_active_count: 'GLOBAL',
        max_discount_days: 'GLOBAL',
        employer_daily_limit_amount: 'GLOBAL',
      },
      source_value_ids: ['val-100', 'val-101', 'val-102'],
    };

    const decision: PayrollAdvancePolicyDecision = {
      decision: 'APPROVED',
      reason_codes: [],
      policy: effectivePolicy,
      evaluated_at: '2026-07-18T15:04:00+00:00',
      correlation_id: '33333333-3333-3333-3333-333333333333',
      effective_max_amount: 375000,
      monthly_disbursed_count: 1,
      max_monthly_frequency: 2,
      remaining_monthly_quota: 1,
      has_active_advance: false,
      tenure_months: 9,
      min_tenure_months: 6,
      provisional: false,
      is_final: true,
      observed: {
        effective_max_amount: '375000',
        monthly_disbursed_count: 1,
        has_active_advance: false,
        tenure_months: 9,
        rules_engine_source: 'RULES_ENGINE',
      },
    };

    const envelope: ApiEnvelope<PayrollAdvanceEligibilityResponse> = {
      data: {
        customer_id: '44444444-4444-4444-4444-444444444444',
        employer_id: '11111111-1111-1111-1111-111111111111',
        decision,
        unavailable_reason: null,
      },
    };

    expect(envelope.data.decision?.decision).toBe('APPROVED');
    expect(envelope.data.decision?.reason_codes).toEqual([]);
    expect(envelope.data.decision?.policy.effective_values.max_salary_percentage).toBe(0.25);
    expect(envelope.data.decision?.policy.sources['max_salary_percentage']).toBe('EMPLOYER');
    // El snapshot NUNCA expone salario crudo (design.md Decision 1, tarea 2.1).
    expect(JSON.stringify(envelope.data)).not.toContain('salary_amount');
  });

  it('GET /payroll-advances/eligibility — decisión REJECTED con reason_codes y label accionable', () => {
    const decisionReasonCodes = [
      'PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED',
      'PAYROLL_ADVANCE_MIN_TENURE_NOT_MET',
    ];

    const label = payrollAdvancePolicyPrimaryReasonLabel(decisionReasonCodes, 'REJECTED');
    expect(label).toBe('El monto solicitado supera el porcentaje máximo permitido del salario verificado.');
  });

  it('GET /payroll-advances/eligibility — política ni siquiera resoluble (decision=null, unavailable_reason)', () => {
    const envelope: ApiEnvelope<PayrollAdvanceEligibilityResponse> = {
      data: {
        customer_id: '44444444-4444-4444-4444-444444444444',
        employer_id: null,
        decision: null,
        unavailable_reason: 'PAYROLL_ADVANCE_EMPLOYMENT_PROFILE_NOT_VERIFIED',
      },
    };

    expect(envelope.data.decision).toBeNull();
    expect(envelope.data.unavailable_reason).toBe('PAYROLL_ADVANCE_EMPLOYMENT_PROFILE_NOT_VERIFIED');
  });

  it('POST /payroll-advances — 202 MANUAL_REVIEW (envelope de éxito, no de error)', () => {
    const envelope: ApiEnvelope<PayrollAdvanceManualReviewAcceptedResponse> = {
      data: {
        customer_id: '44444444-4444-4444-4444-444444444444',
        employer_id: '11111111-1111-1111-1111-111111111111',
        decision: 'MANUAL_REVIEW',
        reason_codes: ['PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW'],
        message:
          'La solicitud excede el límite diario agregado de la empresa y requiere revisión manual.',
        case_id: '55555555-5555-5555-5555-555555555555',
      },
    };

    expect(envelope.data.decision).toBe('MANUAL_REVIEW');
    expect(envelope.data.case_id).not.toBeNull();
  });

  it('GET /payroll-advance-alerts — fixture espejo de _serialize_alert()', () => {
    const alert: PayrollAdvanceAlertDto = {
      id: '66666666-6666-6666-6666-666666666666',
      alert_type: 'PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_EXCEEDED',
      severity: 'WARNING',
      status: 'OPEN',
      customer_id: '44444444-4444-4444-4444-444444444444',
      employer_id: '11111111-1111-1111-1111-111111111111',
      advance_id: null,
      manual_review_case_id: '55555555-5555-5555-5555-555555555555',
      actor: 'system',
      observed_values: { daily_total: '52000000' },
      thresholds: { employer_daily_limit_amount: '50000000' },
      policy_version: 'pa-policy-9f8e7d6c5b4a3210',
      correlation_id: '33333333-3333-3333-3333-333333333333',
      created_at: '2026-07-18T15:04:00+00:00',
      updated_at: '2026-07-18T15:04:00+00:00',
    };

    const envelope: ApiEnvelope<PayrollAdvanceAlertDto[]> = { data: [alert] };
    expect(envelope.data[0].alert_type).toBe('PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_EXCEEDED');
  });

  it('GET /payroll-advance-manual-review-cases/:id — fixture espejo de _serialize_case()', () => {
    const manualCase: PayrollAdvanceManualReviewCaseDto = {
      id: '55555555-5555-5555-5555-555555555555',
      customer_id: '44444444-4444-4444-4444-444444444444',
      employer_id: '11111111-1111-1111-1111-111111111111',
      requested_amount: '600000',
      denomination: 'COP',
      policy_version: 'pa-policy-9f8e7d6c5b4a3210',
      reason_codes: ['PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW'],
      decision_snapshot: { decision: 'MANUAL_REVIEW' },
      status: 'ASSIGNED',
      assigned_to: 'analyst-1',
      assigned_by: 'supervisor-1',
      assigned_at: '2026-07-18T16:00:00+00:00',
      sla_due_at: '2026-07-19T16:00:00+00:00',
      correlation_id: '33333333-3333-3333-3333-333333333333',
      decided_at: null,
      decided_by: null,
      decision_reason: null,
      consumed_advance_id: null,
      created_at: '2026-07-18T15:04:00+00:00',
      updated_at: '2026-07-18T16:00:00+00:00',
    };

    const envelope: ApiEnvelope<PayrollAdvanceManualReviewCaseDto> = { data: manualCase };
    expect(envelope.data.status).toBe('ASSIGNED');
    // Segregación de funciones (tarea 7.8/7.9): assigned_to != assigned_by en este fixture.
    expect(envelope.data.assigned_to).not.toBe(envelope.data.assigned_by);
  });
});
