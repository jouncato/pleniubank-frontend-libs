import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

import type { ClientContractDto, CompanyCodeOptionDto } from './core-types';

export interface ListClientContractsParams {
  company_code: string;
  customer_id?: string | null;
  cursor?: string | null;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CoreClientContractsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${apiConfig.coreBaseUrl}/api/v1/client-contracts`;
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
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(this.base, { params: hp });
  }

  getById(contractId: string): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.get<ApiEnvelope<ClientContractDto>>(`${this.base}/${contractId}`);
  }

  listAllowedCompanyCodes(): Observable<ApiEnvelope<CompanyCodeOptionDto[]>> {
    return this.http.get<ApiEnvelope<CompanyCodeOptionDto[]>>(`${this.base}/company-codes`);
  }
}
