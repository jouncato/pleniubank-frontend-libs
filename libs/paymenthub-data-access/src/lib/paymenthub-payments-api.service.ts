import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PaymentHubPayment,
  PaymentHubPaymentRequest,
  PaymentHubScenarioRequest,
} from 'paymenthub-domain';

export interface PaymentHubListFilters {
  status?: string;
  country?: string;
  limit?: number;
}

import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { paymenthubV1Base } from './paymenthub-api-base';

@Injectable({ providedIn: 'root' })
export class PaymentHubPaymentsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = paymenthubV1Base(apiConfig);
  }

  listPayments(filters: PaymentHubListFilters = {}): Observable<PaymentHubPayment[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.limit != null) params = params.set('limit', String(filters.limit));
    return this.http
      .get<PaymentHubPayment[] | { items?: PaymentHubPayment[] }>(`${this.base}/payments`, { params })
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res as { items?: PaymentHubPayment[] }).items ?? [])),
      );
  }

  createPayment(body: PaymentHubPaymentRequest, idempotencyKey: string): Observable<PaymentHubPayment> {
    return this.http.post<PaymentHubPayment>(`${this.base}/payments`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  getPayment(paymentId: string): Observable<PaymentHubPayment> {
    return this.http.get<PaymentHubPayment>(`${this.base}/payments/${encodeURIComponent(paymentId)}`);
  }

  cancelPayment(paymentId: string, idempotencyKey: string): Observable<PaymentHubPayment> {
    return this.http.post<PaymentHubPayment>(
      `${this.base}/payments/${encodeURIComponent(paymentId)}/cancel`,
      {},
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }

  simulatePayment(paymentId: string, body: PaymentHubScenarioRequest): Observable<PaymentHubPayment> {
    return this.http.post<PaymentHubPayment>(
      `${this.base}/payments/${encodeURIComponent(paymentId)}/simulate`,
      body,
    );
  }
}
