import { computed, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IdentityAuthApiService,
  unwrapPhoneOtpChallenge,
  unwrapValidateResponse,
} from '@pleniu/identity-data-access';
import { isValidReturnUrl, SessionStore } from '@pleniu/shared-auth';
import { mapHttpError, resolveApiErrorMessage } from '@pleniu/shared-http';
import { switchMap, map } from 'rxjs/operators';

import { createCountdownTimer } from '../countdown-timer';

@Injectable({
  providedIn: 'root',
})
export class VerifyPhonePostLoginVm {
  readonly state = signal<'idle' | 'starting' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly debugOtpHint = signal<string | null>(null);
  readonly resendSecondsLeft = signal(0);
  readonly otpExpiresSecondsLeft = signal<number | null>(null);
  readonly autoRenewNotice = signal<string | null>(null);
  readonly otpReissuedTick = signal(0);

  readonly otpTtlLabel = computed(() => {
    const s = this.otpExpiresSecondsLeft();
    if (s === null || s <= 0) {
      return null;
    }
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  });

  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private autoRenewInFlight = false;

  private readonly resendTimer = createCountdownTimer(this.resendSecondsLeft);
  // otpExpiresSecondsLeft can be null (not started) so we need a separate writableSignal
  // The expiry timer wraps a plain number-signal obtained indirectly
  private otpExpiryHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.resendTimer.stop();
      this.clearOtpExpiryTimer();
    });
  }

  startChallenge(): void {
    if (this.state() === 'starting') {
      return;
    }
    this.state.set('starting');
    this.errorMessage.set(null);
    this.autoRenewNotice.set(null);
    this.identityApi.startPhoneOtpChallenge().subscribe({
      next: (raw) => {
        this.state.set('ready');
        this.consumeChallengeResponse(raw);
      },
      error: (error: unknown) => {
        const mapped = mapHttpError(error);
        if (mapped.status === 409) {
          this.state.set('ready');
          void this.router.navigateByUrl('/app/dashboard');
          return;
        }
        this.state.set('error');
        this.errorMessage.set(resolveApiErrorMessage(mapped, 'No se pudo enviar el código.'));
      },
    });
  }

  resend(): void {
    if (this.resendSecondsLeft() > 0 || this.state() === 'starting') {
      return;
    }
    this.errorMessage.set(null);
    this.autoRenewNotice.set(null);
    this.identityApi.resendPhoneOtpAuthenticated().subscribe({
      next: (raw) => {
        this.consumeChallengeResponse(raw, { bumpReissue: true });
      },
      error: (error: unknown) => {
        const mapped = mapHttpError(error);
        if (mapped.status === 429) {
          this.errorMessage.set('Espera unos segundos antes de reenviar el código.');
          this.resendTimer.start(60);
          return;
        }
        this.errorMessage.set(resolveApiErrorMessage(mapped, 'No se pudo reenviar el código.'));
      },
    });
  }

  submit(code: string): void {
    const uid = this.sessionStore.claims()?.user_id?.trim();
    const digits = code.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      this.errorMessage.set('Introduce los 6 dígitos del código enviado por SMS o correo.');
      return;
    }
    if (!uid) {
      this.errorMessage.set('Sesión inválida. Vuelve a iniciar sesión.');
      return;
    }
    if (this.state() === 'submitting') {
      return;
    }
    this.state.set('submitting');
    this.errorMessage.set(null);

    this.identityApi
      .verifyPhone({ registration_id: uid, code: digits })
      .pipe(
        // Sin refresh intermedio: el JWT sigue válido (mismo token_version) y evita 401 si ver en BD ≠ ver en token.
        switchMap(() => this.identityApi.validate()),
        map((v) => unwrapValidateResponse(v as never)),
      )
      .subscribe({
        next: ({ claims }) => {
          this.clearOtpExpiryTimer();
          this.sessionStore.setClaims({ ...claims });
          this.state.set('success');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;
          const safe = isValidReturnUrl(returnUrl) ? returnUrl : '/app/dashboard';
          void this.router.navigateByUrl(safe);
        },
        error: (error: unknown) => {
          const mapped = mapHttpError(error);
          this.state.set('ready');
          this.errorMessage.set(
            mapped.status === 422 || mapped.status === 404
              ? 'Código incorrecto o expirado.'
              : resolveApiErrorMessage(mapped, 'No se pudo verificar el código.'),
          );
        },
      });
  }

  dispose(): void {
    this.resendTimer.stop();
    this.clearOtpExpiryTimer();
    this.autoRenewInFlight = false;
  }

  private consumeChallengeResponse(
    raw: unknown,
    options: { bumpReissue?: boolean } = {},
  ): void {
    const body = unwrapPhoneOtpChallenge(raw as never);
    this.applyChallengePayload(body);
    if (options.bumpReissue) {
      this.otpReissuedTick.update((n) => n + 1);
    }
  }

  private applyChallengePayload(body: { expires_in_seconds: number; debug_otp?: string | null }): void {
    this.debugOtpHint.set(
      body.debug_otp ? `Código de prueba (solo desarrollo): ${body.debug_otp}` : null,
    );
    this.resendTimer.start(60);
    this.armOtpExpiryCountdown(body.expires_in_seconds);
  }

  private armOtpExpiryCountdown(seconds: number): void {
    this.clearOtpExpiryTimer();
    const cap = Math.min(Math.max(1, Math.floor(seconds)), 7200);
    this.otpExpiresSecondsLeft.set(cap);
    this.otpExpiryHandle = setInterval(() => {
      const left = this.otpExpiresSecondsLeft();
      if (left === null || left <= 1) {
        this.otpExpiresSecondsLeft.set(0);
        this.clearOtpExpiryTimer();
        this.onOtpWindowElapsed();
        return;
      }
      this.otpExpiresSecondsLeft.set(left - 1);
    }, 1000);
  }

  private onOtpWindowElapsed(): void {
    if (this.autoRenewInFlight) {
      return;
    }
    if (this.state() === 'submitting' || this.state() === 'success') {
      return;
    }
    this.autoRenewInFlight = true;
    this.identityApi.startPhoneOtpChallenge().subscribe({
      next: (raw) => {
        this.autoRenewInFlight = false;
        if (this.state() === 'error') {
          this.state.set('ready');
        }
        this.autoRenewNotice.set('El código anterior caducó; te enviamos uno nuevo por SMS y correo.');
        this.consumeChallengeResponse(raw, { bumpReissue: true });
      },
      error: () => {
        this.autoRenewInFlight = false;
        this.autoRenewNotice.set(
          'El código expiró. Pulsa «Reenviar código (SMS y correo)» para recibir uno nuevo.',
        );
        this.otpExpiresSecondsLeft.set(null);
      },
    });
  }

  private clearOtpExpiryTimer(): void {
    if (this.otpExpiryHandle !== null) {
      clearInterval(this.otpExpiryHandle);
      this.otpExpiryHandle = null;
    }
  }
}
