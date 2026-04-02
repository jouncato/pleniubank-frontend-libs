import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VerifyEmailVm } from '../../vm/verify-email';
import { VerifyPhoneVm } from '../../vm/verify-phone';

/**
 * OTP para flujos B2C (email/teléfono). El onboarding B2B usa `user_id` por correo
 * principal/admin vía `EnterpriseVerifyEmailPanel` en `identity-feature-enterprise`
 * (no importar aquí para evitar dependencia circular entre librerías).
 */
@Component({
  selector: 'lib-otp-challenge',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './otp-challenge.html',
  styleUrl: './otp-challenge.scss',
})
export class OtpChallenge implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly codeField = viewChild<ElementRef<HTMLInputElement>>('codeField');
  private webOtpAbort: AbortController | null = null;

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  /** Ruta debe definir `data.channel`; si falta, se infiere del path (p. ej. public-portal). */
  get channel(): 'email' | 'phone' {
    const fromData = this.route.snapshot.data['channel'];
    if (fromData === 'email' || fromData === 'phone') {
      return fromData;
    }
    const path = this.route.snapshot.routeConfig?.path ?? '';
    if (path.includes('phone')) {
      return 'phone';
    }
    if (path.includes('email')) {
      return 'email';
    }
    return 'email';
  }

  constructor(
    protected readonly verifyEmailVm: VerifyEmailVm,
    protected readonly verifyPhoneVm: VerifyPhoneVm,
  ) {}

  ngAfterViewInit(): void {
    this.bindWebOtp();
  }

  ngOnDestroy(): void {
    this.webOtpAbort?.abort();
  }

  get title(): string {
    return this.channel === 'phone' ? 'Verifica tu teléfono' : 'Verifica tu correo';
  }

  get submitting(): boolean {
    return this.channel === 'phone'
      ? this.verifyPhoneVm.state === 'submitting'
      : this.verifyEmailVm.state() === 'submitting';
  }

  get errorMessage(): string | null {
    return this.channel === 'phone'
      ? this.verifyPhoneVm.errorMessage
      : this.verifyEmailVm.errorMessage();
  }

  get resendEmailBusy(): boolean {
    return this.channel === 'email' && this.verifyEmailVm.state() === 'resending';
  }

  get resendEmailDisabled(): boolean {
    if (this.channel !== 'email') return true;
    return (
      this.verifyEmailVm.state() === 'resending' ||
      this.verifyEmailVm.resendSecondsLeft() > 0 ||
      this.verifyEmailVm.state() === 'submitting'
    );
  }

  get resendEmailSecondsLeft(): number {
    return this.channel === 'email' ? this.verifyEmailVm.resendSecondsLeft() : 0;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const code = this.form.getRawValue().code ?? '';
    if (this.channel === 'phone') {
      this.verifyPhoneVm.submit(code);
      return;
    }
    this.verifyEmailVm.submit(code);
  }

  resendEmailOtp(): void {
    if (this.channel !== 'email') return;
    this.verifyEmailVm.resendEmail();
  }

  private bindWebOtp(): void {
    if (this.channel !== 'phone') {
      return;
    }
    if (typeof window === 'undefined' || !('OTPCredential' in window)) {
      return;
    }
    const input = this.codeField()?.nativeElement;
    if (!input) {
      return;
    }
    this.webOtpAbort?.abort();
    const ac = new AbortController();
    this.webOtpAbort = ac;
    const navCred = navigator.credentials as CredentialsContainer & {
      get(
        options: { otp?: { transport: string[] }; signal?: AbortSignal },
      ): Promise<{ code?: string } | null>;
    };
    void navCred
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((cred) => {
        if (!cred?.code) {
          return;
        }
        const code = String(cred.code).replace(/\D/g, '').slice(0, 6);
        if (code.length === 6) {
          this.form.patchValue({ code });
        }
      })
      .catch(() => {
        /* cancelado o sin soporte real */
      });
  }
}
