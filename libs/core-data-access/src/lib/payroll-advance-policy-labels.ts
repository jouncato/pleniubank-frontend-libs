import type {
  PayrollAdvancePolicyDecisionType,
  PayrollAdvancePolicyReasonCode,
} from '@pleniu/core-domain';
import { PAYROLL_ADVANCE_POLICY_REASON_CODES } from '@pleniu/core-domain';

import type {
  PayrollAdvanceAlertSeverity,
  PayrollAdvanceAlertStatus,
  PayrollAdvanceAlertType,
} from './core-payroll-advance-alerts-api.service';
import type { PayrollAdvanceManualReviewCaseStatus } from './core-payroll-advance-manual-review-api.service';

/**
 * Pleniu Colombia S.A. — Labels públicos centralizados de la política
 * canónica de PAYROLL_ADVANCE Colombia.
 *
 * OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.5).
 *
 * Fuente de la base de los mensajes: `src/api/v1/mappers/
 * payroll_advance_policy_error_mapper.py::_REASON_MESSAGES` en Core (los
 * mismos textos en español ya usados para los errores HTTP 422/503).
 * Se ADAPTAN aquí (no se copian literal) a la convención de mensaje
 * accesible/accionable de canal (Customer Portal fase 9 / Backoffice
 * fase 10): frase corta + qué puede hacer el usuario, sin exponer reglas
 * internas ni PII — igual criterio que `rules-business-labels.ts`.
 *
 * Cobertura: TODOS los 25 valores de `PayrollAdvancePolicyReasonCode`
 * (`@pleniu/core-domain`) tienen entrada aquí — verificado por
 * `payroll-advance-policy-labels.spec.ts` (compara contra
 * `PAYROLL_ADVANCE_POLICY_REASON_CODES`, la lista canónica espejo del enum
 * Python). Si Core añade un código nuevo (requiere nueva versión de
 * política, ver `payroll_advance_policy_decision.py`), este archivo DEBE
 * actualizarse en la misma revisión — el spec fallará si no.
 */

export const PAYROLL_ADVANCE_POLICY_DECISION_LABELS: Record<PayrollAdvancePolicyDecisionType, string> = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  MANUAL_REVIEW: 'En revisión manual',
  UNAVAILABLE: 'No disponible temporalmente',
};

export function payrollAdvancePolicyDecisionLabel(decision: string): string {
  return (
    PAYROLL_ADVANCE_POLICY_DECISION_LABELS[decision as PayrollAdvancePolicyDecisionType] ?? decision
  );
}

/** `true` cuando la decisión no debe permitir continuar la solicitud sin re-evaluar. */
export function isPayrollAdvancePolicyBlocking(decision: string): boolean {
  return decision === 'REJECTED' || decision === 'MANUAL_REVIEW' || decision === 'UNAVAILABLE';
}

const _DEFAULT_REJECTED_MESSAGE = 'La solicitud no cumple la política vigente de Anticipo de nómina.';
const _DEFAULT_UNAVAILABLE_MESSAGE =
  'No fue posible evaluar la política de Anticipo de nómina en este momento. Intenta nuevamente.';
const _DEFAULT_MANUAL_REVIEW_MESSAGE =
  'La solicitud requiere revisión manual antes de continuar; no se realizó ningún desembolso ni registro del anticipo.';

/**
 * Mensaje accesible en español por `reason_code` (tarea 8.5). Las claves son
 * los VALORES string de `PayrollAdvancePolicyReasonCode` — idénticos a los
 * que Core ya devuelve en `reason_codes[]`/`unavailable_reason`/`code`.
 */
