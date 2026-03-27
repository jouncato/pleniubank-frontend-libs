import { Injectable } from '@angular/core';
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  PasswordResetMethod,
} from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

function extractPayload(response: unknown): ForgotPasswordResponse {
  const asEnvelope = (response as { data?: ForgotPasswordResponse } | null)?.data;
  if (asEnvelope) {
    return asEnvelope;
  }
  return response as ForgotPasswordResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordVm {
  state: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  debugResetCode: string | null = null;
  debugResetToken: string | null = null;
  submittedEmail: string | null = null;
  submittedMethod: PasswordResetMethod = 'otp';

  constructor(private readonly identityApi: IdentityAuthApiService) {}

  submit(payload: ForgotPasswordRequest): void {
    if (this.state === 'submitting') {
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;
    this.successMessage = null;
    this.debugResetCode = null;
    this.debugResetToken = null;
    this.submittedEmail = payload.email;
    this.submittedMethod = payload.method;

    this.identityApi.forgotPassword(payload).subscribe({
      next: (response) => {
        const data = extractPayload(response);
        this.state = 'success';
        this.successMessage =
          data.message || 'Si la cuenta existe, enviamos instrucciones para restablecer la contraseña.';
        this.debugResetCode = data.debug_reset_code ?? null;
        this.debugResetToken = data.debug_reset_token ?? null;
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        this.state = 'error';
        if (mappedError.status === 429) {
          this.errorMessage = 'Demasiados intentos. Espera unos minutos e intenta nuevamente.';
          return;
        }
        if (mappedError.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu red e intenta de nuevo.';
          return;
        }
        this.errorMessage = 'No fue posible iniciar la recuperación en este momento.';
      },
    });
  }
}
