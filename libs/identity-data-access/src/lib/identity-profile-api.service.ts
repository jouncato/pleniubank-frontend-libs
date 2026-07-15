import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type {
  ClosureState,
  ContactChangeState,
  CustomerProfile,
  RequestClosureRequest,
  StartEmailChangeRequest,
  StartEmailChangeResponse,
  StartPhoneChangeRequest,
  StartPhoneChangeResponse,
  UpdateProfileNameRequest,
  VerifyEmailChangeOtpRequest,
  VerifyPhoneChangeRequest,
  VerifyPhoneChangeResponse,
} from 'identity-domain';

/**
 * `b2c-profile` + `b2c-account-closure` (pleniubank-identity-service,
 * openspec change `b2c-profile-self-service`).
 *
 * Identity devuelve cuerpo plano para estos endpoints; algunos gateways
 * pueden envolver en `{ data }`, de ahí el tipo unión en los retornos
 * (mismo patrón que `IdentityAuthApiService`).
 */
@Injectable({ providedIn: 'root' })
export class IdentityProfileApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  private get base(): string {
    return `${this.apiConfig.identityBaseUrl}/api/v1/auth/me`;
  }

  getMe(): Observable<ApiEnvelope<CustomerProfile> | CustomerProfile> {
    return this.http.get<ApiEnvelope<CustomerProfile> | CustomerProfile>(this.base);
  }

  updateName(
    body: UpdateProfileNameRequest,
  ): Observable<ApiEnvelope<CustomerProfile> | CustomerProfile> {
    return this.http.patch<ApiEnvelope<CustomerProfile> | CustomerProfile>(this.base, body);
  }

  startPhoneChange(
    body: StartPhoneChangeRequest,
  ): Observable<ApiEnvelope<StartPhoneChangeResponse> | StartPhoneChangeResponse> {
    return this.http.post<ApiEnvelope<StartPhoneChangeResponse> | StartPhoneChangeResponse>(
      `${this.base}/phone-change`,
      body,
    );
  }

  verifyPhoneChange(
    body: VerifyPhoneChangeRequest,
  ): Observable<ApiEnvelope<VerifyPhoneChangeResponse> | VerifyPhoneChangeResponse> {
    return this.http.post<ApiEnvelope<VerifyPhoneChangeResponse> | VerifyPhoneChangeResponse>(
      `${this.base}/phone-change/verify`,
      body,
    );
  }

  startEmailChange(
    body: StartEmailChangeRequest,
  ): Observable<ApiEnvelope<StartEmailChangeResponse> | StartEmailChangeResponse> {
    return this.http.post<ApiEnvelope<StartEmailChangeResponse> | StartEmailChangeResponse>(
      `${this.base}/email-change`,
      body,
    );
  }

  /**
   * Verifica el OTP del email nuevo (paso 2). El paso 3 (confirmación desde
   * el email actual) ocurre fuera del portal vía enlace de correo.
   */
  verifyEmailChangeOtp(
    body: VerifyEmailChangeOtpRequest,
  ): Observable<ApiEnvelope<ContactChangeState> | ContactChangeState> {
    return this.http.post<ApiEnvelope<ContactChangeState> | ContactChangeState>(
      `${this.base}/email-change/verify`,
      body,
    );
  }

  requestClosure(
    body: RequestClosureRequest,
  ): Observable<ApiEnvelope<ClosureState> | ClosureState> {
    return this.http.post<ApiEnvelope<ClosureState> | ClosureState>(`${this.base}/closure`, body);
  }

  getClosure(): Observable<ApiEnvelope<ClosureState> | ClosureState> {
    return this.http.get<ApiEnvelope<ClosureState> | ClosureState>(`${this.base}/closure`);
  }

  cancelClosure(): Observable<unknown> {
    return this.http.delete(`${this.base}/closure`);
  }
}
