import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';
import type {
  TransactionDetailResponse,
  TransactionHubFilters,
  TransactionHubListResponse,
} from 'core-domain';

@Injectable({ providedIn: 'root' })
export class CoreTransactionHubApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/hub/transactions`;
  }

  /** Listado paginado con filtros combinables y cursor. */
  list(filters: TransactionHubFilters): Observable<ApiEnvelope<TransactionHubListResponse>> {
    let params = new HttpParams();

    if (filters.domain?.length) {
      for (const v of filters.domain) {
        params = params.append('domain', v);
      }
    }
    if (filters.source_system?.length) {
      for (const v of filters.source_system) {
        params = params.append('source_system', v);
      }
    }
    if (filters.transaction_type?.length) {
      for (const v of filters.transaction_type) {
        params = params.append('transaction_type', v);
      }
    }
    if (filters.status?.length) {
      for (const v of filters.status) {
        params = params.append('status', v);
      }
    }
    if (filters.product_type) {
      params = params.set('product_type', filters.product_type);
    }
    if (filters.product_code) {
      params = params.set('product_code', filters.product_code);
    }
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    if (filters.min_amount) {
      params = params.set('min_amount', filters.min_amount);
    }
    if (filters.max_amount) {
      params = params.set('max_amount', filters.max_amount);
    }
    if (filters.currency) {
      params = params.set('currency', filters.currency);
    }
    if (filters.correlation_id) {
      params = params.set('correlation_id', filters.correlation_id);
    }
    if (filters.cursor) {
      params = params.set('cursor', filters.cursor);
    }
    if (filters.limit) {
      params = params.set('limit', String(filters.limit));
    }

    return this.http.get<ApiEnvelope<TransactionHubListResponse>>(this.base, { params });
  }

  /** Detalle de una transacción por su ID canónico. */
  detail(transactionId: string): Observable<ApiEnvelope<TransactionDetailResponse>> {
    return this.http.get<ApiEnvelope<TransactionDetailResponse>>(
      `${this.base}/${encodeURIComponent(transactionId)}`,
    );
  }
}
