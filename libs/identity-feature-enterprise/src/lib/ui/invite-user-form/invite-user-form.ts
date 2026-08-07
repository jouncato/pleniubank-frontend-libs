import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';
import { PbIconComponent, type PbIconName } from '@pleniu/ui';
import { InviteUserVm, type SentInviteRecord } from '../../vm/invite-user';

type InviteRole = 'admin' | 'operator' | 'viewer';

interface RoleCard {
  value: InviteRole;
  icon: PbIconName;
  name: string;
  scope: string;
  capabilities: string[];
}

/** Tarjetas de rol: misma fuente de verdad que antes (los hints del select),
 *  elevadas a tarjetas seleccionables con capacidades explícitas. */
const ROLE_CARDS: readonly RoleCard[] = [
  {
    value: 'admin',
    icon: 'shield-check',
    name: 'Administrador',
    scope: 'Acceso administrativo completo: puede invitar usuarios y gestionar la empresa.',
    capabilities: ['Invitar y gestionar usuarios', 'Gestionar empresa y unidades', 'Aprobar operaciones'],
  },
  {
    value: 'operator',
    icon: 'briefcase',
    name: 'Operador',
    scope: 'Acceso operativo del día a día (contratos, préstamos, cuentas).',
    capabilities: ['Gestionar contratos y préstamos', 'Operar cuentas', 'Sin gestión de usuarios'],
  },
  {
    value: 'viewer',
    icon: 'eye',
    name: 'Solo lectura',
    scope: 'Acceso de solo consulta, sin permisos para crear o modificar.',
    capabilities: ['Consultar información', 'Sin acciones de escritura'],
  },
];

@Component({
  selector: 'lib-invite-user-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PbIconComponent],
  templateUrl: './invite-user-form.html',
  styleUrl: './invite-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(InviteUserVm);
  private readonly session = inject(SessionStore);

  protected readonly roleCards = ROLE_CARDS;

  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role_hint: this.fb.nonNullable.control<InviteRole>('operator', Validators.required),
  });

  private readonly roleHintValue = toSignal(this.form.controls.role_hint.valueChanges, {
    initialValue: this.form.controls.role_hint.value,
  });

  protected readonly selectedRole = computed(() => this.roleHintValue());

  protected selectRole(role: InviteRole): void {
    this.form.controls.role_hint.setValue(role);
    this.form.controls.role_hint.markAsTouched();
  }

  protected roleName(roleHint: string): string {
    return ROLE_CARDS.find((r) => r.value === roleHint)?.name ?? roleHint;
  }

  protected trackByInviteId(_index: number, record: SentInviteRecord): string {
    return record.invite_id;
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.vm.submit({ email: v.email, role_hint: v.role_hint });
  }

  sendAnother(): void {
    this.vm.reset();
    this.form.controls.email.reset('');
  }

  cooldownActive(): boolean {
    return this.vm.cooldownUntil() > Date.now();
  }
}
