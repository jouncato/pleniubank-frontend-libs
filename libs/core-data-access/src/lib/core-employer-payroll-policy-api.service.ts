import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

/**
 * Pleniu Colombia S.A. — Cliente de administración empresarial de
 * PAYROLL_ADVANCE (`loan.employer_payroll_products`).
 *
 * OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.3).
 *
 * Espejo de `src/api/v1/routers/employers_router.py` en Core:
 *   POST  /employers/{employer_id}/payroll-advance-product
 *   GET   /employers/{employer_id}/payroll-advance-product
 *   PATCH /employers/{employer_id}/payroll-advance-product
 *
 * Decisión de diseño (tarea 8.3 pide justificar dónde vive este cliente):
 * estos 3 endpoints NO viven bajo `/platform/contract-policies` (el que
 * envuelve `CoreContractPoliciesApiService`, montado en
 * `coreAdminV1Base`/`/api/v1/admin`) — `employers_router.py` está montado en
 * el prefijo PUBLIC (`/api/v1/public`, ver `_public_routers` en
 * `src/main.py`), igual que `payroll-advances`. Por eso este cliente usa
 * `corePublicV1Base` y vive en un archivo propio en vez de extender
 * `CoreContractPoliciesApiService` (que apunta a un base URL distinto).
 *
 * `CoreContractPoliciesApiService` YA cubre, sin cambios, el resto de lo que
 * pide la tarea 8.3 para la política GENÉRICA (no específica de empleador):
 *   - "preview de política efectiva"    -> `previewMerged()` (`POST /preview`)
 *   - "versiones empresariales"         -> `listValues()`/`createValue()` con
 *     `level=1`+`company_code` (`GET|POST /values`)
 *   - "validaciones"                    -> errores 422 estándar del envelope
 *     (p. ej. `TEMPLATE_COMPANY_MISMATCH`, `COMPANY_CODE_NOT_FOUND`)
 *   - "auditoría"                       -> `CoreAuditApiService` genérico
 *     (`GET /audit/logs?entity_type=...`), no hay un endpoint de auditoría
 *     específico de contract-policies en Core.
 *
 * Validación server-side autoritativa (design.md Decision 6): un intento de
 * debilitar la política global responde 422
 * `PAYROLL_ADVANCE_EMPLOYER_POLICY_TOO_PERMISSIVE` (fase 7, tarea 7.3) — el
 * frontend NUNCA es control de seguridad, solo evita el viaje redondo con
 * los mismos rangos (`max_advance_pct<=30`, `max_concurrent==1`).
 */
export interface EmployerPayrollProductActivateRequest {
  /** Porcentaje máximo del salario (0-30, techo global CO). Default backend: 30.0. */
  max_advance_pct?: number;
  /** Día del mes en que se realiza el descuento de nómina (1-31). */
  payroll_day?: number | null;
  /** Máximo de anticipos activos simultáneos por empleado (fijo en 1 para CO). Default backend: 1. */
  max_concurrent?: number;
  terms_version?: string | null;
}

export interface EmployerPayrollProductPatchRequest {
  max_advance_pct?: number | null;
  payroll_day?: number | null;
  max_concurrent?: number | null;
  terms_version?: string | null;
  is_active?: boolean | null;
}

export interface EmployerPayrollProductDto {
  id: string;
  employer_id: string;
  is_active: boolean;
  max_advance_pct: number;
  payroll_day: number | null;
  max_concurrent: number;
  terms_version: string | null;
  activated_by: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreEmployerPayrollPolicyApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/employers`;
  }

  /** `POST /employers/{employerId}/payroll-advance-product`. 409 con el existente si ya hay uno activo. */
  activate(
    employerId: string,
    body: EmployerPayrollProductActivateRequest = {},
  ): Observable<ApiEnvelope<EmployerPayrollProductDto>> {
    return this.http.post<ApiEnvelope<EmployerPayrollProductDto>>(
      `${this.base}/${employerId}/payroll-advance-product`,
      body,
    );
  }

  /** `GET /employers/{employerId}/payroll-advance-product`. 404 si no hay producto activo. */
  get(employerId: string): Observable<ApiEnvelope<EmployerPayrollProductDto>> {
    return this.http.get<ApiEnvelope<EmployerPayrollProductDto>>(
      `${this.base}/${employerId}/payroll-advance-product`,
    );
  }

  /** `PATCH /employers/{employerId}/payroll-advance-product`. */
  update(
    employerId: string,
    body: EmployerPayrollProductPatchRequest,
  ): Observable<ApiEnvelope<EmployerPayrollProductDto>> {
    return this.http.patch<ApiEnvelope<EmployerPayrollProductDto>>(
      `${this.base}/${employerId}/payroll-advance-product`,
      body,
    );
  }
}
