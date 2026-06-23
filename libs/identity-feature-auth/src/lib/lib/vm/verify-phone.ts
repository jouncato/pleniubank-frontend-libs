import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyOtpRequest } from 'identity-domain';
import { PORTAL_APP, SessionStore, signInPathForPortal } from '@pleniu/shared-auth';
import { IdentityAuthApiService, unwrapVerificationResponse } from '@pleniu/identity-data-access';
import { mapHttpError, resolveApiErrorMessage } from '@pleniu/shared-http';

import { createCountdownTimer } from '../countdown-timer';

const VERIFY_PHONE_LOG = '[Pleniu auth/verify-phone]';
const RESEND_COOLDOWN_SEC = 60;

@Injectable({
  providedIn: 'root',
})
export class VerifyPhoneVm {
  readonly state = signal<'idle' | 'submitting' | 'resending' | 'success' | 'expired' | 'error' | 'rate_limited'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly resendSecondsLeft = signal(0);

  private readonly resendTimer = createCountdownTimer(this.resendSecondsLeft);
  private readonly portal = inject(PORTAL_APP);
  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.resendTimer.stop());
  }

  resendSms(): void {
    if (this.state() === 'resending' || this.resendSecondsLeft() > 0) {
      return;
    }

    const registrationId = this.resolveRegistrationId();
    if (!registrationId) {
      this.state.set('expired');
      this.errorMessage.set('El proceso expiró. Reinicia el registro.');
      return;
    }

    this.state.set('resending');
    this.errorMessage.set(null);

    this.identityApi.resendRegistrationPhoneOtp({ registration_id: registrationId }).subscribe({
      next: () => {
        this.state.set('idle');
        this.resendTimer.start(RESEND_COOLDOWN_SEC);
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.errorMessage.set(resolveApiErrorMessage(mappedError, 'Debes esperar antes de solicitar otro código.'));
          this.state.set('rate_limited');
          this.resendTimer.start(RESEND_COOLDOWN_SEC);
          return;
        }
        if (mappedError.status === 404) {
          this.state.set('expired');
          this.errorMessage.set('No encontramos un registro pendiente con ese identificador.');
          return;
        }
        if (mappedError.status === 409) {
          this.errorMessage.set(resolveApiErrorMessage(mappedError, 'Este teléfono ya está verificado. Continúa con el inicio de sesión.'));
          this.state.set('error');
          return;
        }
        const fallback =
          mappedError.status === 422
            ? 'No pudimos reenviar el SMS. Revisa que el registro siga activo.'
            : 'No pudimos reenviar el código. Intenta nuevamente.';
        this.errorMessage.set(resolveApiErrorMessage(mappedError, fallback));
        this.state.set('error');
        console.error(VERIFY_PHONE_LOG, 'resend-registration-phone-otp falló', {
          status: mappedError.status,
          correlationId: mappedError.correlationId ?? null,
          apiErrors: mappedError.errors,
        });
      },
    });
  }

  submit(code: string): void {
    if (this.state() === 'submitting') {
      return;
    }

    const registrationId = this.resolveRegistrationId();
    if (!registrationId) {
      this.state.set('expired');
      this.errorMessage.set('El proceso expiró. Reinicia el registro.');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    const payload: VerifyOtpRequest = { registration_id: registrationId, code };
    this.identityApi.verifyPhone(payload).subscribe({
      next: (raw) => {
        this.state.set('success');
        const result = unwrapVerificationResponse(raw);

        if (result.identity_verified && result.is_active) {
          this.sessionStore.clear();
          void this.router.navigate([signInPathForPortal(this.portal)]);
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
        this.state.set(mappedError.status === 404 ? 'expired' : 'error');
        const raw = mappedError.errors[0]?.message?.trim() ?? '';
        if (mappedError.status === 404) {
          this.errorMessage.set('Proceso expirado, reinicia registro.');
        } else if (raw.length > 0) {
          this.errorMessage.set(raw);
        } else {
          this.errorMessage.set('Código inválido o expirado. Puedes solicitar un nuevo SMS.');
        }
      },
    });
  }

  private resolveRegistrationId(): string | null {
    return (
      (history.state as { registrationId?: string } | null)?.registrationId ??
      this.sessionStore.getRegistrationId()
    );
  }
}
