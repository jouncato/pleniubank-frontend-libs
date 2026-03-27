import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';
import {
  ForgotPasswordEnvelope,
  ForgotPasswordRequest,
  LoginEnvelope,
  LoginRequest,
  RegisterEnvelope,
  RegisterRequest,
  ResetPasswordEnvelope,
  ResetPasswordRequest,
  ValidateEnvelope,
  VerifyOtpRequest,
} from 'identity-domain';

@Injectable({ providedIn: 'root' })
export class IdentityAuthApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  register(payload: RegisterRequest): Observable<RegisterEnvelope> {
    return this.http.post<RegisterEnvelope>(`${this.apiConfig.identityBaseUrl}/api/v1/auth/register`, payload);
  }

  verifyEmail(payload: VerifyOtpRequest): Observable<ApiEnvelope<Record<string, unknown>>> {
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-email`,
      payload,
    );
  }

  verifyPhone(payload: VerifyOtpRequest): Observable<ApiEnvelope<Record<string, unknown>>> {
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-phone`,
      payload,
    );
  }

  login(payload: LoginRequest): Observable<LoginEnvelope> {
    return this.http.post<LoginEnvelope>(`${this.apiConfig.identityBaseUrl}/api/v1/auth/login`, payload);
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.apiConfig.identityBaseUrl}/api/v1/auth/logout`, {}, { observe: 'response' });
  }

  refresh(): Observable<ApiEnvelope<{ access_token: string; refresh_token?: string }>> {
    return this.http.post<ApiEnvelope<{ access_token: string; refresh_token?: string }>>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/refresh`,
      {},
    );
  }

  validate(): Observable<ValidateEnvelope> {
    return this.http.post<ValidateEnvelope>(`${this.apiConfig.identityBaseUrl}/api/v1/auth/validate`, {});
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ForgotPasswordEnvelope> {
    return this.http.post<ForgotPasswordEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/forgot-password`,
      payload,
    );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ResetPasswordEnvelope> {
    return this.http.post<ResetPasswordEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/reset-password`,
      payload,
    );
  }
}
