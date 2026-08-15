import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

import type { AccountDto } from 'core-domain';

export interface ListInternalAccountsParams {
  cursor?: string | null;
  limit?: number;
}

export interface CreateInternalAccountRequest {
  name: string;
  balance_address: string;
  denomination?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class CoreInternalAccountsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/internal-accounts`;
  }

  list(params: ListInternalAccountsParams): Observable<ApiEnvelope<AccountDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<AccountDto[]>>(this.base, { params: hp });
  }

  create(body: CreateInternalAccountRequest): Observable<ApiEnvelope<AccountDto>> {
    return this.http.post<ApiEnvelope<AccountDto>>(this.base, body);
  }
}
