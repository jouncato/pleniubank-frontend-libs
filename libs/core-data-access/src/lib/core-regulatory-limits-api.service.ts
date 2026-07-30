import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import {
  DecideRegulatoryLimitsChangeRequestBody,
  ProposeRegulatoryLimitsChangeRequestBody,
  RegulatoryLimitsChangeRequestDto,
  RegulatoryLimitsChangeRequestStatus,
  RegulatoryLimitsResponse,
} from '@pleniu/core-domain';
import { coreAdminV1Base } from './core-api-base';

export interface RegulatoryLimitsChangeRequestListParams {
  status?: RegulatoryLimitsChangeRequestStatus | null;
  country_code?: string | null;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CoreRegulatoryLimitsApiService {
  private readonly baseUrl: string;
  private readonly changeRequestsUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const base = coreAdminV1Base(apiConfig);
    this.baseUrl = `${base}/regulatory-limits`;
    this.changeRequestsUrl = `${base}/regulatory-limits-change-requests`;
  }

  getRegulatoryLimits(countryCode: string = 'CO'): Observable<ApiEnvelope<RegulatoryLimitsResponse>> {
    let params = new HttpParams();
    if (countryCode) params = params.set('country_code', countryCode);
    return this.http.get<ApiEnvelope<RegulatoryLimitsResponse>>(this.baseUrl, { params });
  }

  propose(
    body: ProposeRegulatoryLimitsChangeRequestBody,
  ): Observable<ApiEnvelope<RegulatoryLimitsChangeRequestDto>> {
    return this.http.post<ApiEnvelope<RegulatoryLimitsChangeRequestDto>>(this.changeRequestsUrl, body);
  }

  list(
    params: RegulatoryLimitsChangeRequestListParams = {},
  ): Observable<ApiEnvelope<RegulatoryLimitsChangeRequestDto[]>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.country_code) httpParams = httpParams.set('country_code', params.country_code);
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<RegulatoryLimitsChangeRequestDto[]>>(this.changeRequestsUrl, {
      params: httpParams,
    });
  }

  get(id: string): Observable<ApiEnvelope<RegulatoryLimitsChangeRequestDto>> {
    return this.http.get<ApiEnvelope<RegulatoryLimitsChangeRequestDto>>(`${this.changeRequestsUrl}/${id}`);
  }

  approve(
    id: string,
    body: DecideRegulatoryLimitsChangeRequestBody,
  ): Observable<ApiEnvelope<RegulatoryLimitsChangeRequestDto>> {
    return this.http.post<ApiEnvelope<RegulatoryLimitsChangeRequestDto>>(
      `${this.changeRequestsUrl}/${id}/approve`,
      body,
    );
  }

  reject(
    id: string,
    body: DecideRegulatoryLimitsChangeRequestBody,
  ): Observable<ApiEnvelope<RegulatoryLimitsChangeRequestDto>> {
    return this.http.post<ApiEnvelope<RegulatoryLimitsChangeRequestDto>>(
      `${this.changeRequestsUrl}/${id}/reject`,
      body,
    );
  }
}
