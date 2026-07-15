import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base, corePublicV1Base } from './core-api-base';
import { fallbackStatementFilename, parseContentDispositionFilename } from './content-disposition.util';
import type { StatementFilters, StatementResponse } from 'core-domain';

export interface StatementExportResult {
  blob: Blob;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class CoreStatementsApiService {
  private readonly base: string;
  /** Base pública (customer-scoped) — `b2c-statements` (openspec `b2c-persona-closure`). */
  private readonly customerBase: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/statements`;
    this.customerBase = `${corePublicV1Base(apiConfig)}/statements`;
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
    let params = new HttpParams()
      .set('account_id', filters.account_id)
      .set('format', 'csv');
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }

  /** Download statement as PDF blob. */
  exportPdf(filters: Omit<StatementFilters, 'limit' | 'product_type'>): Observable<Blob> {
    let params = new HttpParams()
      .set('account_id', filters.account_id)
      .set('format', 'pdf');
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }

  /** Extracto propio del cliente (rol CUSTOMER/USER, guard de titularidad en backend). */
  getCustomerStatement(
    accountId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<ApiEnvelope<StatementResponse>> {
    let params = new HttpParams().set('account_id', accountId);
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);
    return this.http.get<ApiEnvelope<StatementResponse>>(this.customerBase, { params });
  }

  /** Descarga del extracto propio (CSV/PDF) como blob + nombre de archivo. */
  exportCustomerStatement(
    accountId: string,
    dateFrom: string,
    dateTo: string,
    format: 'csv' | 'pdf',
  ): Observable<StatementExportResult> {
    const params = new HttpParams()
      .set('account_id', accountId)
      .set('date_from', dateFrom)
      .set('date_to', dateTo)
      .set('format', format);
    return this.http
      .get(`${this.customerBase}/export`, { params, responseType: 'blob', observe: 'response' })
      .pipe(
        map((response) => {
          const blob = response.body as Blob;
          const filename =
            parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
            fallbackStatementFilename(accountId, `${dateFrom}_${dateTo}`, format);
          return { blob, filename };
        }),
      );
  }
}
