import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export type PayrollAdvanceGlobalPolicyChangeRequestStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export const PAYROLL_ADVANCE_GLOBAL_POLICY_READ_ROLES = [
  'admin',
  'employee',
  'sre',
  'devops',
  'risk_officer',
  'compliance_officer',
] as const;

export const PAYROLL_ADVANCE_GLOBAL_POLICY_PROPOSE_ROLES = PAYROLL_ADVANCE_GLOBAL_POLICY_READ_ROLES;

export const PAYROLL_ADVANCE_GLOBAL_POLICY_MANAGE_ROLES = [
  'admin',
  'risk_officer',
  'compliance_officer',
] as const;

export const PAYROLL_ADVANCE_GLOBAL_POLICY_RISK_ONLY_ROLE = 'risk_officer' as const;

export interface PayrollAdvanceGlobalPolicyFieldValues {
  max_salary_percentage: string | null;
  min_salary_percentage: string | null;
  min_tenure_months: number | null;
  max_monthly_frequency: number | null;
  max_active_count: number | null;
  max_discount_days: number | null;
  employer_daily_limit_amount: string | null;
  /** Comisión flat del anticipo, como fracción (0.05 = 5%). Categoría
   * "pricing" -- 8vo campo canónico, agregado 2026-08-11 (auditoría sobre
   * la comisión del anticipo de nómina). */
  fee_rate: string | null;
}

export interface PayrollAdvanceGlobalPolicyChangeRequestDto {
  id: string;
  country_code: string;
  product_type: string;
  status: PayrollAdvanceGlobalPolicyChangeRequestStatus | string;
  proposed_by: string;
  proposed_at: string;
  reason: string;
  current_values: PayrollAdvanceGlobalPolicyFieldValues;
  proposed_values: PayrollAdvanceGlobalPolicyFieldValues;
  effective_from: string;
  increases_any_ceiling: boolean;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  new_value_ids: string[] | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposeGlobalPolicyChangeRequestBody {
  effective_from: string;
  reason: string;
  max_salary_percentage?: number;
  min_salary_percentage?: number;
  min_tenure_months?: number;
  max_monthly_frequency?: number;
  max_active_count?: number;
  max_discount_days?: number;
  employer_daily_limit_amount?: number;
  fee_rate?: number;
}

export interface DecideGlobalPolicyChangeRequestBody {
  reason: string;
}

export interface PayrollAdvanceGlobalPolicyChangeRequestListParams {
  status?: PayrollAdvanceGlobalPolicyChangeRequestStatus | string | null;
  country_code?: string | null;
  limit?: number;
}

export interface PayrollAdvanceGlobalPolicyVersionDto {
  id: string;
  param_key: string;
  value: unknown;
  effective_from: string | null;
  effective_to: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceGlobalPolicyApiService {
  private readonly changeRequestsBase: string;
  private readonly versionsBase: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const base = coreAdminV1Base(apiConfig);
    this.changeRequestsBase = `${base}/payroll-advance-global-policy-change-requests`;
    this.versionsBase = `${base}/payroll-advance-global-policy/versions`;
  }

  propose(
    body: ProposeGlobalPolicyChangeRequestBody,
  ): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>>(
      this.changeRequestsBase,
      body,
    );
  }

  list(
    params: PayrollAdvanceGlobalPolicyChangeRequestListParams = {},
  ): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto[]>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.country_code) httpParams = httpParams.set('country_code', params.country_code);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto[]>>(
      this.changeRequestsBase,
      { params: httpParams },
    );
  }

  getById(id: string): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}`,
    );
  }

  approve(
    id: string,
    body: DecideGlobalPolicyChangeRequestBody,
  ): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}/approve`,
      body,
    );
  }

  reject(
    id: string,
    body: DecideGlobalPolicyChangeRequestBody,
  ): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceGlobalPolicyChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}/reject`,
      body,
    );
  }

  listVersions(
    params: { country_code?: string; limit?: number } = {},
  ): Observable<ApiEnvelope<PayrollAdvanceGlobalPolicyVersionDto[]>> {
    let httpParams = new HttpParams();
    if (params.country_code) httpParams = httpParams.set('country_code', params.country_code);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PayrollAdvanceGlobalPolicyVersionDto[]>>(this.versionsBase, {
      params: httpParams,
    });
  }
}
