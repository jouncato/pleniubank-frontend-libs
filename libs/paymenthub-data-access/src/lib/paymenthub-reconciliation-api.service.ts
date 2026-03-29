import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PaymentHubReconciliationReport } from 'paymenthub-domain';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

@Injectable({ providedIn: 'root' })
export class PaymentHubReconciliationApiService {
  constructor(
    private readonly phHttp: PaymentHubHttpService,
    private readonly auth: PaymentHubAuthService,
    private readonly ctx: PaymentHubContext,
  ) {}

  /** `date` formato YYYY-MM-DD (OpenAPI `format: date`). */
  getReport(date: string): Observable<PaymentHubReconciliationReport> {
    return this.auth.ensureAccessToken().pipe(
      switchMap((token) =>
        this.phHttp.client.get<PaymentHubReconciliationReport>(
          `${this.ctx.requireBaseUrl()}/v1/reconciliation/${encodeURIComponent(date)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
    );
  }
}
