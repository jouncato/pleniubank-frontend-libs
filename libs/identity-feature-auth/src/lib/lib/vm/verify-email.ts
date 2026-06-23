import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityAuthApiService, unwrapVerificationResponse } from '@pleniu/identity-data-access';
import { PORTAL_APP, SessionStore, signInPathForPortal } from '@pleniu/shared-auth';
import { mapHttpError, resolveApiErrorMessage } from '@pleniu/shared-http';

import { createCountdownTimer } from '../countdown-timer';

const VERIFY_EMAIL_LOG = '[Pleniu auth/verify-email]';
const RESEND_COOLDOWN_SEC = 60;

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailVm {
  readonly state = signal<'idle' | 'submitting' | 'resending' | 'error' | 'rate_limited'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly resendSecondsLeft = signal(0);

  private readonly resendTimer = createCountdownTimer(this.resendSecondsLeft);
  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly portal = inject(PORTAL_APP);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.resendTimer.stop());
  }

  submit(code: string): void {
    if (this.state() === 'submitting') {
      return;
    }

    const registrationId =
      (history.state && (history.state as { registrationId?: string }).registrationId) ??
      this.sessionStore.getRegistrationId();

    if (!registrationId) {
      console.error(VERIFY_EMAIL_LOG, 'Sin registration_id (state ni SessionStore)');
      this.errorMessage.set('No encontramos tu registro. Vuelve a registrarte.');
      this.state.set('error');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.identityApi.verifyEmail({ registration_id: registrationId, code }).subscribe({
      next: (raw) => {
        this.state.set('idle');
        this.errorMessage.set(null);
        const result = unwrapVerificationResponse(raw);

        if (result.identity_verified && result.is_active) {
          this.sessionStore.clear();
          void this.router.navigate([signInPathForPortal(this.portal)]);
          return;
        }

        void this.router.navigate(['/onboarding/party/customer/verify-phone'], {
          state: { registrationId },
        });
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const fallback =
          mappedError.status === 422
            ? 'El código no es válido o expiró. Revisa tu correo o solicita uno nuevo.'
            : 'No pudimos verificar tu correo. Intenta nuevamente.';
        this.errorMessage.set(resolveApiErrorMessage(mappedError, fallback));
        this.state.set('error');
        if (error instanceof HttpErrorResponse) {
          console.error(VERIFY_EMAIL_LOG, 'verify-email falló', {
            status: error.status,
            url: error.url,
            correlationId: mappedError.correlationId ?? null,
            apiErrors: mappedError.errors,
          });
        }
      },
    });
  }

  resendEmail(): void {
    if (this.state() === 'resending' || this.resendSecondsLeft() > 0) {
      return;
    }

    const registrationId =
      (history.state && (history.state as { registrationId?: string }).registrationId) ??
      this.sessionStore.getRegistrationId();

    if (!registrationId) {
      this.errorMessage.set('No encontramos tu registro. Vuelve a registrarte.');
      this.state.set('error');
      return;
    }

    this.state.set('resending');
    this.errorMessage.set(null);

    this.identityApi.resendEmailOtp({ registration_id: registrationId }).subscribe({
      next: () => {
        this.state.set('idle');
        this.resendTimer.start(RESEND_COOLDOWN_SEC);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.errorMessage.set(
            resolveApiErrorMessage(mappedError, 'Debes esperar antes de solicitar otro código.'),
          );
          this.state.set('rate_limited');
          this.resendTimer.start(RESEND_COOLDOWN_SEC);
          return;
        }
        const fallback =
          mappedError.status === 404
            ? 'No encontramos un registro pendiente con ese identificador.'
            : 'No pudimos reenviar el código. Intenta nuevamente.';
        this.errorMessage.set(resolveApiErrorMessage(mappedError, fallback));
        this.state.set('error');
        if (error instanceof HttpErrorResponse) {
          console.error(VERIFY_EMAIL_LOG, 'resend-email-otp falló', {
            status: error.status,
            url: error.url,
            correlationId: mappedError.correlationId ?? null,
            apiErrors: mappedError.errors,
          });
        }
      },
    });
  }
}
