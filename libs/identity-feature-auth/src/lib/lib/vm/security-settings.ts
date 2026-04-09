import { Injectable, inject, signal } from '@angular/core';
import { LoginEnvelope, LoginResponse } from 'identity-domain';
import { IdentityAuthApiService, unwrapValidateResponse } from '@pleniu/identity-data-access';
import { SESSION_STRATEGY, SessionStore, type SessionStrategy } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

function unwrapLoginPayload(body: LoginEnvelope | LoginResponse): LoginResponse {
  if (body && typeof body === 'object' && 'data' in body && (body as LoginEnvelope).data) {
    return (body as LoginEnvelope).data;
  }
  return body as LoginResponse;
}

@Injectable({
  providedIn: 'root',
})
export class SecuritySettingsVm {
  private readonly sessionStore = inject(SessionStore);
  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStrategy = inject<SessionStrategy>(SESSION_STRATEGY);

  readonly mfaState = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly mfaError = signal<string | null>(null);

  /** I-09: solo mostrar bloque MFA si validate incluyó el flag (no inventar datos). */
  get mfaSectionVisible(): boolean {
    return typeof this.sessionStore.claims()?.two_factor_enabled === 'boolean';
  }

  get mfaEnabled(): boolean {
    return Boolean(this.sessionStore.claims()?.two_factor_enabled);
  }

  resetMfaFeedback(): void {
    if (this.mfaState() === 'success' || this.mfaState() === 'error') {
      this.mfaState.set('idle');
      this.mfaError.set(null);
    }
  }

  patchMfa(enabled: boolean, currentPassword: string): void {
    if (this.mfaState() === 'submitting') {
      return;
    }
    if (enabled === this.mfaEnabled) {
      return;
    }
    this.mfaState.set('submitting');
    this.mfaError.set(null);

    this.identityApi.patchAppUserMfa({ enabled, current_password: currentPassword }).subscribe({
      next: (response) => {
        const data = unwrapLoginPayload(response as LoginEnvelope | LoginResponse);
        if (this.sessionStrategy === 'httpOnlyCookie') {
          this.sessionStore.setUserToken(null);
          this.sessionStore.setRefreshToken(null);
        } else {
          this.sessionStore.setUserToken(data.access_token);
          this.sessionStore.setRefreshToken(data.refresh_token ?? null);
          if (data.admin_access_token) {
            this.sessionStore.setAdminToken(data.admin_access_token);
          }
        }
        this.identityApi.validate().subscribe({
          next: (v) => {
            const { claims } = unwrapValidateResponse(v as never);
            this.sessionStore.setClaims({ ...claims });
            this.mfaState.set('success');
          },
          error: () => {
            this.mfaError.set('2FA actualizado pero no fue posible refrescar la sesion.');
            this.mfaState.set('error');
          },
        });
      },
      error: (error: unknown) => {
        const mapped = mapHttpError(error);
        const code = mapped.errors[0]?.code;
        if (mapped.status === 401 || code === 'INVALID_CREDENTIALS') {
          this.mfaError.set('La contrasena actual no es correcta.');
        } else {
          const msg = mapped.errors[0]?.message?.trim();
          this.mfaError.set(
            msg && !msg.startsWith('Http failure response for')
              ? msg
              : 'No fue posible actualizar 2FA. Intenta nuevamente.',
          );
        }
        this.mfaState.set('error');
      },
    });
  }
}
