import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PasswordResetMethod } from 'identity-domain';

import { ResetPasswordVm } from '../../vm/reset-password';

@Component({
  selector: 'lib-reset-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.scss',
})
export class ResetPasswordForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    method: ['otp' as PasswordResetMethod],
    code: [''],
    token: [''],
    newPassword: ['', [Validators.required, Validators.minLength(12)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(protected readonly vm: ResetPasswordVm) {
    this.prefillFromQuery();
  }

  onMethodChange(): void {
    if (this.form.controls.method.value === 'otp') {
      this.form.controls.token.setValue('');
      this.form.controls.token.setErrors(null);
      return;
    }
    this.form.controls.code.setValue('');
    this.form.controls.code.setErrors(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.newPassword !== raw.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }

    if (raw.method === 'otp' && !raw.code.trim()) {
      this.form.controls.code.setErrors({ required: true });
      return;
    }
    if (raw.method === 'link' && !raw.token.trim()) {
      this.form.controls.token.setErrors({ required: true });
      return;
    }

    this.vm.submit({
      email: raw.email,
      new_password: raw.newPassword,
      code: raw.method === 'otp' ? raw.code.trim() : undefined,
      token: raw.method === 'link' ? raw.token.trim() : undefined,
    });
  }

  private prefillFromQuery(): void {
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const code = qp.get('code');
    const token = qp.get('token');

    if (email) {
      this.form.controls.email.setValue(email);
    }
    if (token) {
      this.form.controls.method.setValue('link');
      this.form.controls.token.setValue(token);
      return;
    }
    if (code) {
      this.form.controls.method.setValue('otp');
      this.form.controls.code.setValue(code);
    }
  }
}
