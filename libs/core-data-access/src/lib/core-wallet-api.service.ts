import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { WalletSummaryDto } from '@pleniu/core-domain';

import { corePublicV1Base } from './core-api-base';

/**
 * Wallet summary API (wallet-read-summary).
 * GET /api/v1/public/wallet/summary — single-call aggregate for the
 * customer's wallet identifier, balance and Bre-B alias.
 */
@Injectable({ providedIn: 'root' })
export class CoreWalletApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/wallet`;
  }

  getSummary(): Observable<ApiEnvelope<WalletSummaryDto>> {
    return this.http.get<ApiEnvelope<WalletSummaryDto>>(`${this.base}/summary`);
  }
}
