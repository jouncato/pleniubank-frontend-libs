import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { isEnterpriseAdministratorRole, SessionStore } from '@pleniu/shared-auth';
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
   * conoce por la ruta — se oculta el selector y se preselecciona apenas
   * carga la lista de unidades de la empresa. Se puede pasar explícitamente
   * como `@Input`, o se toma del parámetro de ruta `unitId` si no se pasó.
   */
  @Input() preselectedSubEnterpriseId?: string;

  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly applyPreselection = effect(() => {
    if (!this.preselectedSubEnterpriseId || this.vm.selectedSubEnterprise()) {
      return;
    }
    const match = this.vm
      .subEnterprises()
      .find((s) => s.sub_enterprise_id === this.preselectedSubEnterpriseId);
    if (match) {
      this.vm.selectSubEnterprise(match);
    }
  });

  ngOnInit(): void {
    this.preselectedSubEnterpriseId ??=
      this.route?.snapshot.paramMap.get('unitId') ?? undefined;
    this.vm.loadSubEnterprises();
  }

  selectSubEnterprise(subEnterpriseId: string): void {
    const selected = this.vm.subEnterprises().find((s) => s.sub_enterprise_id === subEnterpriseId) ?? null;
    this.vm.selectSubEnterprise(selected);
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
