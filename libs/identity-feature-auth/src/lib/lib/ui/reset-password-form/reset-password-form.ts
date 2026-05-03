import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
    token: [''],
    newPassword: ['', [Validators.required, Validators.minLength(12)]],
    confirmPassword: ['', [Validators.required]],
  });

  private readonly cdr = inject(ChangeDetectorRef);

  constructor(protected readonly vm: ResetPasswordVm) {
    this.prefillFromQuery();
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
      },
      () => this.cdr.markForCheck(),
    );
  }

  private prefillFromQuery(): void {
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const token = qp.get('token');

    if (email) {
      this.form.controls.email.setValue(email);
    }
    if (token) {
      this.form.controls.token.setValue(token);
    }
  }
}
