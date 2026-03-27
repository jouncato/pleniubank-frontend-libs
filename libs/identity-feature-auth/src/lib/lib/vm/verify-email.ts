import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyOtpRequest } from 'identity-domain';
import { SessionStore } from 'shared-auth';
import { IdentityAuthApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailVm {
  state: 'idle' | 'submitting' | 'success' | 'expired' | 'error' = 'idle';
  errorMessage: string | null = null;
  countdown = 60;

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {}

  submit(code: string): void {
    if (this.state === 'submitting') {
      return;
    }

    const registrationId = this.sessionStore.getRegistrationId();
    if (!registrationId) {
      this.state = 'expired';
      this.errorMessage = 'El registro expiró. Reinicia el proceso.';
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;

    const payload: VerifyOtpRequest = { registration_id: registrationId, code };
    this.identityApi.verifyEmail(payload).subscribe({
      next: () => {
        this.state = 'success';
        void this.router.navigate(['/onboarding/party/customer/verify-phone'], { state: { registrationId } });
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        this.state = mappedError.status === 404 ? 'expired' : 'error';
        this.errorMessage =
          mappedError.status === 404 ? 'Registro expirado.' : 'Código inválido o expirado.';
      },
    });
  }
}

