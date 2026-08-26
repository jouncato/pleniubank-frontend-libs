import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';

const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

function jsonObjectValidator(control: AbstractControl<string>): ValidationErrors | null {
  try {
    const parsed = JSON.parse(control.value);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? null : { json: true };
  } catch {
    return { json: true };
  }
}
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import { EnterpriseUserCreateVm } from '../../vm/enterprise-user-create';

@Component({
  selector: 'lib-enterprise-user-form',
  imports: [CommonModule, ReactiveFormsModule, PbPasswordVisibilityToggleComponent],
  providers: [EnterpriseUserCreateVm],
  templateUrl: './enterprise-user-form.html',
  styleUrl: './enterprise-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseUserForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(EnterpriseUserCreateVm);
  private readonly session = inject(SessionStore);
  readonly showPassword = signal(false);

  /** Jerarquía B2B: administradores no deben poder mutar la cuenta del Principal (refuerzo en UI). */
  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)]],
    role_in_enterprise: this.fb.nonNullable.control<'admin' | 'operator' | 'viewer'>('operator', Validators.required),
    permissionsJson: ['{}', [Validators.required, jsonObjectValidator]],
  });

  get validationSummary(): string[] {
    const fields = [
      ['email', 'Correo electrónico'],
      ['full_name', 'Nombre completo'],
      ['password', 'Contraseña'],
      ['role_in_enterprise', 'Rol en empresa'],
      ['permissionsJson', 'Permisos'],
    ] as const;
    return fields.filter(([field]) => this.form.controls[field].invalid).map(([, label]) => label);
  }

  passwordErrorMessage(): string {
    if (this.form.controls.password.hasError('required')) return 'La contraseña es obligatoria.';
    return 'Debe tener mínimo 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
  }

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
