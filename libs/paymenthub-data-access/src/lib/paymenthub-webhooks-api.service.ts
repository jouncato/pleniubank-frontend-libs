import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  PaymentHubWebhookRegistration,
  PaymentHubWebhookRegistrationResponse,
} from 'paymenthub-domain';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

@Injectable({ providedIn: 'root' })
export class PaymentHubWebhooksApiService {
  constructor(
    private readonly phHttp: PaymentHubHttpService,
    private readonly auth: PaymentHubAuthService,
    private readonly ctx: PaymentHubContext,
  ) {}

  registerWebhook(
    body: PaymentHubWebhookRegistration,
    idempotencyKey: string,
  ): Observable<PaymentHubWebhookRegistrationResponse> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubWebhookRegistrationResponse>(
          `${this.ctx.requireBaseUrl()}/v1/webhooks/register`,
          body,
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
}
