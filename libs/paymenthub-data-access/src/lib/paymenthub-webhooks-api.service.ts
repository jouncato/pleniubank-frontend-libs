import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaymentHubWebhookRegistration,
  PaymentHubWebhookRegistrationResponse,
} from 'paymenthub-domain';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { paymenthubV1Base } from './paymenthub-api-base';

@Injectable({ providedIn: 'root' })
export class PaymentHubWebhooksApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = paymenthubV1Base(apiConfig);
  }

  registerWebhook(
    body: PaymentHubWebhookRegistration,
    idempotencyKey: string,
  ): Observable<PaymentHubWebhookRegistrationResponse> {
    return this.http.post<PaymentHubWebhookRegistrationResponse>(
      `${this.base}/webhooks/register`,
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }
}
