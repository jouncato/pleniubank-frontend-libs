import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordResetMethod } from 'identity-domain';

import { ForgotPasswordVm } from '../../vm/forgot-password';

@Component({
  selector: 'lib-forgot-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-form.html',
  styleUrl: './forgot-password-form.scss',
})
export class ForgotPasswordForm {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    method: ['otp' as PasswordResetMethod],
  });

  constructor(protected readonly vm: ForgotPasswordVm) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, method } = this.form.getRawValue();
    this.vm.submit({ email, method });
  }

  buildResetQueryParams(): Record<string, string> | null {
    if (!this.vm.submittedEmail) {
      return null;
    }
    if (this.vm.submittedMethod === 'otp' && this.vm.debugResetCode) {
      return {
        email: this.vm.submittedEmail,
        code: this.vm.debugResetCode,
      };
    }
    if (this.vm.submittedMethod === 'link' && this.vm.debugResetToken) {
      return {
        email: this.vm.submittedEmail,
        token: this.vm.debugResetToken,
      };
    }
    return null;
  }
}
