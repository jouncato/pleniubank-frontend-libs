import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
export class OtpChallenge {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  readonly channel = this.route.snapshot.data['channel'] as 'email' | 'phone';

  constructor(
    protected readonly verifyEmailVm: VerifyEmailVm,
    protected readonly verifyPhoneVm: VerifyPhoneVm,
  ) {}

  get title(): string {
    return this.channel === 'phone' ? 'Verifica tu teléfono' : 'Verifica tu correo';
  }

  get submitting(): boolean {
    return this.channel === 'phone'
      ? this.verifyPhoneVm.state === 'submitting'
      : this.verifyEmailVm.state === 'submitting';
  }

  get errorMessage(): string | null {
    return this.channel === 'phone' ? this.verifyPhoneVm.errorMessage : this.verifyEmailVm.errorMessage;
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
}
