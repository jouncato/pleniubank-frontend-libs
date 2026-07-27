import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export interface CoreContractExceptionDto {
  id: string;
  contract_id: string;
  arrangement_id: string | null;
  exception_type: string;
  status: string;
  approval_level: string;
  requested_by: string;
  requested_at: string;
  justification: string;
  exception_details: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  executed_by: string | null;
  executed_at: string | null;
  execution_result: Record<string, unknown> | null;
}

export interface CoreExceptionRequestPayload {
  exception_type: string;
  justification: string;
  exception_details: Record<string, unknown>;
  arrangement_id?: string;
}

export interface CoreApproveExceptionPayload {
  action: 'APPROVE' | 'REJECT';
  approval_notes?: string;
}

export interface CoreExecuteExceptionPayload {
  execution_notes?: string;
}

export interface CoreContractExceptionsListParams {
  contractId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class CoreContractExceptionsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = coreAdminV1Base(apiConfig);
  }

  requestException(
    contractId: string,
    payload: CoreExceptionRequestPayload,
  ): Observable<ApiEnvelope<CoreContractExceptionDto>> {
    return this.http.post<ApiEnvelope<CoreContractExceptionDto>>(
      `${this.base}/client-contracts/${encodeURIComponent(contractId)}/exception-request`,
      payload,
    );
  }

  listExceptions(
    params: CoreContractExceptionsListParams = {},
  ): Observable<ApiEnvelope<CoreContractExceptionDto[]>> {
    let httpParams = new HttpParams();
    if (params.contractId) httpParams = httpParams.set('contract_id', params.contractId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset != null) httpParams = httpParams.set('offset', String(params.offset));
    return this.http.get<ApiEnvelope<CoreContractExceptionDto[]>>(`${this.base}/contract-exceptions`, {
      params: httpParams,
    });
  }

  getException(id: string): Observable<ApiEnvelope<CoreContractExceptionDto>> {
    return this.http.get<ApiEnvelope<CoreContractExceptionDto>>(`${this.base}/contract-exceptions/${encodeURIComponent(id)}`);
  }

  approveException(
    id: string,
    payload: CoreApproveExceptionPayload,
  ): Observable<ApiEnvelope<CoreContractExceptionDto>> {
    return this.http.patch<ApiEnvelope<CoreContractExceptionDto>>(
      `${this.base}/contract-exceptions/${encodeURIComponent(id)}/approve`,
      payload,
    );
  }

  executeException(
    id: string,
    payload: CoreExecuteExceptionPayload,
  ): Observable<ApiEnvelope<CoreContractExceptionDto>> {
    return this.http.post<ApiEnvelope<CoreContractExceptionDto>>(
      `${this.base}/contract-exceptions/${encodeURIComponent(id)}/execute`,
      payload,
    );
  }
}
