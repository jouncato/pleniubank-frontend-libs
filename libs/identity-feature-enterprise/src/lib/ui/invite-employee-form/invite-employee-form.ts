import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';
import { EmployeeInvitationItem, SubEnterpriseSummaryDto } from 'identity-domain';
import { PbIconComponent } from '@pleniu/ui';
import { InviteEmployeeVm, type SentEmployeeInviteRecord } from '../../vm/invite-employee';

@Component({
  selector: 'lib-invite-employee-form',
  imports: [CommonModule, ReactiveFormsModule, PbIconComponent],
  templateUrl: './invite-employee-form.html',
  styleUrl: './invite-employee-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteEmployeeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(InviteEmployeeVm);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute, { optional: true });

  /**
   * Cuando se invita desde el detalle de una unidad (customer-portal,
   * `business-structure/units/:unitId/employees/invite`), la unidad ya se
   * conoce por la ruta — se oculta el buscador y se resuelve directamente
   * por id (sin cargar el listado de unidades). Se puede pasar explícitamente
   * como `@Input`, o se toma del parámetro de ruta `unitId` si no se pasó.
   */
  @Input() preselectedSubEnterpriseId?: string;

  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  protected readonly pendingRevokeId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.preselectedSubEnterpriseId ??=
      this.route?.snapshot.paramMap.get('unitId') ?? undefined;
    if (this.preselectedSubEnterpriseId) {
      this.vm.resolvePreselected(this.preselectedSubEnterpriseId);
    }
    this.vm.loadPendingInvitations();
  }

  onSearchInput(query: string): void {
    this.vm.onQueryChange(query);
  }

  selectSubEnterprise(sub: SubEnterpriseSummaryDto): void {
    this.vm.selectSubEnterprise(sub);
  }

  changeSelection(): void {
    if (this.preselectedSubEnterpriseId) {
      return;
    }
    this.vm.clearSelection();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.vm.submit({ email: v.email, sub_enterprise_id: '' });
  }

  /** "Invitar a otro": conserva la unidad seleccionada (altas seguidas). */
  sendAnother(): void {
    this.vm.resetKeepUnit();
    this.form.controls.email.reset('');
  }

  askRevokeInvite(inviteId: string): void {
    this.pendingRevokeId.set(inviteId);
  }

  confirmRevokeInvite(): void {
    const id = this.pendingRevokeId();
    this.pendingRevokeId.set(null);
    if (id) {
      this.vm.revokePendingInvitation(id);
    }
  }

  protected trackByInviteId(_index: number, item: EmployeeInvitationItem | SentEmployeeInviteRecord): string {
    return item.invite_id;
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  }

  protected get validationSummary(): string[] {
    const errors: string[] = [];
    if (!this.vm.selectedSubEnterprise()) errors.push('Unidad de negocio');
    if (this.form.controls.email.invalid) errors.push('Correo del colaborador');
    return errors;
  }

  cooldownActive(): boolean {
    return this.vm.cooldownUntil() > Date.now();
  }
}
