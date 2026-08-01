import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';
import { InviteUserVm } from '../../vm/invite-user';

@Component({
  selector: 'lib-invite-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invite-user-form.html',
  styleUrl: './invite-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(InviteUserVm);
  private readonly session = inject(SessionStore);

  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role_hint: this.fb.nonNullable.control<'admin' | 'operator' | 'viewer'>('operator', Validators.required),
  });

  private static readonly ROLE_HINTS: Record<'admin' | 'operator' | 'viewer', string> = {
    admin: 'Acceso administrativo completo: puede invitar usuarios y gestionar la empresa.',
    operator: 'Acceso operativo del día a día (contratos, préstamos, cuentas).',
    viewer: 'Acceso de solo consulta, sin permisos para crear o modificar.',
  };

  private readonly roleHintValue = toSignal(this.form.controls.role_hint.valueChanges, {
    initialValue: this.form.controls.role_hint.value,
  });

  protected readonly roleHint = computed(() => InviteUserForm.ROLE_HINTS[this.roleHintValue()]);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.vm.submit({ email: v.email, role_hint: v.role_hint });
  }

  cooldownActive(): boolean {
    return this.vm.cooldownUntil() > Date.now();
  }
}