export const PAYROLL_ADVANCE_POLICY_REASON_LABELS: Record<PayrollAdvancePolicyReasonCode, string> = {
  // ── Rechazos duros (REJECTED) ──────────────────────────────────────────
  PAYROLL_ADVANCE_AMOUNT_BELOW_MIN: 'El monto solicitado es menor al mínimo permitido por la política vigente.',
  PAYROLL_ADVANCE_AMOUNT_ABOVE_MAX:
    'El monto solicitado supera el máximo efectivo permitido por la política vigente.',
  PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED:
    'El monto solicitado supera el porcentaje máximo permitido del salario verificado.',
  PAYROLL_ADVANCE_MIN_TENURE_NOT_MET:
    'La antigüedad laboral verificada no cumple el mínimo requerido por la política vigente.',
  PAYROLL_ADVANCE_MONTHLY_FREQUENCY_EXCEEDED:
    'Ya se alcanzó el máximo de desembolsos permitidos para el mes calendario vigente.',
  PAYROLL_ADVANCE_ACTIVE_EXISTS: 'Ya tienes un Anticipo de nómina activo. Solo se permite uno a la vez.',
  PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_OPEN:
    'Ya tienes un caso de revisión manual abierto para Anticipo de nómina. Solo se permite uno a la vez.',
  PAYROLL_ADVANCE_TERMS_NOT_ACTIVE: 'Los términos del producto no están vigentes.',
  PAYROLL_ADVANCE_EMPLOYER_NOT_ELIGIBLE: 'La empresa/convenio no está habilitado para Anticipo de nómina.',
  PAYROLL_ADVANCE_EMPLOYMENT_PROFILE_NOT_VERIFIED:
    'Se requiere un perfil de empleo activo y verificado asociado a esta empresa.',
  PAYROLL_ADVANCE_DISCOUNT_DATE_INVALID:
    'La fecha de descuento propuesta no es válida o excede el máximo vigente.',
  PAYROLL_ADVANCE_RECENT_DEFAULT: 'El historial crediticio reciente no cumple la política vigente.',
  PAYROLL_ADVANCE_KYC_AML_BLOCKED: 'La verificación de identidad/AML bloqueó la solicitud.',
  PAYROLL_ADVANCE_CONSENT_MISSING: 'No existe un consentimiento vigente para este cliente.',
  PAYROLL_ADVANCE_CURRENCY_OR_JURISDICTION_INVALID:
    'La moneda o jurisdicción de la solicitud es incompatible con la política vigente.',
  // ── Configuración de política (REJECTED / UNAVAILABLE) ─────────────────
  PAYROLL_ADVANCE_EMPLOYER_POLICY_TOO_PERMISSIVE:
    'La configuración empresarial no cumple los límites globales de la política.',
  PAYROLL_ADVANCE_EMPLOYER_POLICY_INCOMPLETE: 'La configuración de política empresarial está incompleta.',
  POLICY_CONFIGURATION_CONFLICT:
    'Existe un conflicto de configuración de política vigente para este producto/empresa.',
  PAYROLL_ADVANCE_POLICY_MISSING: 'No hay una política vigente configurada para este producto/país.',
  PAYROLL_ADVANCE_POLICY_VERSION_STALE:
    'La versión de política usada para evaluar ya no está vigente. Reintenta la solicitud.',
  // ── Revisión manual acotada (MANUAL_REVIEW) ────────────────────────────
  PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW:
    'La solicitud excede el límite diario agregado de la empresa y requiere revisión manual.',
  PAYROLL_ADVANCE_EMPLOYMENT_DATA_DISCREPANCY:
    'Se detectó una discrepancia entre fuentes de información laboral y requiere revisión manual.',
  PAYROLL_ADVANCE_RISK_REVIEW_REQUIRED: 'El motor de riesgo marcó la solicitud para revisión manual.',
  // ── Indisponibilidad (UNAVAILABLE, fail-closed — reintentable) ─────────
  PAYROLL_ADVANCE_RULES_UNAVAILABLE:
    'El motor de reglas no está disponible en este momento. Reintenta la solicitud.',
  PAYROLL_ADVANCE_SCORING_UNAVAILABLE:
    'El servicio de scoring de riesgo no está disponible en este momento. Reintenta la solicitud.',
};

