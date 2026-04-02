import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';
import type { SessionClaims } from 'shared-auth';
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
  ValidateResponse,
  ResendEmailOtpRequest,
  VerificationEnvelope,
  VerificationResponse,
  VerifyOtpRequest,
} from 'identity-domain';

export type RefreshTokenPayload = { access_token: string; refresh_token?: string };

/** Identity devuelve cuerpo plano; algunos gateways pueden envolver en `{ data }`. */
export function unwrapRefreshResponse(
  body: ApiEnvelope<RefreshTokenPayload> | RefreshTokenPayload,
): RefreshTokenPayload {
  if (body && typeof body === 'object' && 'data' in body) {
    const d = (body as ApiEnvelope<RefreshTokenPayload>).data;
    if (d) return d;
  }
  return body as RefreshTokenPayload;
}

function claimsFromRecord(raw: Record<string, unknown>): SessionClaims {
  const out: SessionClaims = {};
  if (raw['user_id'] != null) {
    out.user_id = String(raw['user_id']);
  } else if (raw['sub'] != null) {
    out.user_id = String(raw['sub']);
  }
  if (typeof raw['role'] === 'string') {
    out.role = raw['role'] as SessionClaims['role'];
  }
  if (raw['enterprise_id'] != null) {
    out.enterprise_id = String(raw['enterprise_id']);
  }
  if (raw['customer_id'] != null) {
    out.customer_id = String(raw['customer_id']);
  }
  if (typeof raw['email'] === 'string') {
    out.email = raw['email'];
  }
  if (typeof raw['two_factor_enabled'] === 'boolean') {
    out.two_factor_enabled = raw['two_factor_enabled'];
  }
  return out;
}

/**
 * Normaliza la respuesta de POST /auth/validate:
 * - Gateway / sobre: `{ data: ... }`
 * - Legacy FE: `{ claims: SessionClaims }` o `{ data: { claims } }`
 * - Identity-service actual: cuerpo plano `ValidateTokenResponse` (role, email, user_id, …)
 */
export function unwrapValidateResponse(
  body: ValidateEnvelope | ValidateResponse | Record<string, unknown>,
): ValidateResponse {
  let raw: Record<string, unknown>;
  if (body && typeof body === 'object' && 'data' in body) {
    const d = (body as ValidateEnvelope).data;
    raw = (d && typeof d === 'object' ? d : {}) as Record<string, unknown>;
  } else {
    raw = body as Record<string, unknown>;
  }

  const nestedClaims = raw['claims'];
  if (nestedClaims && typeof nestedClaims === 'object' && !Array.isArray(nestedClaims)) {
    return { claims: claimsFromRecord(nestedClaims as Record<string, unknown>) };
  }

  if (typeof raw['role'] === 'string' && typeof raw['email'] === 'string') {
    return { claims: claimsFromRecord(raw) };
  }

  return { claims: {} };
}

export function unwrapVerificationResponse(
  body: VerificationEnvelope | VerificationResponse,
): VerificationResponse {
  if (body && typeof body === 'object' && 'data' in body) {
    const d = (body as VerificationEnvelope).data;
    if (d) return d;
  }
  return body as VerificationResponse;
}

@Injectable({ providedIn: 'root' })
export class IdentityAuthApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  register(payload: RegisterRequest): Observable<RegisterEnvelope> {
    return this.http.post<RegisterEnvelope>(`${this.apiConfig.identityBaseUrl}/api/v1/auth/register`, payload);
  }

  verifyEmail(payload: VerifyOtpRequest): Observable<VerificationEnvelope | VerificationResponse> {
    return this.http.post<VerificationEnvelope | VerificationResponse>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-email`,
      payload,
    );
  }

  resendEmailOtp(payload: ResendEmailOtpRequest): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/resend-email-otp`,
      payload,
    );
  }

  verifyPhone(payload: VerifyOtpRequest): Observable<VerificationEnvelope | VerificationResponse> {
    return this.http.post<VerificationEnvelope | VerificationResponse>(
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
