import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

/**
 * Pleniu Colombia S.A. — Cliente de alertas de riesgo de PAYROLL_ADVANCE.
 *
 * OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.4).
 * Espejo de `src/api/v1/routers/payroll_advance_alerts_router.py` (fase 7,
 * tarea 7.5), montado en `coreAdminV1Base` (`/api/v1/admin`) — igual patrón
 * que `treasury_alerts_router.py`.
 *
 * RBAC (server-side autoritativo, ver `_READ_ROLES`/`_MANAGE_ROLES` en el
 * router): lectura = ADMIN|AUDITOR|RISK_OFFICER|COMPLIANCE_OFFICER; gestión
 * (cambio de estado) = ADMIN|RISK_OFFICER|COMPLIANCE_OFFICER. Ningún rol
 * CUSTOMER/ENTERPRISE_* tiene acceso — son alertas de riesgo/cumplimiento
 * sobre terceros, no un dato propio del solicitante. Estos roles se
 * documentan aquí solo a título informativo para el consumidor (Backoffice,
 * fase 10); la autorización real la aplica Core.
 */
export type PayrollAdvanceAlertType =
  | 'PAYROLL_ADVANCE_PERCENTAGE_EXCEEDED'
  | 'PAYROLL_ADVANCE_EMPLOYER_POLICY_WEAKENING_ATTEMPT'
  | 'PAYROLL_ADVANCE_EMPLOYER_DAILY_LIMIT_EXCEEDED';

export type PayrollAdvanceAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type PayrollAdvanceAlertStatus = 'OPEN' | 'IN_REVIEW' | 'CLOSED';

/** Roles habilitados server-side para leer/gestionar alertas (documental, no enforcement). */
export const PAYROLL_ADVANCE_ALERT_READ_ROLES = [
  'admin',
  'auditor',
  'risk_officer',
  'compliance_officer',
] as const;
export const PAYROLL_ADVANCE_ALERT_MANAGE_ROLES = ['admin', 'risk_officer', 'compliance_officer'] as const;

export interface PayrollAdvanceAlertDto {
  id: string;
  alert_type: PayrollAdvanceAlertType | string;
  severity: PayrollAdvanceAlertSeverity | string;
  status: PayrollAdvanceAlertStatus | string;
  customer_id: string | null;
  customer_name?: string | null;
  employer_id: string | null;
  employer_name?: string | null;
  advance_id: string | null;
  manual_review_case_id: string | null;
  actor: string;
  observed_values: Record<string, unknown>;
  thresholds: Record<string, unknown>;
  policy_version: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollAdvanceAlertListParams {
  status?: PayrollAdvanceAlertStatus | string | null;
  severity?: PayrollAdvanceAlertSeverity | string | null;
  alert_type?: PayrollAdvanceAlertType | string | null;
  employer_id?: string | null;
  limit?: number;
}

export interface PayrollAdvanceAlertStatusUpdateRequest {
  status: PayrollAdvanceAlertStatus;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceAlertsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/payroll-advance-alerts`;
  }

  list(params: PayrollAdvanceAlertListParams = {}): Observable<ApiEnvelope<PayrollAdvanceAlertDto[]>> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    if (params.severity) hp = hp.set('severity', params.severity);
    if (params.alert_type) hp = hp.set('alert_type', params.alert_type);
    if (params.employer_id) hp = hp.set('employer_id', params.employer_id);
    if (params.limit !== undefined) hp = hp.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PayrollAdvanceAlertDto[]>>(this.base, { params: hp });
  }

  getById(alertId: string): Observable<ApiEnvelope<PayrollAdvanceAlertDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceAlertDto>>(`${this.base}/${alertId}`);
  }

  /** Transición de estado append-only (nunca se pierde el estado anterior — auditoría inmutable). */
  updateStatus(
    alertId: string,
    body: PayrollAdvanceAlertStatusUpdateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceAlertDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceAlertDto>>(`${this.base}/${alertId}/status`, body);
  }
}
