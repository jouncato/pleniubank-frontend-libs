import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import {
  APP_PASSWORD_COMPLEXITY_PATTERN,
  APP_PASSWORD_MIN_LENGTH,
} from '../../password-policy';
import { CustomerChangePasswordVm } from '../../vm/customer-change-password';

@Component({
  selector: 'lib-customer-change-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, PbPasswordVisibilityToggleComponent],
  templateUrl: './customer-change-password-form.html',
  styleUrl: './customer-change-password-form.scss',
})
export class CustomerChangePasswordForm {
  private readonly fb = inject(FormBuilder);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(APP_PASSWORD_MIN_LENGTH),
        Validators.pattern(APP_PASSWORD_COMPLEXITY_PATTERN),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(protected readonly vm: CustomerChangePasswordVm) {}

  get newPwd(): string {
    return this.form.controls.newPassword.value;
  }

  get hasMinLengthPassword(): boolean {
    return this.newPwd.length >= APP_PASSWORD_MIN_LENGTH;
  }

  get hasUpperPassword(): boolean {
    return /[A-Z]/.test(this.newPwd);
  }

  get hasLowerPassword(): boolean {
    return /[a-z]/.test(this.newPwd);
  }

  get hasNumberPassword(): boolean {
    return /\d/.test(this.newPwd);
  }

  get hasSymbolPassword(): boolean {
    return /[^A-Za-z0-9]/.test(this.newPwd);
  }

  onNewPasswordInput(): void {
    const c = this.form.controls.confirmPassword;
    if (!c.value || !c.hasError('mismatch')) {
      return;
    }
    if (this.newPwd === c.value) {
      const next = { ...(c.errors ?? {}) };
      delete next['mismatch'];
      c.setErrors(Object.keys(next).length > 0 ? next : null);
    }
  }

  submit(): void {
    this.vm.resetFeedback();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.newPassword !== raw.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }
    if (raw.currentPassword === raw.newPassword) {
      this.form.controls.newPassword.setErrors({ sameAsCurrent: true });
      return;
    }
    this.vm.submit(raw.currentPassword, raw.newPassword);
  }
}
