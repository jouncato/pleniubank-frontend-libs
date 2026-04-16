import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  });

  constructor(protected readonly vm: ForgotPasswordVm) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email } = this.form.getRawValue();
    this.vm.submit({ email, method: 'link' });
  }

  buildResetQueryParams(): Record<string, string> | null {
    if (!this.vm.submittedEmail || !this.vm.debugResetToken) {
      return null;
    }
    return {
      email: this.vm.submittedEmail,
      token: this.vm.debugResetToken,
    };
  }
}
