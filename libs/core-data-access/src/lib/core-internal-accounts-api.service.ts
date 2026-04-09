import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

import type { AccountDto } from './core-types';

export interface ListInternalAccountsParams {
  cursor?: string | null;
  limit?: number;
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
}
