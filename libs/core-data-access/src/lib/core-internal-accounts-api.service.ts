import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

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
    this.base = `${apiConfig.coreBaseUrl}/api/v1/internal-accounts`;
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
