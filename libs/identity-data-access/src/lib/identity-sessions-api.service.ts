import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';
import type { RevokeOtherSessionsResponse, SessionsListResponse } from 'identity-domain';

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

  list(): Observable<SessionsListResponse> {
    return this.http.get<SessionsListResponse>(this.base);
  }

  /** 204 No Content en éxito; el backend responde 422 si `sessionId` es la sesión actual. */
  revoke(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${sessionId}`);
  }

  revokeOthers(): Observable<RevokeOtherSessionsResponse> {
    return this.http.post<RevokeOtherSessionsResponse>(`${this.base}/revoke-others`, {});
  }
}
