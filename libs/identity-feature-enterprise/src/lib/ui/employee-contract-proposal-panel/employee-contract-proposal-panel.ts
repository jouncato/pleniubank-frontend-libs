import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionStore } from '@pleniu/shared-auth';
import { EmployeeContractProposalVm } from '../../vm/employee-contract-proposal';

const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  VERIFIED: 'Verificado por tu empleador',
  PENDING: 'Pendiente de verificación',
  REJECTED: 'Rechazado — contacta a tu empleador',
};

@Component({
  selector: 'lib-employee-contract-proposal-panel',
  imports: [CommonModule, FormsModule],
  providers: [EmployeeContractProposalVm],
  templateUrl: './employee-contract-proposal-panel.html',
  styleUrl: './employee-contract-proposal-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeContractProposalPanel implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  protected readonly vm = inject(EmployeeContractProposalVm);

  readonly subEnterpriseId = this.route.snapshot.paramMap.get('subEnterpriseId') ?? '';

  /** `BusinessUnitAssignmentDto.company_code` es un código interno (p. ej.
   * "UNT-MSFABSHI-IDZW1LR"), no un nombre para mostrar -- se usa el nombre
   * real de la unidad que ya viaja en el claim de sesión. */
  readonly subEnterpriseName = computed(() => this.session.claims()?.sub_enterprise_name ?? null);

  constructor() {
    effect(() => {
      if (this.vm.state() === 'success' && this.vm.contract()) {
        this.goToPayrollAdvance();
      }
    });
  }

  readonly proposalTitle = computed(() => {
    const terms = this.vm.assignment()?.terms;
    return typeof terms?.['title'] === 'string' ? terms['title'] : 'Anticipo de nómina';
  });

  readonly proposalDescription = computed(() => {
    const terms = this.vm.assignment()?.terms;
    return typeof terms?.['description'] === 'string' ? terms['description'] : null;
  });

  readonly termConditions = computed(() => {
    const value = this.vm.assignment()?.terms?.['conditions'];
    return Array.isArray(value) ? (value as unknown[]).filter((item): item is string => typeof item === 'string') : [];
  });

  readonly termFees = computed(() => {
    const terms = this.vm.assignment()?.terms;
    return typeof terms?.['fees'] === 'string' ? terms['fees'] : null;
  });

  verificationStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Sin verificar';
    return VERIFICATION_STATUS_LABELS[status] ?? status;
  }

  verificationStatusTone(status: string | null | undefined): 'ok' | 'warn' | 'danger' {
    if (status === 'VERIFIED') return 'ok';
    if (status === 'REJECTED') return 'danger';
    return 'warn';
  }

  ngOnInit(): void {
    if (!this.subEnterpriseId) {
      this.vm.errorMessage.set('No se encontró la unidad de negocio.');
      this.vm.state.set('error');
      return;
    }
    this.vm.load(this.subEnterpriseId);
  }

  accept(): void {
    if (!this.subEnterpriseId) {
      return;
    }
    this.vm.accept(this.subEnterpriseId);
  }

  goToPayrollAdvance(): void {
    const contract = this.vm.contract();
    const queryParams = contract ? { contract_id: contract.id } : {};
    void this.router.navigate(['/app/personal/payroll-advance/request'], { queryParams });
  }
}
