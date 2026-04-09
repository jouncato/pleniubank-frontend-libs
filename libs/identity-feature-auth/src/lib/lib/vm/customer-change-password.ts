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
export class CustomerChangePasswordVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly sessionStrategy = inject<SessionStrategy>(SESSION_STRATEGY);

  submit(currentPassword: string, newPassword: string): void {
    if (this.state() === 'submitting') {
      return;
    }
    this.state.set('submitting');
    this.errorMessage.set(null);

    this.identityApi
      .appUserChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      .subscribe({
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
              this.state.set('success');
            },
            error: () => {
              this.errorMessage.set('Contrasena actualizada pero no fue posible refrescar la sesion.');
              this.state.set('error');
            },
          });
        },
        error: (error: unknown) => {
          const mapped = mapHttpError(error);
          const code = mapped.errors[0]?.code;
          if (mapped.status === 401 || code === 'INVALID_CREDENTIALS') {
            this.errorMessage.set('La contrasena actual no es correcta.');
          } else {
            const msg = mapped.errors[0]?.message?.trim();
            this.errorMessage.set(
              msg && !msg.startsWith('Http failure response for')
                ? msg
                : 'No fue posible cambiar la contrasena. Intenta nuevamente.',
            );
          }
          this.state.set('error');
        },
      });
  }

  resetFeedback(): void {
    if (this.state() === 'success' || this.state() === 'error') {
      this.state.set('idle');
      this.errorMessage.set(null);
    }
  }
}
