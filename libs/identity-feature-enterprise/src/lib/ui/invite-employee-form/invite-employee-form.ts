import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';
import { SubEnterpriseSummaryDto } from 'identity-domain';
import { InviteEmployeeVm } from '../../vm/invite-employee';

@Component({
  selector: 'lib-invite-employee-form',
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.preselectedSubEnterpriseId ??=
      this.route?.snapshot.paramMap.get('unitId') ?? undefined;
    if (this.preselectedSubEnterpriseId) {
      this.vm.resolvePreselected(this.preselectedSubEnterpriseId);
    }
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

  cooldownActive(): boolean {
    return this.vm.cooldownUntil() > Date.now();
  }
}
