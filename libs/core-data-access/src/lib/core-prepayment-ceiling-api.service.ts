import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export type PrepaymentCeilingChangeRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type PrepaymentCeilingPenaltyBasis = 'PERCENTAGE_OF_BALANCE' | 'ONE_MONTH_INTEREST';

export const PREPAYMENT_CEILING_READ_ROLES = [
  'admin',
  'employee',
  'sre',
  'devops',
  'risk_officer',
  'compliance_officer',
] as const;

export const PREPAYMENT_CEILING_PROPOSE_ROLES = PREPAYMENT_CEILING_READ_ROLES;

export const PREPAYMENT_CEILING_MANAGE_ROLES = ['admin', 'risk_officer', 'compliance_officer'] as const;

export const PREPAYMENT_CEILING_RISK_ONLY_ROLE = 'risk_officer' as const;

export interface PrepaymentCeilingFieldValues {
  max_penalty_rate: string | null;
  max_penalty_basis: PrepaymentCeilingPenaltyBasis | string | null;
  legal_ref: string | null;
}

export interface PrepaymentCeilingChangeRequestDto {
  id: string;
  jurisdiction: string;
  product_type: string;
  status: PrepaymentCeilingChangeRequestStatus | string;
  proposed_by: string;
  proposed_at: string;
  reason: string;
  current_values: PrepaymentCeilingFieldValues;
  proposed_values: PrepaymentCeilingFieldValues;
  effective_from: string;
  increases_ceiling: boolean;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  new_value_id: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposePrepaymentCeilingChangeRequestBody {
  jurisdiction?: string;
  product_type: string;
  effective_from: string;
  reason: string;
  max_penalty_rate: number;
  max_penalty_basis?: PrepaymentCeilingPenaltyBasis;
  legal_ref?: string;
}

export interface DecidePrepaymentCeilingChangeRequestBody {
  reason: string;
}

export interface PrepaymentCeilingChangeRequestListParams {
  status?: PrepaymentCeilingChangeRequestStatus | string | null;
  jurisdiction?: string | null;
  product_type?: string | null;
  limit?: number;
}

export interface PrepaymentCeilingVersionDto {
  id: string | null;
  max_penalty_rate: string;
  max_penalty_basis: PrepaymentCeilingPenaltyBasis | string;
  legal_ref: string | null;
  effective_from: string;
  effective_to: string | null;
}

export interface PrepaymentCeilingVersionListParams {
  jurisdiction?: string;
  product_type: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CorePrepaymentCeilingApiService {
  private readonly changeRequestsBase: string;
  private readonly versionsBase: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const base = coreAdminV1Base(apiConfig);
    this.changeRequestsBase = `${base}/prepayment-ceiling-change-requests`;
    this.versionsBase = `${base}/prepayment-ceiling-config/versions`;
  }

  propose(
    body: ProposePrepaymentCeilingChangeRequestBody,
  ): Observable<ApiEnvelope<PrepaymentCeilingChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PrepaymentCeilingChangeRequestDto>>(this.changeRequestsBase, body);
  }

  list(
    params: PrepaymentCeilingChangeRequestListParams = {},
  ): Observable<ApiEnvelope<PrepaymentCeilingChangeRequestDto[]>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.jurisdiction) httpParams = httpParams.set('jurisdiction', params.jurisdiction);
    if (params.product_type) httpParams = httpParams.set('product_type', params.product_type);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PrepaymentCeilingChangeRequestDto[]>>(this.changeRequestsBase, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<ApiEnvelope<PrepaymentCeilingChangeRequestDto>> {
    return this.http.get<ApiEnvelope<PrepaymentCeilingChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}`,
    );
  }

  approve(
    id: string,
    body: DecidePrepaymentCeilingChangeRequestBody,
  ): Observable<ApiEnvelope<PrepaymentCeilingChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PrepaymentCeilingChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}/approve`,
      body,
    );
  }

  reject(
    id: string,
    body: DecidePrepaymentCeilingChangeRequestBody,
  ): Observable<ApiEnvelope<PrepaymentCeilingChangeRequestDto>> {
    return this.http.post<ApiEnvelope<PrepaymentCeilingChangeRequestDto>>(
      `${this.changeRequestsBase}/${encodeURIComponent(id)}/reject`,
      body,
    );
  }

  listVersions(params: PrepaymentCeilingVersionListParams): Observable<ApiEnvelope<PrepaymentCeilingVersionDto[]>> {
    let httpParams = new HttpParams().set('product_type', params.product_type);
    if (params.jurisdiction) httpParams = httpParams.set('jurisdiction', params.jurisdiction);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<PrepaymentCeilingVersionDto[]>>(this.versionsBase, {
      params: httpParams,
    });
  }
}
