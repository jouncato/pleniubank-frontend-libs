import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';
import {
  ClosureState,
  ConfirmEmailChangeRequest,
  ContactChangeChallengeResponse,
  ContactChangeResponse,
  CustomerProfile,
  EmailChangeVerifyResponse,
  RequestClosureRequest,
  StartEmailChangeRequest,
  StartPhoneChangeRequest,
  UpdateProfileNameRequest,
  VerifyEmailChangeOtpRequest,
  VerifyPhoneChangeRequest,
} from 'identity-domain';

/**
 * `b2c-profile` + `b2c-account-closure` (pleniubank-identity-service,
 * openspec change `b2c-profile-self-service`). Identity devuelve cuerpo
 * plano (sin envelope `{ data }`) para estos endpoints.
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

  getMe(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(this.base);
  }

  updateName(body: UpdateProfileNameRequest): Observable<CustomerProfile> {
    return this.http.patch<CustomerProfile>(this.base, body);
  }

  startPhoneChange(body: StartPhoneChangeRequest): Observable<ContactChangeChallengeResponse> {
    return this.http.post<ContactChangeChallengeResponse>(`${this.base}/phone-change`, body);
  }

  verifyPhoneChange(body: VerifyPhoneChangeRequest): Observable<ContactChangeResponse> {
    return this.http.post<ContactChangeResponse>(`${this.base}/phone-change/verify`, body);
  }

  startEmailChange(body: StartEmailChangeRequest): Observable<ContactChangeChallengeResponse> {
    return this.http.post<ContactChangeChallengeResponse>(`${this.base}/email-change`, body);
  }

  /** Paso 2: OTP al email nuevo. Devuelve el estado "pendiente de confirmación" (paso 3). */
  verifyEmailChangeOtp(body: VerifyEmailChangeOtpRequest): Observable<EmailChangeVerifyResponse> {
    return this.http.post<EmailChangeVerifyResponse>(`${this.base}/email-change/verify`, body);
  }

  /** Paso 3: confirmación desde el email actual (token capturado del enlace del correo). */
  confirmEmailChange(body: ConfirmEmailChangeRequest): Observable<ContactChangeResponse> {
    return this.http.post<ContactChangeResponse>(`${this.base}/email-change/confirm`, body);
  }

  /** Envía el OTP de cierre de cuenta (paso previo a `requestClosure`). */
  requestClosureChallenge(): Observable<ClosureState> {
    return this.http.post<ClosureState>(`${this.base}/closure/challenge`, {});
  }

  requestClosure(body: RequestClosureRequest): Observable<ClosureState> {
    return this.http.post<ClosureState>(`${this.base}/closure`, body);
  }

  getClosure(): Observable<ClosureState> {
    return this.http.get<ClosureState>(`${this.base}/closure`);
  }

  cancelClosure(): Observable<ClosureState> {
    return this.http.delete<ClosureState>(`${this.base}/closure`);
  }
}
