import { Injectable, inject } from '@angular/core';
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  PasswordResetMethod,
} from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

import { AuthRateLimitService } from './auth-rate-limit.service';

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
  state: 'idle' | 'submitting' | 'success' | 'rate_limited' | 'error' = 'idle';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  debugResetCode: string | null = null;
  debugResetToken: string | null = null;
  submittedEmail: string | null = null;
  submittedMethod: PasswordResetMethod = 'otp';
  private readonly rateLimit = inject(AuthRateLimitService);

  constructor(private readonly identityApi: IdentityAuthApiService) {
    this.applyStoredRateLimit();
  }

  get isRateLimited(): boolean {
    return this.rateLimit.isBlocked();
  }

  get remainingSeconds(): number {
    return this.rateLimit.remainingSeconds();
  }

  get rateLimitMessage(): string | null {
    return this.rateLimit.message();
  }

  submit(payload: ForgotPasswordRequest): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state = 'rate_limited';
      return;
    }
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
        this.rateLimit.reset();
        const data = extractPayload(response);
        this.state = 'success';
        this.successMessage =
          data.message || 'Si la cuenta existe, enviamos instrucciones para restablecer la contrasena.';
        this.debugResetCode = data.debug_reset_code ?? null;
        this.debugResetToken = data.debug_reset_token ?? null;
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.rateLimit.register429();
          this.state = 'rate_limited';
          return;
        }
        this.rateLimit.reset();
        this.state = 'error';
        if (mappedError.status === 0) {
          this.errorMessage = 'Error de conexion. Verifica tu red e intenta de nuevo.';
          return;
        }
        this.errorMessage = 'No fue posible iniciar la recuperacion en este momento.';
      },
    });
  }

  private applyStoredRateLimit(): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state = 'rate_limited';
    }
  }
}
