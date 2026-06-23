import { Injectable, computed, inject, signal } from '@angular/core';
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
  readonly state = signal<'idle' | 'submitting' | 'success' | 'rate_limited' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submittedEmail = signal<string | null>(null);
  readonly submittedMethod = signal<PasswordResetMethod>('otp');
  readonly debugResetCode = signal<string | null>(null);
  readonly debugResetToken = signal<string | null>(null);

  private readonly rateLimit = inject(AuthRateLimitService);
  private readonly portalApp = inject(PORTAL_APP);
  private readonly router = inject(Router);
  private readonly identityApi = inject(IdentityAuthApiService);

  readonly isRateLimited = computed(() => this.rateLimit.isBlocked());
  readonly remainingSeconds = computed(() => this.rateLimit.remainingSeconds());
  readonly rateLimitMessage = computed(() => this.rateLimit.message());

  constructor() {
    this.applyStoredRateLimit();
  }

  submit(
    payload: ForgotPasswordRequest,
    options: { navigateOnSuccess?: boolean; onSettled?: () => void } = {},
  ): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state.set('rate_limited');
      options.onSettled?.();
      return;
    }
    if (this.state() === 'submitting') {
      options.onSettled?.();
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.debugResetCode.set(null);
    this.debugResetToken.set(null);
    this.submittedEmail.set(payload.email);
    this.submittedMethod.set(payload.method);

    const portalHint = this.portalApp === 'backoffice' ? 'backoffice' : 'customer';
    this.identityApi.forgotPassword({ ...payload, portal: portalHint }).subscribe({
      next: (response) => {
        this.rateLimit.reset();
        const data = extractPayload(response);
        this.state.set('success');
        this.successMessage.set(
          data.message || 'Si la cuenta existe, enviamos instrucciones para restablecer la contraseña.',
        );
        this.debugResetCode.set(data.debug_reset_code ?? null);
        this.debugResetToken.set(data.debug_reset_token ?? null);
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
          this.state.set('rate_limited');
          options.onSettled?.();
          return;
        }
        this.rateLimit.reset();
        this.state.set('error');
        this.errorMessage.set(
          mappedError.status === 0
            ? 'Error de conexión. Verifica tu red e intenta de nuevo.'
            : 'No fue posible iniciar la recuperación en este momento.',
        );
        options.onSettled?.();
      },
    });
  }

  private applyStoredRateLimit(): void {
    this.rateLimit.sync();
    if (this.rateLimit.isBlocked()) {
      this.state.set('rate_limited');
    }
  }
}
