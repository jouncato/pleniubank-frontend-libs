import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type { SessionClaims } from '@pleniu/shared-auth';
import {
  ForgotPasswordEnvelope,
  ForgotPasswordRequest,
  LoginEnvelope,
  LoginRequest,
  CustomerMfaPatchRequest,
  StaffChangePasswordRequest,
  StaffPatchProfileRequest,
  StaffSelfProfileResponse,
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

/** Identity / gateway: cuerpo plano o `{ data: T }`. */
function unwrapEnvelopeData<T>(body: ApiEnvelope<T> | T): T {
  if (body && typeof body === 'object' && 'data' in body) {
    const d = (body as ApiEnvelope<T>).data;
    if (d) {
      return d;
    }
  }
  return body as T;
}

/** Identity devuelve cuerpo plano; algunos gateways pueden envolver en `{ data }`. */
export function unwrapRefreshResponse(
  body: ApiEnvelope<RefreshTokenPayload> | RefreshTokenPayload,
): RefreshTokenPayload {
  return unwrapEnvelopeData(body);
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
  if (typeof raw['phone'] === 'string' && raw['phone'].trim()) {
    out.phone = raw['phone'].trim();
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
  if (typeof raw['password_must_change'] === 'boolean') {
    out.password_must_change = raw['password_must_change'];
  }
  if (typeof raw['is_active'] === 'boolean') {
    out.is_active = raw['is_active'];
  }
  if (typeof raw['scope'] === 'string' && raw['scope'].trim()) {
    out.scope = raw['scope'].trim();
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
  return unwrapEnvelopeData(body as ApiEnvelope<VerificationResponse> | VerificationResponse);
}

export function unwrapPhoneOtpChallenge(
  body: ApiEnvelope<PhoneOtpChallengePayload> | PhoneOtpChallengePayload,
): PhoneOtpChallengePayload {
  return unwrapEnvelopeData(body);
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

  staffChangePassword(payload: StaffChangePasswordRequest): Observable<LoginEnvelope> {
    return this.http.post<LoginEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/staff/change-password`,
      payload,
    );
  }

  /** B2C/B2B: filas en `users` (no operadores platform_staff). */
  appUserChangePassword(payload: StaffChangePasswordRequest): Observable<LoginEnvelope> {
    return this.http.post<LoginEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/change-password`,
      payload,
    );
  }

  patchAppUserMfa(payload: CustomerMfaPatchRequest): Observable<LoginEnvelope> {
    return this.http.patch<LoginEnvelope>(`${this.apiConfig.identityBaseUrl}/api/v1/auth/mfa`, payload);
  }

  staffPatchProfile(payload: StaffPatchProfileRequest): Observable<StaffSelfProfileResponse> {
    return this.http.patch<StaffSelfProfileResponse>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/staff/me`,
      payload,
    );
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
