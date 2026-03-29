import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PaymentHubKey, PaymentHubKeyRequest } from 'paymenthub-domain';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

@Injectable({ providedIn: 'root' })
export class PaymentHubKeysApiService {
  constructor(
    private readonly phHttp: PaymentHubHttpService,
    private readonly auth: PaymentHubAuthService,
    private readonly ctx: PaymentHubContext,
  ) {}

  createKey(body: PaymentHubKeyRequest, idempotencyKey: string): Observable<PaymentHubKey> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubKey>(`${this.ctx.requireBaseUrl()}/v1/keys`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
        }),
      ),
    );
  }

  getKey(keyId: string): Observable<PaymentHubKey> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.get<PaymentHubKey>(
          `${this.ctx.requireBaseUrl()}/v1/keys/${encodeURIComponent(keyId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
    );
  }
}
