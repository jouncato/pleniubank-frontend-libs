import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isEnterpriseAdministratorRole, SessionStore } from 'shared-auth';
import { EnterpriseUserCreateVm } from '../../vm/enterprise-user-create';

@Component({
  selector: 'lib-enterprise-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enterprise-user-form.html',
  styleUrl: './enterprise-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseUserForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(EnterpriseUserCreateVm);
  private readonly session = inject(SessionStore);

  /** Jerarquía B2B: administradores no deben poder mutar la cuenta del Principal (refuerzo en UI). */
  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    role_in_enterprise: this.fb.nonNullable.control<'admin' | 'operator' | 'viewer'>('operator', Validators.required),
    permissionsJson: ['{}'],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const perms = this.vm.parsePermissionsJson(v.permissionsJson);
    if (perms === null) {
      this.form.controls.permissionsJson.setErrors({ json: true });
      return;
    }
    this.form.controls.permissionsJson.setErrors(null);
    this.vm.submit({
      email: v.email,
      full_name: v.full_name,
      password: v.password,
      role_in_enterprise: v.role_in_enterprise,
      permissions: perms,
    });
  }
}
