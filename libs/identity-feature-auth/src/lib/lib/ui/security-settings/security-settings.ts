import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerChangePasswordForm } from '../customer-change-password-form/customer-change-password-form';
import { SecuritySettingsVm } from '../../vm/security-settings';

@Component({
  selector: 'lib-security-settings',
  imports: [CommonModule, ReactiveFormsModule, CustomerChangePasswordForm],
  templateUrl: './security-settings.html',
  styleUrl: './security-settings.scss',
})
export class SecuritySettings {
  private readonly fb = inject(FormBuilder);

  /** En página dedicada (`/app/settings/security`) el h1 va en el shell; ocultar el h2 duplicado. */
  readonly showHeading = input(true);

  readonly mfaForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(protected readonly vm: SecuritySettingsVm) {}

  patchMfa(enabled: boolean): void {
    this.vm.resetMfaFeedback();
    const c = this.mfaForm.controls.currentPassword;
    if (c.invalid) {
      c.markAsTouched();
      return;
    }
    this.vm.patchMfa(enabled, c.value);
  }
}
