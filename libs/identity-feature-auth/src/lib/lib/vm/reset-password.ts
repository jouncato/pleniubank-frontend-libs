import { Injectable } from '@angular/core';
import {
  ConfirmPasswordResetRequest,
  ConfirmPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from 'identity-domain';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

function extractPayload(response: unknown): ResetPasswordResponse {
  const asEnvelope = (response as { data?: ResetPasswordResponse } | null)?.data;
  if (asEnvelope) {
    return asEnvelope;
  }
  return response as ResetPasswordResponse;
}

function extractConfirmPayload(response: unknown): ConfirmPasswordResetResponse {
  const asEnvelope = (response as { data?: ConfirmPasswordResetResponse } | null)?.data;
  if (asEnvelope) {
    return asEnvelope;
  }
  return response as ConfirmPasswordResetResponse;
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
          data.status === 'confirmation_required'
            ? 'Enviamos un correo para confirmar el cambio de contraseña. Debes confirmarlo para finalizar.'
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

  confirm(payload: ConfirmPasswordResetRequest, onSettled?: () => void): void {
    if (this.state === 'submitting') {
      return;
    }
    this.state = 'submitting';
    this.errorMessage = null;
    this.successMessage = null;

    this.identityApi.confirmPasswordReset(payload).subscribe({
      next: (response) => {
        const data = extractConfirmPayload(response);
        this.state = 'success';
        this.successMessage =
          data.status === 'password_reset_confirmed'
            ? 'Cambio de contraseña confirmado. Ya puedes iniciar sesión.'
            : 'Confirmación de cambio de contraseña completada.';
        onSettled?.();
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const code = mappedError.errors[0]?.code;
        this.state = 'error';
        if (mappedError.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu red e intenta de nuevo.';
        } else if (code === 'RESET_CONFIRMATION_EXPIRED') {
          this.errorMessage = 'El enlace de confirmación expiró. Solicita una recuperación nueva.';
        } else if (code === 'RESET_CONFIRMATION_TEMP_LOCKED') {
          this.errorMessage = 'Demasiados intentos de confirmación. Espera antes de intentar de nuevo.';
        } else if (code === 'RESET_CONFIRMATION_INVALID') {
          this.errorMessage = 'El enlace de confirmación es inválido.';
        } else if (code === 'RESET_CONFIRMATION_SUSPICIOUS') {
          this.errorMessage = 'Se bloqueó la confirmación por actividad sospechosa. Intenta nuevamente desde el mismo dispositivo o solicita un nuevo enlace.';
        } else {
          this.errorMessage = 'No fue posible confirmar el cambio de contraseña.';
        }
        onSettled?.();
      },
    });
  }
}
