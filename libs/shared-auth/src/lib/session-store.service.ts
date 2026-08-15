import { Inject, Injectable, computed, signal } from '@angular/core';
import { UserRole } from './shared-auth';
import { SESSION_STRATEGY, SessionStrategy } from './session-strategy.token';

const USER_TOKEN_KEY = 'pleniu_user_token';
const ADMIN_TOKEN_KEY = 'pleniu_admin_token';
const REFRESH_TOKEN_KEY = 'pleniu_refresh_token';
const REGISTRATION_ID_KEY = 'pleniu_registration_id';
const SESSION_TERMINATION_KEY = 'pleniu_session_termination';

export type SessionTerminationReason = 'SESSION_REPLACED' | 'SESSION_REVOKED' | 'SESSION_REQUIRED' | 'SESSION_EXPIRED';

/** TTL recomendado para claims tras validate (I-07): evita POST /validate en cada navegación. */
export const SESSION_CLAIMS_TTL_MS = 5 * 60 * 1000;

export interface SessionClaims {
  user_id?: string;
  role?: UserRole;
  enterprise_id?: string;
  /** Razón social de la empresa contratante (Identity validate). */
  enterprise_name?: string;
  /** Unidad de negocio (sub-empresa) a la que está vinculado el usuario, si aplica. */
  sub_enterprise_id?: string;
  /** Razón social de la unidad de negocio (Identity validate). */
  sub_enterprise_name?: string;
  /** Código de identificación de nómina de la unidad de negocio. */
  company_code?: string;
  customer_id?: string;
  two_factor_enabled?: boolean;
  email?: string;
  /** Nombre registrado (Identity validate); fallback UI al local del email si falta. */
  full_name?: string;
  /** Teléfono desde Identity validate (staff/B2C). */
  phone?: string;
  pending_email?: string;
  identity_verified?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  /** Operadores de plataforma: Identity exige cambiar contraseña antes del área admin. */
  password_must_change?: boolean;
  /** Cuenta activa (Identity validate). */
  is_active?: boolean;
  /** Ámbito JWT (p. ej. plt_admin); solo lectura en UI de perfil. */
  scope?: string;
  /** Salario mensual declarado del beneficiario (Identity validate, B2C empleado). */
  salary_amount?: number;
  /** País/tenant emitido por Identity (ADR-016, LB-ST-210). Ausente en JWTs actuales (claim aún no emitida). */
  country_code?: string;
  /** Claim JWT `iat` (unix seconds) — momento de emisión de la sesión actual. */
  iat?: number;
  /** Claim JWT `exp` (unix seconds) — expiración de la sesión actual. */
  exp?: number;
}

@Injectable()
export class SessionStore {
  private readonly strategy: SessionStrategy;
  private readonly useCookies: boolean;

  private readonly _userToken: ReturnType<typeof signal<string | null>>;
  private readonly _adminToken: ReturnType<typeof signal<string | null>>;
  private readonly _refreshToken: ReturnType<typeof signal<string | null>>;

  private readonly _claims = signal<SessionClaims | null>(null);
  private readonly _claimsValidatedAt = signal<number | null>(null);
  private readonly _isRefreshing = signal(false);
  private readonly _terminationReason = signal<SessionTerminationReason | null>(
    this.readTerminationReason(),
  );

  readonly userToken: ReturnType<typeof computed<string | null>>;
  readonly adminToken: ReturnType<typeof computed<string | null>>;
  readonly refreshToken: ReturnType<typeof computed<string | null>>;
  readonly claims: ReturnType<typeof computed<SessionClaims | null>>;
  readonly claimsValidatedAt: ReturnType<typeof computed<number | null>>;
  readonly isRefreshing: ReturnType<typeof computed<boolean>>;
  readonly isAuthenticated: ReturnType<typeof computed<boolean>>;
  readonly terminationReason: ReturnType<typeof computed<SessionTerminationReason | null>>;

