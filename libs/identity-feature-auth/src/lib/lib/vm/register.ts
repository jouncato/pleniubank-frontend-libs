import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterRequest } from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { SessionStore } from 'shared-auth';
import { mapHttpError } from 'shared-http';

@Injectable({
  providedIn: 'root',
})
export class RegisterVm {
  state: 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited' = 'idle';
  errorMessage: string | null = null;

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {}

  submit(payload: RegisterRequest): void {
    if (this.state === 'submitting') {
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;

    this.identityApi.register(payload).subscribe({
      next: (response) => {
        const registrationId = response.data.registration_id;
        this.sessionStore.setRegistrationId(registrationId);
        this.state = 'success';
        void this.router.navigate(['/onboarding/party/customer/verify-email'], { state: { registrationId } });
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const firstMessage = mappedError.errors[0]?.message;

        if (mappedError.status === 429) {
          this.errorMessage = 'Demasiados intentos. Espera un minuto e intenta nuevamente.';
          this.state = 'rate_limited';
          return;
        }

        if (mappedError.status === 422 && firstMessage) {
          this.errorMessage = firstMessage;
        } else if (mappedError.status === 409) {
          this.errorMessage = 'Ya existe un registro con la informacion ingresada.';
        } else {
          this.errorMessage = 'No fue posible completar el registro. Intenta nuevamente.';
        }
        this.state = 'error';
      },
    });
  }
}

