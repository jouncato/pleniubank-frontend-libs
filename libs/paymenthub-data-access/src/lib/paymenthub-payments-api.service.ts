import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

@Injectable({ providedIn: 'root' })
export class PaymentHubPaymentsApiService {
  constructor(
    private readonly phHttp: PaymentHubHttpService,
    private readonly auth: PaymentHubAuthService,
    private readonly ctx: PaymentHubContext,
  ) {}

  listPayments(filters: PaymentHubListFilters = {}): Observable<PaymentHubPayment[]> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) => {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.country) params = params.set('country', filters.country);
        if (filters.limit != null) params = params.set('limit', String(filters.limit));
        return this.phHttp.client.get<PaymentHubPayment[] | { items?: PaymentHubPayment[] }>(
          `${this.ctx.requireBaseUrl()}/v1/payments`,
          { headers: { Authorization: `Bearer ${token}` }, params },
        );
      }),
      map((res) => (Array.isArray(res) ? res : (res as { items?: PaymentHubPayment[] }).items ?? [])),
    );
  }

  createPayment(body: PaymentHubPaymentRequest, idempotencyKey: string): Observable<PaymentHubPayment> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubPayment>(`${this.ctx.requireBaseUrl()}/v1/payments`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
        }),
      ),
    );
  }

  getPayment(paymentId: string): Observable<PaymentHubPayment> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.get<PaymentHubPayment>(
          `${this.ctx.requireBaseUrl()}/v1/payments/${encodeURIComponent(paymentId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
    );
  }

  cancelPayment(paymentId: string, idempotencyKey: string): Observable<PaymentHubPayment> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubPayment>(
          `${this.ctx.requireBaseUrl()}/v1/payments/${encodeURIComponent(paymentId)}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Idempotency-Key': idempotencyKey,
            },
          },
        ),
      ),
    );
  }

  simulatePayment(paymentId: string, body: PaymentHubScenarioRequest): Observable<PaymentHubPayment> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubPayment>(
          `${this.ctx.requireBaseUrl()}/v1/payments/${encodeURIComponent(paymentId)}/simulate`,
          body,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
    );
  }
}
