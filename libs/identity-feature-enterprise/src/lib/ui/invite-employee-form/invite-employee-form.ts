import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

  protected readonly showAdminHierarchyHint = computed(() =>
    isEnterpriseAdministratorRole(this.session.claims()?.role),
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
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