/** Todos los reason_codes conocidos tienen label — usado por el spec de cobertura (tarea 8.6). */
export const PAYROLL_ADVANCE_POLICY_REASON_LABEL_KEYS: readonly string[] =
  PAYROLL_ADVANCE_POLICY_REASON_CODES;

export function payrollAdvancePolicyReasonLabel(reasonCode: string, decision?: string): string {
  const known = PAYROLL_ADVANCE_POLICY_REASON_LABELS[reasonCode as PayrollAdvancePolicyReasonCode];
  if (known) return known;
  if (decision === 'UNAVAILABLE') return _DEFAULT_UNAVAILABLE_MESSAGE;
  if (decision === 'MANUAL_REVIEW') return _DEFAULT_MANUAL_REVIEW_MESSAGE;
  return _DEFAULT_REJECTED_MESSAGE;
}

/** Primer mensaje aplicable de una lista de `reason_codes` (mismo criterio que el mapper de Core: el primero es el motivo primario). */
export function payrollAdvancePolicyPrimaryReasonLabel(
  reasonCodes: readonly string[] | null | undefined,
  decision?: string,
): string {
  const primary = reasonCodes?.[0];
  if (!primary) {
    if (decision === 'UNAVAILABLE') return _DEFAULT_UNAVAILABLE_MESSAGE;
    if (decision === 'MANUAL_REVIEW') return _DEFAULT_MANUAL_REVIEW_MESSAGE;
    return _DEFAULT_REJECTED_MESSAGE;
  }
  return payrollAdvancePolicyReasonLabel(primary, decision);
}

// ── Alertas de riesgo (fase 7/8.4/8.5) ────────────────────────────────────

export const PAYROLL_ADVANCE_ALERT_TYPE_LABELS: Record<PayrollAdvanceAlertType, string> = {
  PAYROLL_ADVANCE_PERCENTAGE_EXCEEDED: 'Intento de solicitud sobre el porcentaje efectivo permitido',
  PAYROLL_ADVANCE_EMPLOYER_POLICY_WEAKENING_ATTEMPT:
    'Intento de configurar una política empresarial menos restrictiva que la global',
  PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_EXCEEDED:
    'Concentración diaria empresarial sobre el límite agregado',
};

export function payrollAdvanceAlertTypeLabel(alertType: string): string {
  return PAYROLL_ADVANCE_ALERT_TYPE_LABELS[alertType as PayrollAdvanceAlertType] ?? alertType;
}

export const PAYROLL_ADVANCE_ALERT_SEVERITY_LABELS: Record<PayrollAdvanceAlertSeverity, string> = {
  INFO: 'Informativa',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítica',
};

export function payrollAdvanceAlertSeverityLabel(severity: string): string {
  return PAYROLL_ADVANCE_ALERT_SEVERITY_LABELS[severity as PayrollAdvanceAlertSeverity] ?? severity;
}

export const PAYROLL_ADVANCE_ALERT_STATUS_LABELS: Record<PayrollAdvanceAlertStatus, string> = {
  OPEN: 'Abierta',
  IN_REVIEW: 'En revisión',
  CLOSED: 'Cerrada',
};

export function payrollAdvanceAlertStatusLabel(status: string): string {
  return PAYROLL_ADVANCE_ALERT_STATUS_LABELS[status as PayrollAdvanceAlertStatus] ?? status;
}

// ── Casos de revisión manual (fase 7/8.4/8.5) ─────────────────────────────

export const PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_STATUS_LABELS: Record<
  PayrollAdvanceManualReviewCaseStatus,
  string
> = {
  OPEN: 'Sin asignar',
  ASSIGNED: 'Asignado a un analista',
  APPROVED: 'Aprobado (pendiente de reenvío de la solicitud)',
  REJECTED: 'Rechazado',
  EXPIRED: 'Expirado por SLA',
  CONSUMED: 'Aprobado y consumido (anticipo creado)',
};

export function payrollAdvanceManualReviewCaseStatusLabel(status: string): string {
  return (
    PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_STATUS_LABELS[status as PayrollAdvanceManualReviewCaseStatus] ??
    status
  );
}
