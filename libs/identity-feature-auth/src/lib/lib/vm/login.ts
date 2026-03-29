import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginRequest } from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { isValidReturnUrl, PORTAL_APP, PortalAppKind, SessionStore } from 'shared-auth';
import { mapHttpError } from 'shared-http';

import { AuthRateLimitService } from './auth-rate-limit.service';

@Injectable({
  providedIn: 'root',
})
export class LoginVm {
  state: 'idle' | 'submitting' | 'success' | 'locked' | 'rate_limited' | 'error' = 'idle';
  errorMessage: string | null = null;

  private readonly portal = inject<PortalAppKind>(PORTAL_APP);
  private readonly rateLimit = inject(AuthRateLimitService);

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {
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
      this.state = 'rate_limited';
      return;
    }
    if (this.state === 'submitting') {
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;

    this.identityApi.login(payload).subscribe({
      next: (response) => {
        this.rateLimit.reset();
        const data = response.data;
        this.sessionStore.setUserToken(data.access_token);
        this.sessionStore.setRefreshToken(data.refresh_token ?? null);
        if (data.admin_access_token) {
          this.sessionStore.setAdminToken(data.admin_access_token);
        } else {
          this.sessionStore.setAdminToken(null);
        }
        this.hydrateSession(returnUrl);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const code = mappedError.errors[0]?.code;
        if (mappedError.status === 423 || code === 'ACCOUNT_LOCKED') {
          this.rateLimit.reset();
          this.state = 'locked';
          this.errorMessage = 'Tu cuenta esta bloqueada.';
          return;
        }
        if (mappedError.status === 429) {
          this.rateLimit.register429();
          this.state = 'rate_limited';
          return;
        }
        this.rateLimit.reset();
        this.state = 'error';
        this.errorMessage =
          code === 'USER_INACTIVE'
            ? 'Tu cuenta no esta activa. Completa la verificacion.'
            : 'Correo o contrasena incorrectos.';
      },
    });
  }

  private hydrateSession(returnUrl?: string): void {
    this.identityApi.validate().subscribe({
      next: (response) => {
        const role = response.data.claims.role;
        if (role === 'admin' && this.portal === 'customer') {
          this.sessionStore.clear();
          this.state = 'error';
          this.errorMessage =
            'Las cuentas de administrador de plataforma deben iniciar sesion en el portal de backoffice.';
          return;
        }
        this.sessionStore.setClaims({
          ...response.data.claims,
          email: response.data.claims.email,
        });
        this.state = 'success';
        const route =
          role === 'admin'
            ? '/admin/dashboard'
            : response.data.claims.enterprise_id
              ? '/app/accounts'
              : '/app/dashboard';
        const safeReturnUrl = isValidReturnUrl(returnUrl) ? returnUrl : undefined;
        void this.router.navigateByUrl(safeReturnUrl ?? route);
      },
      error: () => {
        this.sessionStore.clear();
        this.state = 'error';
        this.errorMessage = 'No fue posible validar la sesion.';
      },
    });
  }

  private applyStoredRateLimit(): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state = 'rate_limited';
    }
  }
}
