import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';
import { AcceptInviteEnvelope, AcceptInviteRequest, InviteUserEnvelope, InviteUserRequest } from 'identity-domain';

/**
 * Invitaciones de usuario dentro de una empresa (B2B): crear invitación y
 * aceptarla. Extraído de `IdentityEnterpriseApiService` (God Class original)
 * como parte de la separación por subdominio.
 */
@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseInvitationApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  inviteUser(payload: InviteUserRequest): Observable<InviteUserEnvelope> {
    return this.http.post<InviteUserEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/invite-user`,
      payload,
    );
  }

  acceptInvite(payload: AcceptInviteRequest): Observable<AcceptInviteEnvelope> {
    return this.http.post<AcceptInviteEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/accept-invite`,
      payload,
    );
  }
}
