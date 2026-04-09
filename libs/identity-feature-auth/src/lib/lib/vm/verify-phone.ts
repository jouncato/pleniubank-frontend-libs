import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyOtpRequest } from 'identity-domain';
import { SessionStore } from '@pleniu/shared-auth';
import { IdentityAuthApiService, unwrapVerificationResponse } from '@pleniu/identity-data-access';
import { ApiHttpError, mapHttpError } from '@pleniu/shared-http';

const VERIFY_PHONE_LOG = '[Pleniu auth/verify-phone]';
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
export class VerifyPhoneVm {
  state: 'idle' | 'submitting' | 'resending' | 'success' | 'expired' | 'error' | 'rate_limited' = 'idle';
  errorMessage: string | null = null;
  countdown = 90;
  /** Segundos hasta poder reenviar SMS; 0 = disponible. */
  resendSecondsLeft = 0;

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
    this.resendSecondsLeft = Math.max(0, seconds);
    this.resendTimer = setInterval(() => {
      const left = this.resendSecondsLeft - 1;
      if (left <= 0) {
        this.resendSecondsLeft = 0;
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
      } else {
        this.resendSecondsLeft = left;
      }
    }, 1000);
  }

  resendSms(): void {
    if (this.state === 'resending' || this.resendSecondsLeft > 0) {
      return;
    }

    const registrationId =
      (history.state && (history.state as { registrationId?: string }).registrationId) ??
      this.sessionStore.getRegistrationId();
    if (!registrationId) {
      this.state = 'expired';
      this.errorMessage = 'El proceso expiró. Reinicia el registro.';
      return;
    }

    this.state = 'resending';
    this.errorMessage = null;

    this.identityApi.resendRegistrationPhoneOtp({ registration_id: registrationId }).subscribe({
      next: () => {
        this.state = 'idle';
        this.startResendCooldown(RESEND_COOLDOWN_SEC);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.errorMessage = messageFromApiEnvelope(
            mappedError,
            'Debes esperar antes de solicitar otro código.',
          );
          this.state = 'rate_limited';
          this.startResendCooldown(RESEND_COOLDOWN_SEC);
          return;
        }
        if (mappedError.status === 404) {
          this.state = 'expired';
          this.errorMessage = 'No encontramos un registro pendiente con ese identificador.';
          return;
        }
        if (mappedError.status === 409) {
          this.errorMessage = messageFromApiEnvelope(
            mappedError,
            'Este teléfono ya está verificado. Continúa con el inicio de sesión.',
          );
          this.state = 'error';
          return;
        }
        const fallback =
          mappedError.status === 422
            ? 'No pudimos reenviar el SMS. Revisa que el registro siga activo.'
            : 'No pudimos reenviar el código. Intenta nuevamente.';
        this.errorMessage = messageFromApiEnvelope(mappedError, fallback);
        this.state = 'error';
        if (error instanceof HttpErrorResponse) {
          console.error(VERIFY_PHONE_LOG, 'resend-registration-phone-otp falló', {
            status: error.status,
            url: error.url,
            correlationId: mappedError.correlationId ?? null,
            apiErrors: mappedError.errors,
          });
        }
      },
    });
  }

  submit(code: string): void {
    if (this.state === 'submitting') {
      return;
    }

    const registrationId =
      (history.state && (history.state as { registrationId?: string }).registrationId) ??
      this.sessionStore.getRegistrationId();
    if (!registrationId) {
      this.state = 'expired';
      this.errorMessage = 'El proceso expiró. Reinicia el registro.';
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;

    const payload: VerifyOtpRequest = { registration_id: registrationId, code };
    this.identityApi.verifyPhone(payload).subscribe({
      next: (raw) => {
        this.state = 'success';
        const result = unwrapVerificationResponse(raw);
        if (result.identity_verified && result.is_active) {
          this.sessionStore.setRegistrationId(null);
          void this.router.navigate(['/onboarding/party/customer/complete']);
          return;
        }
        if (!result.email_verified) {
          void this.router.navigate(['/onboarding/party/customer/verify-email'], {
            state: { registrationId },
          });
          return;
        }
        if (!result.phone_verified) {
          void this.router.navigate(['/onboarding/party/customer/verify-phone'], {
            state: { registrationId },
          });
          return;
        }
        void this.router.navigate(['/onboarding/party/customer/complete']);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        this.state = mappedError.status === 404 ? 'expired' : 'error';
        const raw = mappedError.errors[0]?.message?.trim() ?? '';
        if (mappedError.status === 404) {
          this.errorMessage = 'Proceso expirado, reinicia registro.';
        } else if (raw.length > 0) {
          this.errorMessage = raw;
        } else {
          this.errorMessage = 'Código inválido o expirado. Puedes solicitar un nuevo SMS.';
        }
      },
    });
  }
}
