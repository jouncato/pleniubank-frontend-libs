import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerifyPhonePostLoginVm } from '../../vm/verify-phone-post-login';
import { SessionVm } from '../../vm/session';

@Component({
  selector: 'lib-phone-verify-post-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './phone-verify-post-login.html',
  styleUrl: './phone-verify-post-login.scss',
})
export class PhoneVerifyPostLogin implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(VerifyPhonePostLoginVm);
  private readonly session = inject(SessionVm);

  private readonly codeField = viewChild<ElementRef<HTMLInputElement>>('codeField');

  private webOtpAbort: AbortController | null = null;

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  constructor() {
    effect(() => {
      const tick = this.vm.otpReissuedTick();
      if (tick > 0) {
        this.form.patchValue({ code: '' });
      }
    });
  }

  ngOnInit(): void {
    this.vm.startChallenge();
  }

  ngAfterViewInit(): void {
    this.bindWebOtp();
  }

  ngOnDestroy(): void {
    this.webOtpAbort?.abort();
    this.vm.dispose();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const code = this.form.getRawValue().code ?? '';
    this.vm.submit(code);
  }

  get submitting(): boolean {
    return this.vm.state() === 'submitting';
  }

  signOut(): void {
    this.session.logout();
  }

  private bindWebOtp(): void {
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
        /* usuario cancela o navegador sin soporte real */
      });
  }
}
