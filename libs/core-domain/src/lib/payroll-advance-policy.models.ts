/**
 * Pleniu Colombia S.A. — Política canónica de PAYROLL_ADVANCE Colombia.
 *
 * OpenSpec: centralize-payroll-advance-policy-co (fase 8, tarea 8.1).
 *
 * Espejo EXACTO (mismos nombres de campo, snake_case) de los tipos Pydantic
 * de Core:
 *   - `src/loan/domain/value_objects/payroll_advance_policy_decision.py`
 *     (`PayrollAdvancePolicyDecisionType`, `PayrollAdvancePolicyReasonCode`)
 *   - `src/api/v1/schemas/payroll_advance_policy_schemas.py`
 *     (`PayrollAdvancePolicyValuesSchema`, `EmployerPayrollPolicyOverridesSchema`,
 *     `PayrollAdvanceEffectivePolicySchema`, `PayrollAdvancePolicyDecisionSchema`,
 *     `PayrollAdvanceEligibilityResponse`, `PayrollAdvanceManualReviewResponse`)
 *
 * El envelope de Core NO transforma los nombres de campo (no hay camelCase
 * en la respuesta HTTP), así que estos tipos usan snake_case tal cual llegan
 * por HTTP — igual que el resto de DTOs de este repo (ver
 * `employment-profile.models.ts`, `loan.models.ts`).
 *
 * Los campos `Decimal` de Pydantic se serializan como `number` en JSON
 * (mismo criterio ya usado en `SimulatePayrollAdvanceResponse.amount` /
 * `fee_rate` / `commission` de `core-payroll-advances-api.service.ts`).
 *
 * NO renombrar estos campos/valores: son un contrato estable compartido con
 * Rules Engine, Scoring y los portales (design.md Decision 7-11). Añadir un
 * código nuevo requiere una nueva versión de política en Core — si eso
 * ocurre, sincronizar este archivo con
 * `payroll_advance_policy_decision.py` y actualizar
 * `payroll-advance-policy-labels.ts` en la misma revisión.
 */

/** Resultado canónico de la evaluación de política (design.md Decision 7). */
export type PayrollAdvancePolicyDecisionType =
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'UNAVAILABLE';

export const PAYROLL_ADVANCE_POLICY_DECISION_TYPES: readonly PayrollAdvancePolicyDecisionType[] = [
  'APPROVED',
  'REJECTED',
  'MANUAL_REVIEW',
  'UNAVAILABLE',
];

/**
 * Códigos de motivo estables, sin PII, uno por causa (design.md Decision 8-10).
 * Prefijo `PAYROLL_ADVANCE_*` para causas del producto; `POLICY_*` para
 * conflictos de configuración de política — idéntico al enum Python
 * `PayrollAdvancePolicyReasonCode` (25 valores).
 */
export type PayrollAdvancePolicyReasonCode =
  // ── Rechazos duros (REJECTED) ──────────────────────────────────────────
  | 'PAYROLL_ADVANCE_AMOUNT_BELOW_MIN'
  | 'PAYROLL_ADVANCE_AMOUNT_ABOVE_MAX'
  | 'PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED'
  | 'PAYROLL_ADVANCE_MIN_TENURE_NOT_MET'
  | 'PAYROLL_ADVANCE_MONTHLY_FREQUENCY_EXCEEDED'
  | 'PAYROLL_ADVANCE_ACTIVE_EXISTS'
  | 'PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_OPEN'
  | 'PAYROLL_ADVANCE_TERMS_NOT_ACTIVE'
  | 'PAYROLL_ADVANCE_EMPLOYER_NOT_ELIGIBLE'
  | 'PAYROLL_ADVANCE_EMPLOYMENT_PROFILE_NOT_VERIFIED'
  | 'PAYROLL_ADVANCE_DISCOUNT_DATE_INVALID'
  | 'PAYROLL_ADVANCE_RECENT_DEFAULT'
  | 'PAYROLL_ADVANCE_KYC_AML_BLOCKED'
  | 'PAYROLL_ADVANCE_SCORING_REJECTED'
  | 'PAYROLL_ADVANCE_CONSENT_MISSING'
  | 'PAYROLL_ADVANCE_CURRENCY_OR_JURISDICTION_INVALID'
  // ── Configuración de política (REJECTED / UNAVAILABLE) ─────────────────
  | 'PAYROLL_ADVANCE_EMPLOYER_POLICY_TOO_PERMISSIVE'
  | 'PAYROLL_ADVANCE_EMPLOYER_POLICY_INCOMPLETE'
  | 'POLICY_CONFIGURATION_CONFLICT'
  | 'PAYROLL_ADVANCE_POLICY_MISSING'
  | 'PAYROLL_ADVANCE_POLICY_VERSION_STALE'
  // ── Revisión manual acotada (MANUAL_REVIEW, design.md Decision 9) ──────
  | 'PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW'
  | 'PAYROLL_ADVANCE_EMPLOYMENT_DATA_DISCREPANCY'
  | 'PAYROLL_ADVANCE_RISK_REVIEW_REQUIRED'
  // OpenSpec reconcile-risk-engines-aggregator-co: Scoring rechazó pero Rules
  // Engine aprobó — nunca REJECTED por sí solo, solo acompaña MANUAL_REVIEW.
  | 'PAYROLL_ADVANCE_RISK_ENGINE_DISAGREEMENT'
  // ── Indisponibilidad (UNAVAILABLE, fail closed — Decision 13) ──────────
  | 'PAYROLL_ADVANCE_RULES_UNAVAILABLE'
  | 'PAYROLL_ADVANCE_SCORING_UNAVAILABLE'
  | 'PAYROLL_ADVANCE_ACTIVE_BALANCE_UNAVAILABLE';

