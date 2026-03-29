import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  PaymentHubRail,
  PaymentHubRailSendRequest,
  PaymentHubRailSendResponse,
} from 'paymenthub-domain';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

@Injectable({ providedIn: 'root' })
export class PaymentHubRailsApiService {
  constructor(
    private readonly phHttp: PaymentHubHttpService,
    private readonly auth: PaymentHubAuthService,
    private readonly ctx: PaymentHubContext,
  ) {}

  listRails(currency?: string): Observable<PaymentHubRail[]> {
    let params = new HttpParams();
    if (currency?.trim()) {
      params = params.set('currency', currency.trim());
    }
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.get<PaymentHubRail[]>(`${this.ctx.requireBaseUrl()}/v1/rails`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
      ),
    );
  }

  sendToRail(
    railId: string,
    body: PaymentHubRailSendRequest,
    idempotencyKey: string,
  ): Observable<PaymentHubRailSendResponse> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.post<PaymentHubRailSendResponse>(
          `${this.ctx.requireBaseUrl()}/v1/rails/${encodeURIComponent(railId)}/send`,
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
