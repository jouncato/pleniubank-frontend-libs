import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  AcceptInviteEnvelope,
  AcceptInviteRequest,
  CreateSubEnterpriseEnvelope,
  CreateSubEnterpriseRequest,
  CreateUserEnterpriseEnvelope,
  CreateUserEnterpriseRequest,
  EconomicSectorsListEnvelope,
  EconomicSectorPublicDto,
  InviteUserEnvelope,
  InviteUserRequest,
  EnterpriseMeSummaryResponse,
  KybDocumentsEnvelope,
  KybDocumentsRequest,
  RegisterEnterpriseEnvelope,
  RegisterEnterpriseRequest,
  RegisterEnterpriseResponse,
  ResendEnterpriseEmailOtpEnvelope,
  ResendEnterpriseEmailOtpRequest,
  ResendEnterpriseEmailOtpResponse,
  SubEnterpriseDetailDto,
  SubEnterpriseDetailEnvelope,
  SubEnterpriseSummaryDto,
  SubEnterprisesListEnvelope,
  SubEnterprisesListParams,
  UpdateSubEnterpriseRequest,
  VerifyEnterpriseEmailEnvelope,
  VerifyEnterpriseEmailRequest,
  VerifyEnterpriseEmailResponse,
} from 'identity-domain';

/** Identity devuelve muchos POST como cuerpo plano; Core usa `{ data, meta }`. Normalizamos aquí. */
function asApiEnvelope<T>(body: ApiEnvelope<T> | T): ApiEnvelope<T> {
  if (body !== null && typeof body === 'object' && 'data' in (body as object)) {
    const env = body as ApiEnvelope<T>;
    if (env.data !== undefined && env.data !== null) {
      return env;
    }
  }
  return { data: body as T };
}

@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  registerEnterprise(payload: RegisterEnterpriseRequest): Observable<RegisterEnterpriseEnvelope> {
    return this.http
      .post<RegisterEnterpriseEnvelope | RegisterEnterpriseResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/auth/register-enterprise`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<RegisterEnterpriseResponse>(body)));
  }

  /** Catálogo público para selector de registro B2B. */
  listPublicEconomicSectors(category?: string | null): Observable<EconomicSectorsListEnvelope> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http
      .get<EconomicSectorsListEnvelope | { data: EconomicSectorPublicDto[] }>(
        `${this.apiConfig.identityBaseUrl}/api/v1/economic-sectors`,
        { params },
      )
      .pipe(
        map((raw) =>
          raw && typeof raw === 'object' && 'data' in raw
            ? (raw as EconomicSectorsListEnvelope)
            : { data: [] as EconomicSectorPublicDto[] },
        ),
      );
  }

  verifyEnterpriseEmail(payload: VerifyEnterpriseEmailRequest): Observable<VerifyEnterpriseEmailEnvelope> {
    return this.http
      .post<VerifyEnterpriseEmailEnvelope | VerifyEnterpriseEmailResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-enterprise-email`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<VerifyEnterpriseEmailResponse>(body)));
  }

  resendEnterpriseEmailOtp(payload: ResendEnterpriseEmailOtpRequest): Observable<ResendEnterpriseEmailOtpEnvelope> {
    return this.http
      .post<ResendEnterpriseEmailOtpEnvelope | ResendEnterpriseEmailOtpResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/auth/resend-enterprise-email-otp`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<ResendEnterpriseEmailOtpResponse>(body)));
  }

  submitKybDocuments(payload: KybDocumentsRequest): Observable<KybDocumentsEnvelope> {
    return this.http.post<KybDocumentsEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/kyb/documents`,
      payload,
    );
  }

  getEnterpriseMeSummary(): Observable<EnterpriseMeSummaryResponse> {
    return this.http.get<EnterpriseMeSummaryResponse>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/me/summary`,
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
    return this.http
      .post<CreateSubEnterpriseEnvelope | CreateSubEnterpriseEnvelope['data']>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<CreateSubEnterpriseEnvelope['data']>(body)));
  }

  /** List business units (sub-enterprises) under a parent enterprise. */
  listSubEnterprises(
    enterpriseId: string,
    params: SubEnterprisesListParams = {},
  ): Observable<SubEnterprisesListEnvelope> {
    let httpParams = new HttpParams();
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params.limit && params.limit > 0) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http
      .get<SubEnterprisesListEnvelope | SubEnterpriseSummaryDto[]>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises`,
        { params: httpParams },
      )
      .pipe(
        map((body) =>
          Array.isArray(body)
            ? ({ data: body } as SubEnterprisesListEnvelope)
            : asApiEnvelope<SubEnterpriseSummaryDto[]>(body),
        ),
      );
  }

  /** Fetch full detail of a business unit (includes user_count). */
  getSubEnterprise(subEnterpriseId: string): Observable<SubEnterpriseDetailEnvelope> {
    return this.http
      .get<SubEnterpriseDetailEnvelope | SubEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
      )
      .pipe(map((body) => asApiEnvelope<SubEnterpriseDetailDto>(body)));
  }

  /** Partial update (contact data) of a business unit. */
  updateSubEnterprise(
    subEnterpriseId: string,
    payload: UpdateSubEnterpriseRequest,
  ): Observable<SubEnterpriseDetailEnvelope> {
    return this.http
      .patch<SubEnterpriseDetailEnvelope | SubEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<SubEnterpriseDetailDto>(body)));
  }

  /** Soft delete / deactivate a business unit. Backend returns 204 No Content. */
  deactivateSubEnterprise(subEnterpriseId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
    );
  }
}
