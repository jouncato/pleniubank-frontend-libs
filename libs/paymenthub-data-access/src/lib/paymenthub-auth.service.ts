import { HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PaymentHubTokenResponse } from 'paymenthub-domain';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { PaymentHubHttpService } from './paymenthub-http.service';

const EXPIRY_BUFFER_MS = 60_000;

/**
 * OAuth2 `client_credentials` contra `POST /oauth/token` (OpenAPI PaymentHub).
 * Cachea `access_token` hasta near-expiry y renueva al expirar.
 */
@Injectable({ providedIn: 'root' })
export class PaymentHubAuthService {
  private accessToken: string | null = null;
  private expiresAtMs = 0;

  constructor(
    private readonly phHttp: PaymentHubHttpService,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  /** Invalida cache (p. ej. tras 401). */
  invalidateToken(): void {
    this.accessToken = null;
    this.expiresAtMs = 0;
  }

  /**
   * Token válido cacheado o nuevo via client_credentials.
   * Requiere `paymentHubBaseUrl`, `paymentHubClientId`, `paymentHubClientSecret`.
   */
  ensureAccessToken(): Observable<string> {
    const base = this.apiConfig.paymentHubBaseUrl?.trim();
    const clientId = this.apiConfig.paymentHubClientId;
    const clientSecret = this.apiConfig.paymentHubClientSecret;
    if (!base || !clientId || !clientSecret) {
      return throwError(
        () =>
          new Error(
            'PaymentHub OAuth: configure paymentHubBaseUrl, paymentHubClientId y paymentHubClientSecret en API_CONFIG.',
          ),
      );
    }

    const now = Date.now();
    if (this.accessToken && now < this.expiresAtMs - EXPIRY_BUFFER_MS) {
      return of(this.accessToken);
    }

    const url = `${base.replace(/\/$/, '')}/oauth/token`;
    let body = new HttpParams()
      .set('client_id', clientId)
      .set('client_secret', clientSecret)
      .set('grant_type', 'client_credentials');
    const scope = this.apiConfig.paymentHubOAuthScope?.trim();
    if (scope) {
      body = body.set('scope', scope);
    }

    return this.phHttp.client
      .post<PaymentHubTokenResponse>(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((res) => {
          this.accessToken = res.access_token;
          const ttlSec = res.expires_in ?? 3600;
          this.expiresAtMs = Date.now() + ttlSec * 1000;
        }),
        map((res) => res.access_token),
      );
  }
}
