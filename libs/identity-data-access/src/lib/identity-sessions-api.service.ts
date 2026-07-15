import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type { SessionsListResponse } from 'identity-domain';

/** `b2c-session-management` (pleniubank-identity-service, openspec change `b2c-profile-self-service`). */
@Injectable({ providedIn: 'root' })
export class IdentitySessionsApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  private get base(): string {
    return `${this.apiConfig.identityBaseUrl}/api/v1/auth/me/sessions`;
  }

  list(): Observable<ApiEnvelope<SessionsListResponse> | SessionsListResponse> {
    return this.http.get<ApiEnvelope<SessionsListResponse> | SessionsListResponse>(this.base);
  }

  /** El backend responde 422 si `sessionId` es la sesión actual; usar `POST /auth/logout` para esa. */
  revoke(sessionId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${sessionId}`);
  }

  revokeOthers(): Observable<unknown> {
    return this.http.post(`${this.base}/revoke-others`, {});
  }
}
