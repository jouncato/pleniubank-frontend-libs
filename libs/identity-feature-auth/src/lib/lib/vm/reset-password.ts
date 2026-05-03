import { Injectable } from '@angular/core';
import { ResetPasswordRequest, ResetPasswordResponse } from 'identity-domain';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

function extractPayload(response: unknown): ResetPasswordResponse {
  const asEnvelope = (response as { data?: ResetPasswordResponse } | null)?.data;
  if (asEnvelope) {
    return asEnvelope;
  }
  return response as ResetPasswordResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordVm {
  state: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private readonly identityApi: IdentityAuthApiService) {}

  submit(payload: ResetPasswordRequest, onSettled?: () => void): void {
    if (this.state === 'submitting') {
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;
    this.successMessage = null;

    this.identityApi.resetPassword(payload).subscribe({
      next: (response) => {
        const data = extractPayload(response);
        this.state = 'success';
        this.successMessage =
          data.status === 'password_reset'
            ? 'Contraseña actualizada correctamente.'
            : 'La contraseña fue actualizada.';
        onSettled?.();
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const code = mappedError.errors[0]?.code;
        this.state = 'error';
        if (mappedError.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu red e intenta de nuevo.';
        } else if (code === 'RESET_CREDENTIAL_EXPIRED') {
          this.errorMessage = 'El código o enlace expiró. Solicita uno nuevo.';
        } else if (code === 'RESET_TEMP_LOCKED') {
          this.errorMessage = 'Demasiados intentos. Espera antes de volver a intentar.';
        } else if (code === 'RESET_CREDENTIAL_INVALID') {
          this.errorMessage = 'Código o enlace inválido.';
        } else {
          this.errorMessage = 'No fue posible restablecer la contraseña.';
        }
        onSettled?.();
      },
    });
  }
}
