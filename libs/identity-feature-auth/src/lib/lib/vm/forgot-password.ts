import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  PasswordResetMethod,
} from 'identity-domain';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';
import { PORTAL_APP, recoverySentPathForPortal } from '@pleniu/shared-auth';

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
  private readonly portalApp = inject(PORTAL_APP);
  private readonly router = inject(Router);

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

  submit(
    payload: ForgotPasswordRequest,
    options: { navigateOnSuccess?: boolean; onSettled?: () => void } = {},
  ): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state = 'rate_limited';
      options.onSettled?.();
      return;
    }
    if (this.state === 'submitting') {
      options.onSettled?.();
      return;
    }

    this.state = 'submitting';
    this.errorMessage = null;
    this.successMessage = null;
    this.debugResetCode = null;
    this.debugResetToken = null;
    this.submittedEmail = payload.email;
    this.submittedMethod = payload.method;

    const portalHint = this.portalApp === 'backoffice' ? 'backoffice' : 'customer';
    this.identityApi.forgotPassword({ ...payload, portal: portalHint }).subscribe({
      next: (response) => {
        this.rateLimit.reset();
        const data = extractPayload(response);
        this.state = 'success';
        this.successMessage =
          data.message || 'Si la cuenta existe, enviamos instrucciones para restablecer la contraseña.';
        this.debugResetCode = data.debug_reset_code ?? null;
        this.debugResetToken = data.debug_reset_token ?? null;
        if (options.navigateOnSuccess !== false) {
          void this.router.navigate([recoverySentPathForPortal(this.portalApp)], {
            state: { email: payload.email },
          });
        }
        options.onSettled?.();
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        if (mappedError.status === 429) {
          this.rateLimit.register429();
          this.state = 'rate_limited';
          options.onSettled?.();
          return;
        }
        this.rateLimit.reset();
        this.state = 'error';
        if (mappedError.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu red e intenta de nuevo.';
          options.onSettled?.();
          return;
        }
        this.errorMessage = 'No fue posible iniciar la recuperación en este momento.';
        options.onSettled?.();
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