  constructor(@Inject(SESSION_STRATEGY) strategy: SessionStrategy) {
    this.strategy = strategy;
    this.useCookies = this.strategy === 'httpOnlyCookie';
    this._userToken = signal<string | null>(this.useCookies ? null : sessionStorage.getItem(USER_TOKEN_KEY));
    this._adminToken = signal<string | null>(this.useCookies ? null : sessionStorage.getItem(ADMIN_TOKEN_KEY));
    this._refreshToken = signal<string | null>(this.useCookies ? null : sessionStorage.getItem(REFRESH_TOKEN_KEY));
    this.userToken = computed(() => this._userToken());
    this.adminToken = computed(() => this._adminToken());
    this.refreshToken = computed(() => this._refreshToken());
    this.claims = computed(() => this._claims());
    this.claimsValidatedAt = computed(() => this._claimsValidatedAt());
    this.isRefreshing = computed(() => this._isRefreshing());
    this.terminationReason = computed(() => this._terminationReason());
    this.isAuthenticated = computed(() =>
      this.useCookies ? Boolean(this._claims()) : Boolean(this._userToken()),
    );
  }

  setUserToken(token: string | null): void {
    this._userToken.set(token);
    if (!this.useCookies) {
      this.persist(USER_TOKEN_KEY, token);
    }
  }

  setAdminToken(token: string | null): void {
    this._adminToken.set(token);
    if (!this.useCookies) {
      this.persist(ADMIN_TOKEN_KEY, token);
    }
  }

  setRefreshToken(token: string | null): void {
    this._refreshToken.set(token);
    if (!this.useCookies) {
      this.persist(REFRESH_TOKEN_KEY, token);
    }
  }

  setClaims(claims: SessionClaims | null): void {
    this._claims.set(claims);
    this._claimsValidatedAt.set(claims ? Date.now() : null);
  }

  switchEnterprise(accessToken: string, claims: SessionClaims): void {
    this.setUserToken(accessToken);
    this.setClaims({ ...(this._claims() ?? {}), ...claims });
  }

  /** Fuerza un nuevo POST /validate en el próximo authGuard (p. ej. tras verificar teléfono y refresh JWT). */
  invalidateClaimsCache(): void {
    this._claimsValidatedAt.set(null);
  }

  setRegistrationId(registrationId: string | null): void {
    this.persist(REGISTRATION_ID_KEY, registrationId);
  }

  getRegistrationId(): string | null {
    return sessionStorage.getItem(REGISTRATION_ID_KEY);
  }

  setRefreshing(value: boolean): void {
    this._isRefreshing.set(value);
  }

  setTerminationReason(reason: SessionTerminationReason): void {
    this._terminationReason.set(reason);
    sessionStorage.setItem(SESSION_TERMINATION_KEY, reason);
  }

  clearTerminationReason(): void {
    this._terminationReason.set(null);
    sessionStorage.removeItem(SESSION_TERMINATION_KEY);
  }

  hasRole(role: UserRole): boolean {
    return this._claims()?.role === role;
  }

  clear(): void {
    this._userToken.set(null);
    this._adminToken.set(null);
    this._refreshToken.set(null);
    this._claims.set(null);
    this._claimsValidatedAt.set(null);
    this.setRefreshing(false);

    sessionStorage.removeItem(USER_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REGISTRATION_ID_KEY);
  }

  private readTerminationReason(): SessionTerminationReason | null {
    const value = sessionStorage.getItem(SESSION_TERMINATION_KEY);
    return value === 'SESSION_REPLACED' || value === 'SESSION_REVOKED' || value === 'SESSION_REQUIRED' || value === 'SESSION_EXPIRED'
      ? value
      : null;
  }

  private persist(key: string, value: string | null): void {
    if (value) {
      sessionStorage.setItem(key, value);
      return;
    }
    sessionStorage.removeItem(key);
  }
}
