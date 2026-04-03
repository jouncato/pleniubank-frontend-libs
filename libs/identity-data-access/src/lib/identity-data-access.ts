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

/** POST /api/v1/auth/phone-challenge | resend-phone-otp */
export type PhoneOtpChallengePayload = {
  status: string;
  expires_in_seconds: number;
  debug_otp?: string | null;
};

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
  if (typeof raw['full_name'] === 'string' && raw['full_name'].trim()) {
    out.full_name = raw['full_name'].trim();
  }
  if (typeof raw['two_factor_enabled'] === 'boolean') {
    out.two_factor_enabled = raw['two_factor_enabled'];
  }
  if (typeof raw['identity_verified'] === 'boolean') {
    out.identity_verified = raw['identity_verified'];
  }
  if (typeof raw['email_verified'] === 'boolean') {
    out.email_verified = raw['email_verified'];
  }
  if (typeof raw['phone_verified'] === 'boolean') {
    out.phone_verified = raw['phone_verified'];
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

export function unwrapPhoneOtpChallenge(
  body: ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload,
): PhoneOtpChallengePayload {
  if (body && typeof body === 'object' && 'data' in body) {
    const d = (body as ApiEnvelope<PhoneOtpChallengePayload>).data;
    if (d) return d;
  }
  return body as PhoneOtpChallengePayload;
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

  /** Reenvío SMS durante registro B2C (mismo payload que resend-email-otp: registration_id). */
  resendRegistrationPhoneOtp(payload: ResendEmailOtpRequest): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/resend-registration-phone-otp`,
      payload,
    );
  }

  verifyPhone(payload: VerifyOtpRequest): Observable<VerificationEnvelope | VerificationResponse> {
    return this.http.post<VerificationEnvelope | VerificationResponse>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/verify-phone`,
      payload,
    );
  }

  startPhoneOtpChallenge(): Observable<ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload> {
    return this.http.post<ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/phone-challenge`,
      {},
    );
  }

  resendPhoneOtpAuthenticated(): Observable<ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload> {
    return this.http.post<ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/resend-phone-otp`,
      {},
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
