import { computed, Injectable, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IdentityAuthApiService,
  unwrapPhoneOtpChallenge,
  unwrapValidateResponse,
} from '@pleniu/identity-data-access';
import { isValidReturnUrl, SessionStore } from '@pleniu/shared-auth';
import { mapHttpError, type ApiHttpError } from '@pleniu/shared-http';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VerifyPhonePostLoginVm {
  readonly state = signal<'idle' | 'starting' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly debugOtpHint = signal<string | null>(null);
  readonly resendSecondsLeft = signal(0);
  /** Segundos restantes de validez del OTP según Identity (`expires_in_seconds`). */
  readonly otpExpiresSecondsLeft = signal<number | null>(null);
  /** Aviso tras caducidad automática o reemisión. */
  readonly autoRenewNotice = signal<string | null>(null);
  /** Se incrementa cuando hay un código nuevo (limpia el input en la vista). */
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

  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private otpExpiryTimer: ReturnType<typeof setInterval> | null = null;
  private autoRenewInFlight = false;

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

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
        this.errorMessage.set(this.firstMappedMessage(mapped, 'No se pudo enviar el código.'));
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
          this.armResendCooldown(60);
          return;
        }
        this.errorMessage.set(this.firstMappedMessage(mapped, 'No se pudo reenviar el código.'));
      },
    });
  }

  submit(code: string): void {
    const uid = this.sessionStore.claims()?.user_id?.trim();
    const digits = code.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      this.errorMessage.set('Introduce los 6 dígitos del SMS.');
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
          this.sessionStore.setClaims({
            ...claims,
            email: claims.email,
          });
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
              : this.firstMappedMessage(mapped, 'No se pudo verificar el código.'),
          );
        },
      });
  }

  dispose(): void {
    this.clearResendTimer();
    this.clearOtpExpiryTimer();
    this.autoRenewInFlight = false;
  }

  private firstMappedMessage(mapped: ApiHttpError, fallback: string): string {
    return mapped.errors[0]?.message?.trim() || fallback;
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
    if (body.debug_otp) {
      this.debugOtpHint.set(`Código de prueba (solo desarrollo): ${body.debug_otp}`);
    } else {
      this.debugOtpHint.set(null);
    }
    this.armResendCooldown(60);
    this.armOtpExpiryCountdown(body.expires_in_seconds);
  }

  private armOtpExpiryCountdown(seconds: number): void {
    this.clearOtpExpiryTimer();
    const cap = Math.min(Math.max(1, Math.floor(seconds)), 7200);
    this.otpExpiresSecondsLeft.set(cap);
    this.otpExpiryTimer = setInterval(() => {
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
        this.autoRenewNotice.set('El código anterior caducó; te enviamos uno nuevo por SMS.');
        this.consumeChallengeResponse(raw, { bumpReissue: true });
      },
      error: () => {
        this.autoRenewInFlight = false;
        this.autoRenewNotice.set(
          'El código expiró. Pulsa «Reenviar código por SMS» para recibir uno nuevo.',
        );
        this.otpExpiresSecondsLeft.set(null);
      },
    });
  }

  private armResendCooldown(seconds: number): void {
    this.clearResendTimer();
    const cap = Math.min(Math.max(1, seconds), 120);
    this.resendSecondsLeft.set(cap);
    this.resendTimer = setInterval(() => {
      const left = this.resendSecondsLeft();
      if (left <= 1) {
        this.resendSecondsLeft.set(0);
        this.clearResendTimer();
        return;
      }
      this.resendSecondsLeft.set(left - 1);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  private clearOtpExpiryTimer(): void {
    if (this.otpExpiryTimer) {
      clearInterval(this.otpExpiryTimer);
      this.otpExpiryTimer = null;
    }
  }
}