/** Todos los códigos de motivo, en el mismo orden que el enum Python. Útil
 * para validar cobertura completa de labels (tarea 8.6). */
export const PAYROLL_ADVANCE_POLICY_REASON_CODES: readonly PayrollAdvancePolicyReasonCode[] = [
  'PAYROLL_ADVANCE_AMOUNT_BELOW_MIN',
  'PAYROLL_ADVANCE_AMOUNT_ABOVE_MAX',
  'PAYROLL_ADVANCE_SALARY_PERCENTAGE_EXCEEDED',
  'PAYROLL_ADVANCE_MIN_TENURE_NOT_MET',
  'PAYROLL_ADVANCE_MONTHLY_FREQUENCY_EXCEEDED',
  'PAYROLL_ADVANCE_ACTIVE_EXISTS',
  'PAYROLL_ADVANCE_MANUAL_REVIEW_CASE_OPEN',
  'PAYROLL_ADVANCE_TERMS_NOT_ACTIVE',
  'PAYROLL_ADVANCE_EMPLOYER_NOT_ELIGIBLE',
  'PAYROLL_ADVANCE_EMPLOYMENT_PROFILE_NOT_VERIFIED',
  'PAYROLL_ADVANCE_DISCOUNT_DATE_INVALID',
  'PAYROLL_ADVANCE_RECENT_DEFAULT',
  'PAYROLL_ADVANCE_KYC_AML_BLOCKED',
  'PAYROLL_ADVANCE_SCORING_REJECTED',
  'PAYROLL_ADVANCE_CONSENT_MISSING',
  'PAYROLL_ADVANCE_CURRENCY_OR_JURISDICTION_INVALID',
  'PAYROLL_ADVANCE_EMPLOYER_POLICY_TOO_PERMISSIVE',
  'PAYROLL_ADVANCE_EMPLOYER_POLICY_INCOMPLETE',
  'POLICY_CONFIGURATION_CONFLICT',
  'PAYROLL_ADVANCE_POLICY_MISSING',
  'PAYROLL_ADVANCE_POLICY_VERSION_STALE',
  'PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW',
  'PAYROLL_ADVANCE_EMPLOYMENT_DATA_DISCREPANCY',
  'PAYROLL_ADVANCE_RISK_REVIEW_REQUIRED',
  'PAYROLL_ADVANCE_RISK_ENGINE_DISAGREEMENT',
  'PAYROLL_ADVANCE_RULES_UNAVAILABLE',
  'PAYROLL_ADVANCE_SCORING_UNAVAILABLE',
  'PAYROLL_ADVANCE_ACTIVE_BALANCE_UNAVAILABLE',
];

/** Motivos que solo pueden acompañar MANUAL_REVIEW (nunca anulan reglas duras). */
export const PAYROLL_ADVANCE_MANUAL_REVIEW_REASON_CODES: readonly PayrollAdvancePolicyReasonCode[] = [
  'PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_REVIEW',
  'PAYROLL_ADVANCE_EMPLOYMENT_DATA_DISCREPANCY',
  'PAYROLL_ADVANCE_RISK_REVIEW_REQUIRED',
  'PAYROLL_ADVANCE_RISK_ENGINE_DISAGREEMENT',
];

/** Motivos de indisponibilidad técnica/configuración (fail closed). */
export const PAYROLL_ADVANCE_UNAVAILABLE_REASON_CODES: readonly PayrollAdvancePolicyReasonCode[] = [
  'PAYROLL_ADVANCE_RULES_UNAVAILABLE',
  'PAYROLL_ADVANCE_SCORING_UNAVAILABLE',
  'PAYROLL_ADVANCE_ACTIVE_BALANCE_UNAVAILABLE',
  'PAYROLL_ADVANCE_POLICY_MISSING',
  'POLICY_CONFIGURATION_CONFLICT',
  'PAYROLL_ADVANCE_EMPLOYER_POLICY_INCOMPLETE',
  'PAYROLL_ADVANCE_POLICY_VERSION_STALE',
];

/** Espejo de `PayrollAdvancePolicyValuesSchema` (global o efectivo). */
export interface PayrollAdvancePolicyValues {
  /** Fracción: 0.30 = 30%. */
  max_salary_percentage: number;
  min_amount: number;
  min_tenure_months: number;
  max_monthly_frequency: number;
  max_active_count: number;
  max_discount_days: number;
  employer_daily_limit_amount: number;
}

