import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PbLogoComponent, PbPasswordVisibilityToggleComponent } from '@pleniu/ui';

import { APP_PASSWORD_COMPLEXITY_PATTERN, APP_PASSWORD_MIN_LENGTH } from '../../password-policy';
import { ResetPasswordVm } from '../../vm/reset-password';

@Component({
  selector: 'lib-reset-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PbPasswordVisibilityToggleComponent, PbLogoComponent],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.scss',
})
export class ResetPasswordForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    token: [''],
    newPassword: ['', [Validators.required, Validators.minLength(12)]],
    confirmPassword: ['', [Validators.required]],
  });
  readonly minLength = APP_PASSWORD_MIN_LENGTH;

  private readonly cdr = inject(ChangeDetectorRef);

  constructor(protected readonly vm: ResetPasswordVm) {
    this.prefillAndMaybeConfirmFromQuery();
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

    if (!raw.token.trim()) {
      this.form.controls.token.setErrors({ required: true });
      return;
    }

    this.vm.submit(
      {
        email: raw.email,
        new_password: raw.newPassword,
        token: raw.token.trim(),
        portal: this.detectPortal(),
      },
      () => this.cdr.markForCheck(),
    );
  }

  get hasMinLength(): boolean {
    return (this.form.controls.newPassword.value || '').length >= APP_PASSWORD_MIN_LENGTH;
  }

  get hasComplexity(): boolean {
    return APP_PASSWORD_COMPLEXITY_PATTERN.test(this.form.controls.newPassword.value || '');
  }

  get passwordsMatch(): boolean {
    const raw = this.form.getRawValue();
    return !!raw.newPassword && raw.newPassword === raw.confirmPassword;
  }

  private prefillAndMaybeConfirmFromQuery(): void {
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const token = qp.get('token');
    const confirmationToken = qp.get('confirmation_token');
    const flow = (qp.get('flow') || '').trim().toLowerCase();

    if (email) {
      this.form.controls.email.setValue(email);
    }
    if (token) {
      this.form.controls.token.setValue(token);
    }
    if (flow === 'confirm' && email && confirmationToken) {
      this.vm.confirm(
        {
          email,
          confirmation_token: confirmationToken,
          portal: this.detectPortal(),
        },
        () => this.cdr.markForCheck(),
      );
    }
  }

  private detectPortal(): 'customer' | 'backoffice' {
    const path = (this.route.snapshot.routeConfig?.path || '').toLowerCase();
    if (path.includes('backoffice')) {
      return 'backoffice';
    }
    return 'customer';
  }
}
