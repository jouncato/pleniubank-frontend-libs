import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeContractProposalVm } from '../../vm/employee-contract-proposal';

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
  protected readonly vm = inject(EmployeeContractProposalVm);

  readonly subEnterpriseId = this.route.snapshot.paramMap.get('subEnterpriseId') ?? '';

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
