import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';
import {
  AcceptInviteEnvelope,
  AcceptInviteRequest,
  CreateSubEnterpriseEnvelope,
  CreateSubEnterpriseRequest,
  CreateUserEnterpriseEnvelope,
  CreateUserEnterpriseRequest,
  InviteUserEnvelope,
  InviteUserRequest,
  KybDocumentsEnvelope,
  KybDocumentsRequest,
  RegisterEnterpriseEnvelope,
  RegisterEnterpriseRequest,
  VerifyEnterpriseEmailEnvelope,
  VerifyEnterpriseEmailRequest,
} from 'identity-domain';

@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  registerEnterprise(payload: RegisterEnterpriseRequest): Observable<RegisterEnterpriseEnvelope> {
    return this.http.post<RegisterEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/register-enterprise`,
      payload,
    );
  }

  verifyEnterpriseEmail(payload: VerifyEnterpriseEmailRequest): Observable<VerifyEnterpriseEmailEnvelope> {
    return this.http.post<VerifyEnterpriseEmailEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-enterprise-email`,
      payload,
    );
  }

  submitKybDocuments(payload: KybDocumentsRequest): Observable<KybDocumentsEnvelope> {
    return this.http.post<KybDocumentsEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/kyb/documents`,
      payload,
    );
  }

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

  /**
   * Reserved for multi-tenant switch; backend returns 501 in MVP. Call only when feature flag is on.
   */
  switchContext(body: Record<string, unknown> = {}): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/switch-context`,
      body,
    );
  }

  createEnterpriseUser(enterpriseId: string, payload: CreateUserEnterpriseRequest): Observable<CreateUserEnterpriseEnvelope> {
    return this.http.post<CreateUserEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/users`,
      payload,
    );
  }

  createSubEnterpriseUser(subEnterpriseId: string, payload: CreateUserEnterpriseRequest): Observable<CreateUserEnterpriseEnvelope> {
    return this.http.post<CreateUserEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}/users`,
      payload,
    );
  }

  createSubEnterprise(enterpriseId: string, payload: CreateSubEnterpriseRequest): Observable<CreateSubEnterpriseEnvelope> {
    return this.http.post<CreateSubEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises`,
      payload,
    );
  }
}
