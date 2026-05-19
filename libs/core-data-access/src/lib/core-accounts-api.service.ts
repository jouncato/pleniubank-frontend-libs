import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  AccountBalancePayloadDto,
  AccountDto,
  AccountMovementItemDto,
  AddAccountFlagRequest,
  CreateAccountRequest,
  UpdateAccountRequest,
} from 'core-domain';

export interface ListAccountsParams {
  cursor?: string | null;
  limit?: number;
  customer_id?: string | null;
  product_id?: string | null;
  status?: string | null;
}

export interface GetBalancesParams {
  /** ISO 8601 datetime (UTC) para consulta point-in-time. */
  at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreAccountsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/accounts`;
  }

  list(params: ListAccountsParams = {}): Observable<ApiEnvelope<AccountDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.customer_id) {
      hp = hp.set('customer_id', params.customer_id);
    }
    if (params.product_id) {
      hp = hp.set('product_id', params.product_id);
    }
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    return this.http.get<ApiEnvelope<AccountDto[]>>(this.base, { params: hp });
  }

  getById(accountId: string): Observable<ApiEnvelope<AccountDto>> {
    return this.http.get<ApiEnvelope<AccountDto>>(`${this.base}/${accountId}`);
  }

  create(body: CreateAccountRequest): Observable<ApiEnvelope<AccountDto>> {
    return this.http.post<ApiEnvelope<AccountDto>>(this.base, body);
  }

  update(accountId: string, body: UpdateAccountRequest): Observable<ApiEnvelope<AccountDto>> {
    return this.http.put<ApiEnvelope<AccountDto>>(`${this.base}/${accountId}`, body);
  }

  listVersions(accountId: string): Observable<ApiEnvelope<AccountDto[]>> {
    return this.http.get<ApiEnvelope<AccountDto[]>>(`${this.base}/${accountId}/versions`);
  }

  addFlag(accountId: string, body: AddAccountFlagRequest): Observable<ApiEnvelope<AccountDto>> {
    return this.http.post<ApiEnvelope<AccountDto>>(`${this.base}/${accountId}/flags`, body);
  }

  removeFlag(accountId: string, flag: string): Observable<ApiEnvelope<AccountDto>> {
    return this.http.delete<ApiEnvelope<AccountDto>>(
      `${this.base}/${accountId}/flags/${encodeURIComponent(flag)}`,
    );
  }

  getBalances(accountId: string, params: GetBalancesParams = {}): Observable<ApiEnvelope<AccountBalancePayloadDto>> {
    let hp = new HttpParams();
    if (params.at) {
      hp = hp.set('at', params.at);
    }
    return this.http.get<ApiEnvelope<AccountBalancePayloadDto>>(`${this.base}/${accountId}/balances`, {
      params: hp,
    });
  }

  /** Últimos movimientos del libro para la cuenta (Core `GET .../movements`). */
  listMovements(accountId: string, limit = 5): Observable<ApiEnvelope<AccountMovementItemDto[]>> {
    const hp = new HttpParams().set('limit', String(limit));
    return this.http.get<ApiEnvelope<AccountMovementItemDto[]>>(`${this.base}/${accountId}/movements`, {
      params: hp,
    });
  }
}
