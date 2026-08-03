import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

/**
 * OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.2): este
 * cliente sigue apuntando a `POST /credit-scores/payroll-eligibility`
 * (`credit_scores_router.get_payroll_eligibility` en Core), cuyo schema de
 * request/response NO cambió en este cambio — Core lo confirma
 * explícitamente en el docstring del endpoint ("legacy conserva su forma
 * reducida ya consumida"). Internamente el endpoint ahora usa el mismo
 * `PayrollAdvancePolicyEvaluator` canónico cuando hay perfil laboral
 * verificado (fase 3, tarea 3.4), así que `is_eligible`/`max_advance_amount`
 * ya reflejan el default global de la política (40%; otros límites se resuelven por política) sin que este DTO
 * necesite cambios.
 *
 * Para la respuesta canónica COMPLETA (política efectiva, motivos, cupos
 * mensuales, versión) usar en su lugar
 * `CorePayrollAdvancesApiService.getEligibility()`
 * (`GET /payroll-advances/eligibility`, aditivo — no reemplaza este cliente).
 */
export interface PayrollEligibilityRequest {
  customer_id: string;
  employment_tenure_months?: number | null;
  salary_amount?: number | null;
}

export interface PayrollEligibilityResponse {
  customer_id: string;
  max_advance_amount: number;
  denomination: string;
  score: number;
  is_eligible: boolean;
  estimated_payroll_deduction_date?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreScoringApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/credit-scores`;
  }

  getPayrollEligibility(body: PayrollEligibilityRequest): Observable<ApiEnvelope<PayrollEligibilityResponse>> {
    return this.http.post<ApiEnvelope<PayrollEligibilityResponse>>(
      `${this.base}/payroll-eligibility`,
      body,
    );
  }
}
