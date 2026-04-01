import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyOtpRequest } from 'identity-domain';
import { SessionStore } from 'shared-auth';
import { IdentityAuthApiService, unwrapVerificationResponse } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

@Injectable({
  providedIn: 'root',
})
export class VerifyPhoneVm {
  state: 'idle' | 'submitting' | 'success' | 'expired' | 'error' = 'idle';
  errorMessage: string | null = null;
  countdown = 90;

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {}

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
          void this.router.navigate(['/onboarding/party/access/login'], {
            state: { registrationCompleted: true },
          });
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
        void this.router.navigate(['/onboarding/party/access/login'], {
          state: { registrationCompleted: true },
        });
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        this.state = mappedError.status === 404 ? 'expired' : 'error';
        this.errorMessage =
          mappedError.status === 404 ? 'Proceso expirado, reinicia registro.' : 'Código inválido.';
      },
    });
  }
}

