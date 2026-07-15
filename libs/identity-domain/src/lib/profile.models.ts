/** Pleniu Colombia S.A. — B2C self-service profile domain models.
 *
 * Synchronised with the `b2c-profile`, `b2c-account-closure` and
 * `b2c-session-management` capabilities (`pleniubank-identity-service`
 * openspec change `b2c-profile-self-service`).
 */

export interface CustomerProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document_type: string;
  /** Solo últimos 3 caracteres visibles; el resto llega enmascarado desde el backend. */
  document_number_masked: string;
  country_code: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  two_factor_enabled: boolean;
  kyc_status: string | null;
}

export interface UpdateProfileNameRequest {
  full_name: string;
}

export interface StartPhoneChangeRequest {
  current_password: string;
  new_phone: string;
}

export interface StartPhoneChangeResponse {
  status: string;
  expires_in_seconds: number;
  debug_otp?: string | null;
}

export interface VerifyPhoneChangeRequest {
  code: string;
}

export interface VerifyPhoneChangeResponse {
  status: string;
  phone: string;
  phone_verified: boolean;
}

export interface StartEmailChangeRequest {
  current_password: string;
  new_email: string;
}

export interface StartEmailChangeResponse {
  status: string;
  expires_in_seconds: number;
  debug_otp?: string | null;
}

export interface VerifyEmailChangeOtpRequest {
  code: string;
}

/**
 * Estado del cambio de email tras el paso 2 (OTP al email nuevo verificado).
 * El paso 3 (confirmación desde el email actual) ocurre fuera del portal
 * (enlace enviado por correo); `pending_confirmation` indica que aún falta.
 */
export interface ContactChangeState {
  status: 'otp_verified_pending_confirmation' | 'completed' | 'expired';
  pending_confirmation: boolean;
  confirmation_expires_in_seconds?: number | null;
}

export interface UserSession {
  session_id: string;
  device_label: string | null;
  /** IP truncada (minimización de datos), p. ej. `190.10.20.0`. */
  ip_truncated: string | null;
  created_at: string;
  last_seen_at: string;
  current: boolean;
}

export interface SessionsListResponse {
  items: UserSession[];
}

export type ClosureStatus = 'requested' | 'blocked' | 'completed';

/** Motivo de bloqueo del cierre; hoy solo `ACTIVE_OBLIGATIONS` (ver core `b2c-account-lifecycle`). */
export interface ClosureState {
  status: ClosureStatus | null;
  reason?: string | null;
  /** Referencia de la obligación bloqueante (p. ej. advance_id) para deep-link. */
  reference_id?: string | null;
  requested_at?: string | null;
}

export interface RequestClosureRequest {
  current_password: string;
  code: string;
}
