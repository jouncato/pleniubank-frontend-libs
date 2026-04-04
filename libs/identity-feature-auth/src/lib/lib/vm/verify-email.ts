import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityAuthApiService, unwrapVerificationResponse } from 'identity-data-access';
import { SessionStore } from 'shared-auth';
import { ApiHttpError, mapHttpError } from 'shared-http';

const VERIFY_EMAIL_LOG = '[Pleniu auth/verify-email]';
/** Alineado con el cooldown por defecto del identity-service (RESEND_EMAIL_OTP_COOLDOWN_SECONDS). */
const RESEND_COOLDOWN_SEC = 60;

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
export class VerifyEmailVm {
  readonly state = signal<'idle' | 'submitting' | 'resending' | 'error' | 'rate_limited'>('idle');
  readonly errorMessage = signal<string | null>(null);
  /** Segundos hasta poder reenviar; 0 = disponible. */
  readonly resendSecondsLeft = signal(0);

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {
    inject(DestroyRef).onDestroy(() => {
      if (this.resendTimer) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    });
  }

  private startResendCooldown(seconds: number): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.resendSecondsLeft.set(Math.max(0, seconds));
    this.resendTimer = setInterval(() => {
      const left = this.resendSecondsLeft() - 1;
      if (left <= 0) {
        this.resendSecondsLeft.set(0);
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
      } else {
        this.resendSecondsLeft.set(left);
      }
    }, 1000);
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
          this.sessionStore.setRegistrationId(null);
          void this.router.navigate(['/onboarding/party/customer/complete']);
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
        this.errorMessage.set(messageFromApiEnvelope(mappedError, fallback));
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
        this.startResendCooldown(RESEND_COOLDOWN_SEC);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.errorMessage.set(
            messageFromApiEnvelope(
              mappedError,
              'Debes esperar antes de solicitar otro código.',
            ),
          );
          this.state.set('rate_limited');
          this.startResendCooldown(RESEND_COOLDOWN_SEC);
          return;
        }
        const fallback =
          mappedError.status === 404
            ? 'No encontramos un registro pendiente con ese identificador.'
            : 'No pudimos reenviar el código. Intenta nuevamente.';
        this.errorMessage.set(messageFromApiEnvelope(mappedError, fallback));
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
