import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentHubKey, PaymentHubKeyRequest } from 'paymenthub-domain';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { paymenthubV1Base } from './paymenthub-api-base';

@Injectable({ providedIn: 'root' })
export class PaymentHubKeysApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = paymenthubV1Base(apiConfig);
  }

  createKey(body: PaymentHubKeyRequest, idempotencyKey: string): Observable<PaymentHubKey> {
    return this.http.post<PaymentHubKey>(`${this.base}/keys`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  getKey(keyId: string): Observable<PaymentHubKey> {
    return this.http.get<PaymentHubKey>(`${this.base}/keys/${encodeURIComponent(keyId)}`);
  }
}
