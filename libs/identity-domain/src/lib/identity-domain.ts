import { ApiEnvelope } from 'shared-http';
import { SessionClaims } from 'shared-auth';

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
}

export interface ResetPasswordResponse {
  status: string;
  sessions_revoked: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  /** JWT firmado con secreto admin; solo si el usuario es admin de plataforma. */
  admin_access_token?: string | null;
}

export interface ValidateResponse {
  claims: SessionClaims;
}

export type RegisterEnvelope = ApiEnvelope<RegisterResponse>;
export type LoginEnvelope = ApiEnvelope<LoginResponse>;
export type ValidateEnvelope = ApiEnvelope<ValidateResponse>;
export type ForgotPasswordEnvelope = ApiEnvelope<ForgotPasswordResponse>;
export type ResetPasswordEnvelope = ApiEnvelope<ResetPasswordResponse>;

export * from './identity-enterprise';
