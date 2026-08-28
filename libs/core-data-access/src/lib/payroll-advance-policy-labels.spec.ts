import { PAYROLL_ADVANCE_POLICY_REASON_CODES } from '@pleniu/core-domain';

import {
  PAYROLL_ADVANCE_ALERT_SEVERITY_LABELS,
  PAYROLL_ADVANCE_ALERT_STATUS_LABELS,
  PAYROLL_ADVANCE_ALERT_TYPE_LABELS,
  PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_STATUS_LABELS,
  PAYROLL_ADVANCE_POLICY_DECISION_LABELS,
  PAYROLL_ADVANCE_POLICY_REASON_LABELS,
  isPayrollAdvancePolicyBlocking,
  payrollAdvanceAlertSeverityLabel,
  payrollAdvanceAlertStatusLabel,
  payrollAdvanceAlertTypeLabel,
  payrollAdvanceManualReviewCaseStatusLabel,
  payrollAdvancePolicyDecisionLabel,
  payrollAdvancePolicyPrimaryReasonLabel,
  payrollAdvancePolicyReasonLabel,
} from './payroll-advance-policy-labels';

describe('payroll-advance-policy-labels', () => {
  // OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.5/8.6):
  // verificación obligatoria — NINGÚN reason_code del backend debe quedar
  // sin label. Esta lista (`PAYROLL_ADVANCE_POLICY_REASON_CODES`) es el
  // espejo TS exacto del enum Python `PayrollAdvancePolicyReasonCode`.
  it('TODOS los reason_codes de PayrollAdvancePolicyReasonCode tienen un label específico (no fallback genérico)', () => {
    const missing = PAYROLL_ADVANCE_POLICY_REASON_CODES.filter(
      (code) => !(code in PAYROLL_ADVANCE_POLICY_REASON_LABELS),
    );
    expect(missing).toEqual([]);
    expect(Object.keys(PAYROLL_ADVANCE_POLICY_REASON_LABELS)).toHaveLength(
      PAYROLL_ADVANCE_POLICY_REASON_CODES.length,
    );
  });

  it('ningún label de reason_code está vacío ni es solo espacios', () => {
    for (const code of PAYROLL_ADVANCE_POLICY_REASON_CODES) {
      expect(PAYROLL_ADVANCE_POLICY_REASON_LABELS[code].trim().length).toBeGreaterThan(0);
    }
  });

  it('los 4 valores de decisión tienen label', () => {
    expect(Object.keys(PAYROLL_ADVANCE_POLICY_DECISION_LABELS)).toHaveLength(4);
    expect(payrollAdvancePolicyDecisionLabel('APPROVED')).toBe('Aprobado');
    expect(payrollAdvancePolicyDecisionLabel('UNAVAILABLE')).toBe('No disponible temporalmente');
    // Código desconocido -> fallback al valor crudo, nunca lanza.
    expect(payrollAdvancePolicyDecisionLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });

  it('isPayrollAdvancePolicyBlocking distingue APPROVED de las demás decisiones', () => {
    expect(isPayrollAdvancePolicyBlocking('APPROVED')).toBe(false);
    expect(isPayrollAdvancePolicyBlocking('REJECTED')).toBe(true);
    expect(isPayrollAdvancePolicyBlocking('MANUAL_REVIEW')).toBe(true);
    expect(isPayrollAdvancePolicyBlocking('UNAVAILABLE')).toBe(true);
  });

  it('payrollAdvancePolicyReasonLabel devuelve el mensaje específico para un código conocido', () => {
    expect(payrollAdvancePolicyReasonLabel('PAYROLL_ADVANCE_MIN_TENURE_NOT_MET')).toContain('antigüedad');
    expect(payrollAdvancePolicyReasonLabel('PAYROLL_ADVANCE_ACTIVE_EXISTS')).toContain('activo');
  });

  it('payrollAdvancePolicyReasonLabel usa el mensaje por defecto de la decisión cuando el código es desconocido', () => {
    expect(payrollAdvancePolicyReasonLabel('UNKNOWN_CODE', 'UNAVAILABLE')).toMatch(/Intenta nuevamente/);
    expect(payrollAdvancePolicyReasonLabel('UNKNOWN_CODE', 'MANUAL_REVIEW')).toMatch(/revisión manual/);
    expect(payrollAdvancePolicyReasonLabel('UNKNOWN_CODE', 'REJECTED')).toMatch(/no cumple la política/);
  });

  it('payrollAdvancePolicyPrimaryReasonLabel toma el primer reason_code de la lista (motivo primario)', () => {
    const label = payrollAdvancePolicyPrimaryReasonLabel(
      ['PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED', 'PAYROLL_ADVANCE_ACTIVE_EXISTS'],
      'REJECTED',
    );
    expect(label).toBe(PAYROLL_ADVANCE_POLICY_REASON_LABELS.PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED);
  });

  it('payrollAdvancePolicyPrimaryReasonLabel maneja lista vacía/undefined sin lanzar', () => {
    expect(payrollAdvancePolicyPrimaryReasonLabel([], 'UNAVAILABLE')).toMatch(/Intenta nuevamente/);
    expect(payrollAdvancePolicyPrimaryReasonLabel(undefined, 'MANUAL_REVIEW')).toMatch(/revisión manual/);
  });

  it('las alertas de riesgo tienen label', () => {
    expect(Object.keys(PAYROLL_ADVANCE_ALERT_TYPE_LABELS)).toHaveLength(5);
    expect(payrollAdvanceAlertTypeLabel('PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_EXCEEDED')).toContain(
      'diaria',
    );
    expect(payrollAdvanceAlertTypeLabel('PAYROLL_ADVANCE_MASTER_CONTRACT_UTILIZATION_OVER_85')).toContain(
      '85%',
    );
  });

  it('severidad y estado de alertas tienen label completo', () => {
    expect(Object.keys(PAYROLL_ADVANCE_ALERT_SEVERITY_LABELS)).toEqual(['INFO', 'WARNING', 'CRITICAL']);
    expect(Object.keys(PAYROLL_ADVANCE_ALERT_STATUS_LABELS)).toEqual(['OPEN', 'IN_REVIEW', 'CLOSED']);
    expect(payrollAdvanceAlertSeverityLabel('CRITICAL')).toBe('Crítica');
    expect(payrollAdvanceAlertStatusLabel('IN_REVIEW')).toBe('En revisión');
  });

  it('los 6 estados de caso de revisión manual tienen label', () => {
    expect(Object.keys(PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_STATUS_LABELS)).toEqual([
      'OPEN',
      'ASSIGNED',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CONSUMED',
    ]);
    expect(payrollAdvanceManualReviewCaseStatusLabel('CONSUMED')).toContain('consumido');
  });
});
