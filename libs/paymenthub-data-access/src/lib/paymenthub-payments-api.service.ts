import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  PaymentHubPayment,
  PaymentHubPaymentRequest,
  PaymentHubScenarioRequest,
} from 'paymenthub-domain';

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
