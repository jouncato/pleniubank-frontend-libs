import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginEnvelope, LoginRequest, LoginResponse } from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import {
  isValidReturnUrl,
  PORTAL_APP,
  PortalAppKind,
  SESSION_STRATEGY,
  SessionStrategy,
  SessionStore,
} from 'shared-auth';
import { ApiHttpError, mapHttpError } from 'shared-http';

import { AuthRateLimitService } from './auth-rate-limit.service';

function unwrapLoginPayload(body: LoginEnvelope | LoginResponse): LoginResponse {
  if (body && typeof body === 'object' && 'data' in body && (body as LoginEnvelope).data) {
    return (body as LoginEnvelope).data;
  }
  return body as LoginResponse;
}

function messageFromApiEnvelope(mapped: ApiHttpError, fallback: string): string {
  const raw = mapped.errors[0]?.message?.trim() ?? '';
  if (!raw || raw.startsWith('Http failure response for')) {
    return fallback;
  }
  return raw;
}

@Injectable({
  providedIn: 'root',
})
export class LoginVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'locked' | 'rate_limited' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  private readonly portal = inject<PortalAppKind>(PORTAL_APP);
  private readonly rateLimit = inject(AuthRateLimitService);
  private readonly sessionStrategy = inject<SessionStrategy>(SESSION_STRATEGY);

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
          if (data.admin_access_token) {
            this.sessionStore.setAdminToken(data.admin_access_token);
          } else {
            this.sessionStore.setAdminToken(null);
          }
        }
        this.hydrateSession(returnUrl);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const code = mappedError.errors[0]?.code;
        if (mappedError.status === 423 || code === 'ACCOUNT_LOCKED') {
          this.rateLimit.reset();
          this.state.set('locked');
          this.errorMessage.set(
            messageFromApiEnvelope(mappedError, 'Tu cuenta esta bloqueada.'),
          );
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
              ? messageFromApiEnvelope(mappedError, inactiveFb)
              : messageFromApiEnvelope(mappedError, badCredsFb),
          );
          return;
        }
        this.errorMessage.set(
          messageFromApiEnvelope(
            mappedError,
            'No fue posible iniciar sesion. Intenta nuevamente.',
          ),
        );
      },
    });
  }

  private hydrateSession(returnUrl?: string): void {
    this.identityApi.validate().subscribe({
      next: (response) => {
        const role = response.data.claims.role;
        if (role === 'admin' && this.portal === 'customer') {
          this.sessionStore.clear();
          this.state.set('error');
          this.errorMessage.set(
            'Las cuentas de administrador de plataforma deben iniciar sesion en el portal de backoffice.',
          );
          return;
        }
        this.sessionStore.setClaims({
          ...response.data.claims,
          email: response.data.claims.email,
        });
        this.state.set('success');
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
        this.state.set('error');
        this.errorMessage.set('No fue posible validar la sesion.');
      },
    });
  }

  private applyStoredRateLimit(): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state.set('rate_limited');
    }
  }
}
