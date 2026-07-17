import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  EconomicSectorsListEnvelope,
  EconomicSectorPublicDto,
  EnterpriseMeSummaryResponse,
  KybDocumentsEnvelope,
  KybDocumentsRequest,
  RegisterEnterpriseEnvelope,
  RegisterEnterpriseRequest,
  RegisterEnterpriseResponse,
  ResendEnterpriseEmailOtpEnvelope,
  ResendEnterpriseEmailOtpRequest,
  ResendEnterpriseEmailOtpResponse,
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

/**
 * Registro / onboarding de empresa (B2B): registro self-service, verificación de
 * email, KYB y resumen de estado. Extraído de `IdentityEnterpriseApiService`
 * (God Class original) como parte de la separación por subdominio.
 */
@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseOnboardingApiService {
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
}
