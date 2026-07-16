/** Pleniu Colombia S.A. — B2C self-service profile domain models.
 *
 * Synchronised with `src/domain/models.py` in pleniubank-identity-service
 * (`b2c-profile`, `b2c-account-closure`, `b2c-session-management` capabilities,
 * openspec change `b2c-profile-self-service`).
 */

/** `CustomerSelfProfileResponse`. */
export interface CustomerProfile {
  user_id: string;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document_type: string | null;
  /** Solo últimos caracteres visibles; enmascarado por el backend. */
  document_number_masked: string;
  country_code: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  two_factor_enabled: boolean;
  kyc_status: string;
}

/** `CustomerProfilePatchRequest`. */
export interface UpdateProfileNameRequest {
  full_name: string;
}

/** `PhoneChangeRequest`. */
export interface StartPhoneChangeRequest {
  current_password: string;
  new_phone: string;
}

/** `ContactChangeChallengeResponse` (compartida por phone-change y email-change). */
export interface ContactChangeChallengeResponse {
  status: string;
  expires_in_seconds: number;
  debug_code?: string | null;
}

/** `PhoneChangeVerifyRequest`. */
export interface VerifyPhoneChangeRequest {
  code: string;
}

/** `EmailChangeRequest`. */
export interface StartEmailChangeRequest {
  current_password: string;
  new_email: string;
}

/** `EmailChangeVerifyRequest`. */
export interface VerifyEmailChangeOtpRequest {
  code: string;
}

/**
 * `EmailChangeVerifyResponse` — tras el OTP del email nuevo, el backend envía
 * un enlace de confirmación al email actual y devuelve el token de depuración
 * (solo en entornos no productivos) para pruebas E2E.
 */
export interface EmailChangeVerifyResponse {
  status: string;
  confirmation_expires_in_seconds: number;
  debug_confirmation_token?: string | null;
}

/**
 * `EmailChangeConfirmRequest` — paso 3: confirmación desde el email actual.
 * El `confirmation_token` llega en el enlace del correo (query param); el
 * portal debe capturarlo en una ruta de aterrizaje y llamar a este endpoint.
 */
export interface ConfirmEmailChangeRequest {
  confirmation_token: string;
}

/** `ContactChangeResponse` — respuesta final de verify-phone y confirm-email. */
export interface ContactChangeResponse {
  status: string;
}

/** `AccountClosureRequest`. */
export interface RequestClosureRequest {
  current_password: string;
  code: string;
}

export type ClosureStatus = 'requested' | 'blocked' | 'completed' | 'cancelled' | 'challenge_sent';

/** `AccountClosureResponse`. */
export interface ClosureState {
  status: ClosureStatus;
  reason?: string | null;
  data_erasure_separate: boolean;
  expires_in_seconds?: number | null;
  debug_code?: string | null;
}

/** `CustomerSessionResponse`. */
export interface UserSession {
  session_id: string;
  ua_summary: string | null;
  ip_truncated: string | null;
  created_at: string;
  last_seen_at: string;
  current: boolean;
}

/** `CustomerSessionsResponse`. */
export interface SessionsListResponse {
  sessions: UserSession[];
}

/** Respuesta de `POST /me/sessions/revoke-others`. */
export interface RevokeOtherSessionsResponse {
  revoked_count: number;
}
