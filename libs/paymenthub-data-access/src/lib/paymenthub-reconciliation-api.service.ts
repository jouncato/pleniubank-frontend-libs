import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentHubReconciliationReport } from 'paymenthub-domain';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { paymenthubV1Base } from './paymenthub-api-base';

@Injectable({ providedIn: 'root' })
export class PaymentHubReconciliationApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = paymenthubV1Base(apiConfig);
  }

  /** `date` formato YYYY-MM-DD (OpenAPI `format: date`). */
  getReport(date: string): Observable<PaymentHubReconciliationReport> {
    return this.http.get<PaymentHubReconciliationReport>(
      `${this.base}/reconciliation/${encodeURIComponent(date)}`,
    );
  }
}
