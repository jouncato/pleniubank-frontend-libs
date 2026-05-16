import { ApiEnvelope } from '@pleniu/shared-http';
import { SessionClaims } from '@pleniu/shared-auth';

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  document_type: RegisterDocumentType;
  document_number: string;
  consent: boolean;
}

export type RegisterDocumentType = 'CC' | 'CE' | 'NIT' | 'PP' | 'TI';

export interface RegisterResponse {
  registration_id: string;
}

export interface VerifyOtpRequest {
  registration_id: string;
  code: string;
}

/** Respuesta de verify-email / verify-phone (cuerpo plano o envuelto en { data }). */
export interface VerificationResponse {
  registration_id: string;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  is_active: boolean;
  /** JWT access token for auto-login after successful verification */
  access_token?: string | null;
  token_type?: string;
  /** Token expiration in seconds */
  expires_in?: number | null;
  /** User role for the session */
  role?: string | null;
  /** User ID for the session */
  user_id?: string | null;
}

export interface ResendEmailOtpRequest {
  registration_id: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type PasswordResetMethod = 'otp' | 'link';

export interface ForgotPasswordRequest {
  email: string;
  method: PasswordResetMethod;
  portal?: 'customer' | 'backoffice';
}

export interface ForgotPasswordResponse {
  status: string;
  message: string;
  method: PasswordResetMethod;
  debug_reset_code?: string | null;
  debug_reset_token?: string | null;
}

export interface ResetPasswordRequest {
  email: string;
  new_password: string;
  code?: string;
  token?: string;
  portal?: 'customer' | 'backoffice';
}

export interface ResetPasswordResponse {
  status: string;
  sessions_revoked: boolean;
  confirmation_required?: boolean;
  confirmation_expires_in_seconds?: number;
  debug_confirmation_token?: string | null;
}

export interface ConfirmPasswordResetRequest {
  email: string;
  confirmation_token: string;
  portal?: 'customer' | 'backoffice';
}

export interface ConfirmPasswordResetResponse {
  status: string;
  sessions_revoked: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: string;
  role?: string;
  enterprise_id?: string | null;
  sub_enterprise_id?: string | null;
  /** JWT firmado con secreto admin; solo si el usuario es admin de plataforma. */
  admin_access_token?: string | null;
  /** Operadores de plataforma con contraseña inicial o política de cambio forzado. */
  password_must_change?: boolean;
}

export interface StaffChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/** PATCH /api/v1/auth/mfa (usuarios en tabla `users`, no staff). */
export interface CustomerMfaPatchRequest {
  enabled: boolean;
  current_password: string;
}

export interface StaffPatchProfileRequest {
  full_name?: string;
  /** Cadena vacía limpia el teléfono en Identity. */
  phone?: string | null;
}

export interface StaffSelfProfileResponse {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  identity_verified: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  scope?: string | null;
  password_must_change?: boolean;
}

export interface ValidateResponse {
  claims: SessionClaims;
}

export type VerificationEnvelope = ApiEnvelope<VerificationResponse>;

export type RegisterEnvelope = ApiEnvelope<RegisterResponse>;
export type LoginEnvelope = ApiEnvelope<LoginResponse>;
export type ValidateEnvelope = ApiEnvelope<ValidateResponse>;
export type ForgotPasswordEnvelope = ApiEnvelope<ForgotPasswordResponse>;
export type ResetPasswordEnvelope = ApiEnvelope<ResetPasswordResponse>;
export type ConfirmPasswordResetEnvelope = ApiEnvelope<ConfirmPasswordResetResponse>;

export * from './identity-enterprise';
