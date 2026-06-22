import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';
import type { StatementFilters, StatementResponse } from 'core-domain';

@Injectable({ providedIn: 'root' })
export class CoreStatementsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/statements`;
  }

  /** Fetch account statement for a given date range. */
  get(filters: StatementFilters): Observable<ApiEnvelope<StatementResponse>> {
    let params = new HttpParams().set('account_id', filters.account_id);
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    if (filters.product_type) {
      params = params.set('product_type', filters.product_type);
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<ApiEnvelope<StatementResponse>>(this.base, { params });
  }

  /** Download statement as CSV blob. */
  exportCsv(filters: Omit<StatementFilters, 'limit' | 'product_type'>): Observable<Blob> {
    let params = new HttpParams().set('account_id', filters.account_id);
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
