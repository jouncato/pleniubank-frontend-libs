import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaymentHubRail,
  PaymentHubRailSendRequest,
  PaymentHubRailSendResponse,
} from 'paymenthub-domain';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { paymenthubV1Base } from './paymenthub-api-base';

@Injectable({ providedIn: 'root' })
export class PaymentHubRailsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = paymenthubV1Base(apiConfig);
  }

  listRails(currency?: string): Observable<PaymentHubRail[]> {
    let params = new HttpParams();
    if (currency?.trim()) {
      params = params.set('currency', currency.trim());
    }
    return this.http.get<PaymentHubRail[]>(`${this.base}/rails`, { params });
  }

  sendToRail(
    railId: string,
    body: PaymentHubRailSendRequest,
    idempotencyKey: string,
  ): Observable<PaymentHubRailSendResponse> {
    return this.http.post<PaymentHubRailSendResponse>(
      `${this.base}/rails/${encodeURIComponent(railId)}/send`,
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }
}
