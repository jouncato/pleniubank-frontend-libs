import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginEnvelope, LoginRequest, LoginResponse } from 'identity-domain';
import { IdentityAuthApiService, unwrapValidateResponse } from '@pleniu/identity-data-access';
import {
  isValidReturnUrl,
  PORTAL_APP,
  PortalAppKind,
  POST_LOGIN_CUSTOMER_PORTAL,
  type PostLoginCustomerPortalConfig,
  SESSION_STRATEGY,
  SessionStrategy,
  SessionStore,
  stashDevPortalTokenHandoff,
} from '@pleniu/shared-auth';
import { ApiHttpError, mapHttpError, resolveApiErrorMessage } from '@pleniu/shared-http';

import { AuthRateLimitService } from './auth-rate-limit.service';

function unwrapLoginPayload(body: LoginEnvelope | LoginResponse): LoginResponse {
  if (body && typeof body === 'object' && 'data' in body && (body as LoginEnvelope).data) {
    return (body as LoginEnvelope).data;
  }
  return body as LoginResponse;
}

@Injectable({
  providedIn: 'root',
})
export class LoginVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'locked' | 'rate_limited' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly portal = inject<PortalAppKind>(PORTAL_APP);
  private readonly rateLimit = inject(AuthRateLimitService);
  private readonly sessionStrategy = inject<SessionStrategy>(SESSION_STRATEGY);
  private readonly postLoginCustomerPortal = inject<PostLoginCustomerPortalConfig>(
    POST_LOGIN_CUSTOMER_PORTAL,
  );

  constructor() {
    this.applyStoredRateLimit();
  }

  get isRateLimited(): boolean {
    return this.rateLimit.isBlocked();
  }

  get remainingSeconds(): number {
    return this.rateLimit.remainingSeconds();
  }

  get rateLimitMessage(): string | null {
    return this.rateLimit.message();
  }

  login(payload: LoginRequest, returnUrl?: string): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state.set('rate_limited');
      return;
    }
    if (this.state() === 'submitting') {
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.identityApi.login(payload).subscribe({
      next: (response) => {
        this.rateLimit.reset();
        const data = unwrapLoginPayload(response as LoginEnvelope | LoginResponse);
        if (this.sessionStrategy === 'httpOnlyCookie') {
          this.sessionStore.setUserToken(null);
          this.sessionStore.setRefreshToken(null);
          this.sessionStore.setAdminToken(null);
        } else {
          this.sessionStore.setUserToken(data.access_token);
          this.sessionStore.setRefreshToken(data.refresh_token ?? null);
          this.sessionStore.setAdminToken(data.admin_access_token ?? null);
        }
        this.hydrateSession(returnUrl);
      },
      error: (error: unknown) => this.applyLoginHttpError(mapHttpError(error)),
    });
  }

  private applyLoginHttpError(mappedError: ApiHttpError): void {
    const code = mappedError.errors[0]?.code;
    if (mappedError.status === 423 || code === 'ACCOUNT_LOCKED') {
      this.rateLimit.reset();
      this.state.set('locked');
      this.errorMessage.set(resolveApiErrorMessage(mappedError, 'Tu cuenta esta bloqueada.'));
      return;
    }
    if (mappedError.status === 429) {
      this.rateLimit.register429();
      this.state.set('rate_limited');
      return;
    }
    this.rateLimit.reset();
    this.state.set('error');
    const inactiveFb =
      'Tu cuenta no está activa. Verifica con el código que enviamos por correo o por SMS (con uno basta).';
    const badCredsFb = 'Correo o contrasena incorrectos.';
    if (mappedError.status === 401) {
      this.errorMessage.set(
        code === 'USER_INACTIVE'
          ? resolveApiErrorMessage(mappedError, inactiveFb)
          : resolveApiErrorMessage(mappedError, badCredsFb),
      );
      return;
    }
    this.errorMessage.set(
      resolveApiErrorMessage(mappedError, 'No fue posible iniciar sesion. Intenta nuevamente.'),
    );
  }

  private hydrateSession(returnUrl?: string): void {
    this.identityApi.validate().subscribe({
      next: (response) => {
        const { claims } = unwrapValidateResponse(response as never);
        const role = claims.role;
        if (role === 'admin' && this.portal !== 'backoffice') {
          this.sessionStore.clear();
          this.state.set('error');
          this.errorMessage.set(
            'Las cuentas de administrador de plataforma deben iniciar sesion en el portal de backoffice.',
          );
          return;
        }
        this.sessionStore.setClaims({ ...claims });
        this.state.set('success');
        if (this.portal === 'backoffice' && claims.password_must_change === true) {
          const safeReturn = isValidReturnUrl(returnUrl) ? returnUrl : undefined;
          void this.router.navigate(['/staff/access/change-password'], {
            queryParams: safeReturn ? { returnUrl: safeReturn } : {},
          });
          return;
        }
        if (
          this.portal === 'customer' &&
          !claims.enterprise_id &&
          claims.phone_verified !== true
        ) {
          const safeReturn = isValidReturnUrl(returnUrl) ? returnUrl : undefined;
          void this.router.navigate(['/app/verify-phone'], {
            queryParams: safeReturn ? { returnUrl: safeReturn } : {},
          });
          return;
        }
        this.navigateAfterSuccessfulValidate(claims, role, returnUrl);
      },
      error: () => {
        this.sessionStore.clear();
        this.state.set('error');
        this.errorMessage.set('No fue posible validar la sesion.');
      },
    });
  }

  private navigateAfterSuccessfulValidate(
    claims: { enterprise_id?: string | null },
    role: string | undefined,
    returnUrl?: string,
  ): void {
    const safeReturnUrl = isValidReturnUrl(returnUrl) ? returnUrl : undefined;
    const cfg = this.postLoginCustomerPortal;
    const externalBase = cfg.customerPortalOrigin.trim().replace(/\/$/, '');

    if (this.portal === 'public' && externalBase) {
      const defaultPath = claims.enterprise_id ? cfg.b2bPath : cfg.b2cPath;
      let path = defaultPath;
      if (safeReturnUrl && safeReturnUrl.startsWith('/app/')) {
        path = safeReturnUrl;
      }
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const url = `${externalBase}${normalizedPath}`;
      if (cfg.allowCrossOriginTokenHandoff && this.sessionStrategy === 'sessionStorage') {
        const access = this.sessionStore.userToken();
        if (access) {
          stashDevPortalTokenHandoff(access, this.sessionStore.refreshToken());
        }
      }
      globalThis.location.assign(url);
      return;
    }

    const route = role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
    void this.router.navigateByUrl(safeReturnUrl ?? route);
  }

  private applyStoredRateLimit(): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state.set('rate_limited');
    }
  }
}
