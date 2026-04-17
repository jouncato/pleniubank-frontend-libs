import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  ClientContractCreateRequest,
  ClientContractDto,
  ClientContractPatchRequest,
  CompanyCodeOptionDto,
} from './core-types';

export interface ListClientContractsParams {
  company_code: string;
  customer_id?: string | null;
  cursor?: string | null;
  limit?: number;
  include_terminated?: boolean;
  status?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreClientContractsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/client-contracts`;
  }

  list(params: ListClientContractsParams): Observable<ApiEnvelope<ClientContractDto[]>> {
    let hp = new HttpParams().set('company_code', params.company_code);
    if (params.customer_id) {
      hp = hp.set('customer_id', params.customer_id);
    }
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.include_terminated) {
      hp = hp.set('include_terminated', 'true');
    }
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(this.base, { params: hp });
  }

  getById(contractId: string): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.get<ApiEnvelope<ClientContractDto>>(`${this.base}/${contractId}`);
  }

  listAllowedCompanyCodes(): Observable<ApiEnvelope<CompanyCodeOptionDto[]>> {
    return this.http.get<ApiEnvelope<CompanyCodeOptionDto[]>>(`${this.base}/company-codes`);
  }

  patch(contractId: string, body: ClientContractPatchRequest): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.patch<ApiEnvelope<ClientContractDto>>(`${this.base}/${contractId}`, body);
  }

  create(body: ClientContractCreateRequest): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.post<ApiEnvelope<ClientContractDto>>(this.base, body);
  }

  /**
   * Lists financial products assigned to the authenticated beneficiary (customer portal).
   * Resolves company_code server-side via the session's sub-enterprise, so no params are needed.
   */
  listMyAssignedContracts(options: {
    cursor?: string | null;
    limit?: number;
    includeTerminated?: boolean;
  } = {}): Observable<ApiEnvelope<ClientContractDto[]>> {
    let hp = new HttpParams();
    if (options.cursor) {
      hp = hp.set('cursor', options.cursor);
    }
    if (options.limit != null) {
      hp = hp.set('limit', String(options.limit));
    }
    if (options.includeTerminated) {
      hp = hp.set('include_terminated', 'true');
    }
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(`${this.base}/me`, { params: hp });
  }
}
