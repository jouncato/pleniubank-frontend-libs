import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  CreateCustomerRequest,
  CustomerCreditHistoryDto,
  CustomerDto,
  UpdateCustomerRequest,
} from './core-types';

export interface ListCustomersParams {
  cursor?: string | null;
  limit?: number;
  document_type?: string | null;
  q?: string | null;
  document_number?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreCustomersApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/customers`;
  }

  list(params: ListCustomersParams = {}): Observable<ApiEnvelope<CustomerDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.document_type) {
      hp = hp.set('document_type', params.document_type);
    }
    if (params.q) {
      hp = hp.set('q', params.q);
    }
    if (params.document_number) {
      hp = hp.set('document_number', params.document_number);
    }
    return this.http.get<ApiEnvelope<CustomerDto[]>>(this.base, { params: hp });
  }

  search(params: {
    query: string;
    limit?: number;
    document_number?: string | null;
  }): Observable<ApiEnvelope<CustomerDto[]>> {
    return this.list({
      q: params.query,
      document_number: params.document_number,
      limit: params.limit ?? 10,
    });
  }

  getById(customerId: string): Observable<ApiEnvelope<CustomerDto>> {
    return this.http.get<ApiEnvelope<CustomerDto>>(`${this.base}/${customerId}`);
  }

  create(body: CreateCustomerRequest): Observable<ApiEnvelope<CustomerDto>> {
    return this.http.post<ApiEnvelope<CustomerDto>>(this.base, body);
  }

  update(customerId: string, body: UpdateCustomerRequest): Observable<ApiEnvelope<CustomerDto>> {
    return this.http.put<ApiEnvelope<CustomerDto>>(`${this.base}/${customerId}`, body);
  }

  listVersions(customerId: string): Observable<ApiEnvelope<CustomerDto[]>> {
    return this.http.get<ApiEnvelope<CustomerDto[]>>(`${this.base}/${customerId}/versions`);
  }

  getCreditHistory(customerId: string): Observable<ApiEnvelope<CustomerCreditHistoryDto>> {
    return this.http.get<ApiEnvelope<CustomerCreditHistoryDto>>(`${this.base}/${customerId}/credit-history`);
  }
}
