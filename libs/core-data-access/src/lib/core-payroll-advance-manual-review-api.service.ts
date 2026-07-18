import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

/**
 * Pleniu Colombia S.A. — Cliente de la cola de revisión manual de
 * PAYROLL_ADVANCE.
 *
 * OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.4).
 * Espejo de `src/api/v1/routers/payroll_advance_manual_review_router.py`
 * (fase 7, tareas 7.5/7.6/7.7/7.8), montado en `coreAdminV1Base`
 * (`/api/v1/admin`).
 *
 * RBAC (server-side autoritativo): lectura =
 * ADMIN|AUDITOR|RISK_OFFICER|COMPLIANCE_OFFICER; gestión (asignar/aprobar/
 * rechazar) = ADMIN|RISK_OFFICER|COMPLIANCE_OFFICER|EMPLOYEE ("Operaciones"
 * no tiene rol dedicado en este codebase). Ningún rol CUSTOMER/ENTERPRISE_*
 * tiene acceso — la cola es exclusivamente de staff interno.
 *
 * Segregación de funciones (tarea 7.8/7.9): el analista que decide
 * (`approve`/`reject`) debe ser el `assigned_to` y NO puede ser quien asignó
 * el caso (`assigned_by`) — Core rechaza con 403
 * `SEGREGATION_OF_DUTIES_VIOLATION` si se viola. La aprobación además
 * re-evalúa reglas duras/vigencia de política ANTES de aprobar (422
 * `PAYROLL_ADVANCE_MANUAL_APPROVAL_BLOCKED` si el resultado cambió a
 * REJECTED/UNAVAILABLE) — ninguna decisión manual puede anular un rechazo
 * duro vigente.
 */
export type PayrollAdvanceManualReviewCaseStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONSUMED';

/** Roles habilitados server-side para leer/gestionar casos (documental, no enforcement). */
export const PAYROLL_ADVANCE_MANUAL_REVIEW_READ_ROLES = [
  'admin',
  'auditor',
  'risk_officer',
  'compliance_officer',
] as const;
export const PAYROLL_ADVANCE_MANUAL_REVIEW_MANAGE_ROLES = [
  'admin',
  'risk_officer',
  'compliance_officer',
  'employee',
] as const;

export interface PayrollAdvanceManualReviewCaseDto {
  id: string;
  customer_id: string;
  employer_id: string;
  requested_amount: string;
  denomination: string;
  policy_version: string;
  reason_codes: string[];
  decision_snapshot: Record<string, unknown>;
  status: PayrollAdvanceManualReviewCaseStatus | string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  sla_due_at: string;
  correlation_id: string | null;
  decided_at: string | null;
  decided_by: string | null;
  decision_reason: string | null;
  consumed_advance_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollAdvanceManualReviewCaseListParams {
  status?: PayrollAdvanceManualReviewCaseStatus | string | null;
  employer_id?: string | null;
  limit?: number;
}

export interface AssignManualReviewCaseRequest {
  assigned_to: string;
}

export interface DecideManualReviewCaseRequest {
  reason: string;
}

export interface ApproveManualReviewCaseResult {
  case_id: string;
  status: string;
  re_evaluated_decision: string;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceManualReviewApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/payroll-advance-manual-review-cases`;
  }

  list(
    params: PayrollAdvanceManualReviewCaseListParams = {},
  ): Observable<ApiEnvelope<PayrollAdvanceManualReviewCaseDto[]>> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    if (params.employer_id) hp = hp.set('employer_id', params.employer_id);
    if (params.limit !== undefined) hp = hp.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PayrollAdvanceManualReviewCaseDto[]>>(this.base, { params: hp });
  }

  getById(caseId: string): Observable<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>>(`${this.base}/${caseId}`);
  }

  assign(
    caseId: string,
    body: AssignManualReviewCaseRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>>(
      `${this.base}/${caseId}/assign`,
      body,
    );
  }

  /** Re-evalúa reglas duras/vigencia antes de aprobar (tarea 7.7/7.8). */
  approve(
    caseId: string,
    body: DecideManualReviewCaseRequest,
  ): Observable<ApiEnvelope<ApproveManualReviewCaseResult>> {
    return this.http.post<ApiEnvelope<ApproveManualReviewCaseResult>>(
      `${this.base}/${caseId}/approve`,
      body,
    );
  }

  /** Rechazo explícito del caso (libera la reserva de cupo activo). */
  reject(
    caseId: string,
    body: DecideManualReviewCaseRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceManualReviewCaseDto>>(
      `${this.base}/${caseId}/reject`,
      body,
    );
  }
}