/** Espejo de `EmployerPayrollPolicyOverridesSchema`. Solo configuración, sin PII. */
export interface EmployerPayrollPolicyOverrides {
  config_id: string;
  employer_id: string;
  country_code: string | null;
  currency: string | null;
  max_salary_percentage: number | null;
  min_tenure_months: number | null;
  max_monthly_frequency: number | null;
  max_active_count: number | null;
  max_discount_days: number | null;
  employer_daily_limit_amount: number | null;
  terms_version: string | null;
  effective_from: string | null;
  effective_to: string | null;
}

/**
 * Espejo de `PayrollAdvanceEffectivePolicySchema` / `to_snapshot()`
 * (design.md Decision 1/2). Auditable, sin PII: solo configuración de
 * política e identificadores técnicos.
 */
export interface PayrollAdvanceEffectivePolicy {
  policy_version: string;
  country_code: string;
  product_type: string;
  currency: string;
  employer_id: string | null;
  evaluated_at: string;
  effective_from: string;
  effective_to: string | null;
  global_values: PayrollAdvancePolicyValues;
  employer_overrides: EmployerPayrollPolicyOverrides | null;
  effective_values: PayrollAdvancePolicyValues;
  /** Campo -> `GLOBAL` | `EMPLOYER` según qué fuente aportó el valor más restrictivo. */
  sources: Record<string, string>;
  source_value_ids: string[];
}

/**
 * Espejo de `PayrollAdvancePolicyDecisionSchema` (design.md Decision 7/11).
 * `decision` es uno de `APPROVED|REJECTED|MANUAL_REVIEW|UNAVAILABLE`.
 * `reason_codes` son los códigos estables de `PayrollAdvancePolicyReasonCode`.
 */
export interface PayrollAdvancePolicyDecision {
  decision: PayrollAdvancePolicyDecisionType;
  reason_codes: string[];
  policy: PayrollAdvanceEffectivePolicy;
  evaluated_at: string;
  correlation_id: string | null;
  /** Monto máximo efectivo (design.md Decision 2/§3.5). */
  effective_max_amount: number | null;
  /** Primeros desembolsos ya contabilizados este mes calendario CO. */
  monthly_disbursed_count: number | null;
  /** Máximo de desembolsos por mes calendario (política efectiva). */
  max_monthly_frequency: number;
  /** `max_monthly_frequency - monthly_disbursed_count`, nunca negativo. */
  remaining_monthly_quota: number | null;
  /** `true` si existe al menos un anticipo activo; se permiten hasta dos. */
  has_active_advance: boolean | null;
  /** Antigüedad observada del perfil laboral verificado, en meses. */
  tenure_months: number | null;
  /** Antigüedad mínima requerida (política efectiva). */
  min_tenure_months: number;
  /** Preconsulta sin monto: cupo informativo sujeto a Scoring. */
  provisional: boolean;
  /** Solo `true` cuando se evaluó un monto real con Scoring obligatorio. */
  is_final: boolean;
  /**
   * Passthrough auditable del resto de señales no sensibles evaluadas
   * (discount_date_days_from_now, has_recent_default, rules_engine_source,
   * etc.). Nunca contiene salario ni otra PII.
   */
  observed: Record<string, unknown>;
}

/**
 * Espejo de `PayrollAdvanceEligibilityResponse` (respuesta canónica de
 * `GET /payroll-advances/eligibility` y de los campos aditivos de
 * `/simulate`). `decision` es `null` únicamente cuando ni siquiera pudo
 * resolverse la política efectiva (fail-closed más temprano posible) — en
 * ese caso `unavailable_reason` trae el motivo estable.
 */
export interface PayrollAdvanceEligibilityResponse {
  customer_id: string;
  employer_id: string | null;
  decision: PayrollAdvancePolicyDecision | null;
  unavailable_reason: string | null;
}

/**
 * Espejo de `PayrollAdvanceManualReviewResponse` — cuerpo de éxito (202
 * Accepted) cuando `POST /payroll-advances` recibe una decisión
 * `MANUAL_REVIEW`. NO es un error: no se creó ningún `PayrollAdvance` ni
 * posting/desembolso.
 */
export interface PayrollAdvanceManualReviewAcceptedResponse {
  customer_id: string;
  employer_id: string;
  decision: 'MANUAL_REVIEW';
  reason_codes: string[];
  message: string;
  case_id: string | null;
}

/**
 * OpenSpec reconcile-risk-engines-aggregator-co (fase 6, tarea 6.1): espejo
 * de `observed.risk_verdicts` dentro de `decision_snapshot` — veredicto crudo
 * de cada motor cuando `RISK_ENGINE_RECONCILIATION_ENFORCED=true` reconcilió
 * la decisión. Ausente cuando el flag estaba desactivado o no había un
 * veredicto de scoring que reconciliar (ver `reconcile_verdicts` en Core).
 */
export interface PayrollAdvanceRiskVerdicts {
  rules_engine: {
    verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
    raw_decision: string;
    evaluation_id: string | null;
    failed_rules: string[];
  };
  scoring: {
    verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
    risk_tier: string | null;
    max_total_exposure_amount: string | null;
  };
}
