/**
 * Pleniu Colombia S.A. — Techos regulatorios parametrizables.
 *
 * OpenSpec: parametrize-regulatory-limits-co (sección 6).
 *
 * Espejo EXACTO (mismos nombres de campo, snake_case) de los tipos
 * Pydantic de Core:
 *   - `src/api/v1/schemas/regulatory_limits_schemas.py`
 *     (`RegulatoryLimitItem`, `RegulatoryLimitsResponse`)
 *
 * El envelope de Core NO transforma los nombres de campo (no hay
 * camelCase en la respuesta HTTP), así que estos tipos usan snake_case
 * tal cual llegan por HTTP — igual que el resto de DTOs de este repo.
 */

/** Un techo regulatorio individual (una fila en loan.regulatory_limits). */
export interface RegulatoryLimitItem {
  id: string;
  param_key: string;
  country_code: string;
  min_value: number | null;
  max_value: number | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

/** Payload del envelope para GET /admin/regulatory-limits. */
export interface RegulatoryLimitsResponse {
  items: RegulatoryLimitItem[];
  country_code: string;
}

/** Estado de una propuesta de cambio a los techos regulatorios. */
export type RegulatoryLimitsChangeRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

/** Valores (vigentes o propuestos) de los 7 techos regulatorios, como los serializa el backend (string | null). */
export interface RegulatoryLimitsFieldValues {
  max_salary_percentage: string | null;
  min_salary_percentage: string | null;
  min_tenure_months: string | null;
  max_monthly_frequency: string | null;
  min_monthly_frequency: string | null;
  max_active_count: string | null;
  min_active_count: string | null;
}

/** Espejo EXACTO de `_serialize_request()` en `regulatory_limits_change_requests_router.py`. */
export interface RegulatoryLimitsChangeRequestDto {
  id: string;
  country_code: string;
  status: RegulatoryLimitsChangeRequestStatus;
  proposed_by: string;
  proposed_at: string;
  reason: string | null;
  current_values: RegulatoryLimitsFieldValues;
  proposed_values: RegulatoryLimitsFieldValues;
  effective_from: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  new_value_ids: string[] | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Body de `POST /admin/regulatory-limits-change-requests`. */
export interface ProposeRegulatoryLimitsChangeRequestBody {
  effective_from: string;
  reason: string;
  country_code?: string;
  max_salary_percentage?: number;
  min_salary_percentage?: number;
  min_tenure_months?: number;
  max_monthly_frequency?: number;
  min_monthly_frequency?: number;
  max_active_count?: number;
  min_active_count?: number;
}

/** Body de `POST /admin/regulatory-limits-change-requests/{id}/approve|reject`. */
export interface DecideRegulatoryLimitsChangeRequestBody {
  reason: string;
}

/** Roles habilitados para proponer cambios a los techos regulatorios (staff interno de Pleniu). */
export const REGULATORY_LIMITS_PROPOSE_ROLES = [
  'admin',
  'employee',
  'sre',
  'devops',
  'risk_officer',
  'compliance_officer',
] as const;

/** Roles habilitados para rechazar propuestas. Aprobar exige SIEMPRE risk_officer (validado en Core, no aquí). */
export const REGULATORY_LIMITS_MANAGE_ROLES = ['admin', 'risk_officer', 'compliance_officer'] as const;

/** Roles permitidos para consultar techos regulatorios. */
export const REGULATORY_LIMITS_READ_ROLES = [
  'admin',
  'employee',
  'auditor',
  'sre',
  'devops',
  'risk_officer',
  'compliance_officer',
  'legal_admin',
] as const;

/** Convierte un valor JSONB (number | string | null) a number | null. */
export function regulatoryLimitValueToNumber(
  value: number | string | null,
): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(n) ? null : n;
}
