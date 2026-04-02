import { Injectable, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IdentityAuthApiService,
  unwrapPhoneOtpChallenge,
  unwrapRefreshResponse,
  unwrapValidateResponse,
} from 'identity-data-access';
import { isValidReturnUrl, SESSION_STRATEGY, SessionStrategy, SessionStore } from 'shared-auth';
import { mapHttpError } from 'shared-http';
import { switchMap, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VerifyPhonePostLoginVm {
  readonly state = signal<'idle' | 'starting' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly debugOtpHint = signal<string | null>(null);
  readonly resendSecondsLeft = signal(0);

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  private readonly sessionStrategy = inject<SessionStrategy>(SESSION_STRATEGY);

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
    this.identityApi.startPhoneOtpChallenge().subscribe({
      next: (raw) => {
        const body = unwrapPhoneOtpChallenge(raw);
        this.state.set('ready');
        if (body.debug_otp) {
          this.debugOtpHint.set(`Código de prueba (solo desarrollo): ${body.debug_otp}`);
        }
        this.armResendCooldown(60);
      },
      error: (error: unknown) => {
        const mapped = mapHttpError(error);
        this.state.set('error');
        this.errorMessage.set(
          mapped.status === 409
            ? 'Tu teléfono ya está verificado.'
            : mapped.errors[0]?.message?.trim() || 'No se pudo enviar el código.',
        );
      },
    });
  }

  resend(): void {
    if (this.resendSecondsLeft() > 0 || this.state() === 'starting') {
      return;
    }
    this.errorMessage.set(null);
    this.identityApi.resendPhoneOtpAuthenticated().subscribe({
      next: (raw) => {
        const body = unwrapPhoneOtpChallenge(raw);
        if (body.debug_otp) {
          this.debugOtpHint.set(`Código de prueba (solo desarrollo): ${body.debug_otp}`);
        }
        this.armResendCooldown(60);
      },
      error: (error: unknown) => {
        const mapped = mapHttpError(error);
        if (mapped.status === 429) {
          this.errorMessage.set('Espera unos segundos antes de reenviar el código.');
          this.armResendCooldown(60);
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message?.trim() || 'No se pudo reenviar el código.');
      },
    });
  }

  submit(code: string): void {
    const uid = this.sessionStore.claims()?.user_id?.trim();
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
      .verifyPhone({ registration_id: uid, code })
      .pipe(
        switchMap(() => this.identityApi.refresh()),
        map((raw) => unwrapRefreshResponse(raw)),
        tap((tokens) => {
          if (this.sessionStrategy !== 'httpOnlyCookie') {
            this.sessionStore.setUserToken(tokens.access_token);
            if (tokens.refresh_token) {
              this.sessionStore.setRefreshToken(tokens.refresh_token);
            }
          }
        }),
        switchMap(() => this.identityApi.validate()),
        map((v) => unwrapValidateResponse(v as never)),
      )
      .subscribe({
        next: ({ claims }) => {
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
              : mapped.errors[0]?.message?.trim() || 'No se pudo verificar el código.',
          );
        },
      });
  }

  dispose(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  private armResendCooldown(seconds: number): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    const cap = Math.min(Math.max(1, seconds), 120);
    this.resendSecondsLeft.set(cap);
    this.resendTimer = setInterval(() => {
      const left = this.resendSecondsLeft();
      if (left <= 1) {
        this.resendSecondsLeft.set(0);
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
        return;
      }
      this.resendSecondsLeft.set(left - 1);
    }, 1000);
  }
}
