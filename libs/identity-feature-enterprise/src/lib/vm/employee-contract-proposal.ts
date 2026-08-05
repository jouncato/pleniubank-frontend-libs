import { Injectable, signal } from '@angular/core';
import type { BusinessUnitAssignmentDto, ClientContractDto, CustomerEmploymentProfile } from '@pleniu/core-domain';
import {
  CoreBusinessUnitAssignmentsApiService,
  CoreClientContractsApiService,
  CoreEmploymentProfilesApiService,
} from '@pleniu/core-data-access';
import { mapHttpError } from '@pleniu/shared-http';

export type EmployeeContractProposalState =
  | 'idle'
  | 'loading'
  | 'error'
  | 'accepting'
  | 'success';

@Injectable()
export class EmployeeContractProposalVm {
  readonly state = signal<EmployeeContractProposalState>('idle');
  readonly assignment = signal<BusinessUnitAssignmentDto | null>(null);
  readonly profile = signal<CustomerEmploymentProfile | null>(null);
  readonly contract = signal<ClientContractDto | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly termsAccepted = signal<boolean>(false);

  constructor(
    private readonly assignmentsApi: CoreBusinessUnitAssignmentsApiService,
    private readonly profilesApi: CoreEmploymentProfilesApiService,
    private readonly contractsApi: CoreClientContractsApiService,
  ) {}

  load(subEnterpriseId: string): void {
    if (this.state() === 'loading') {
      return;
    }
    this.state.set('loading');
    this.errorMessage.set(null);

    this.assignmentsApi
      .listAvailableProducts(subEnterpriseId)
      .subscribe({
        next: (envelope) => {
          const items = envelope.data ?? [];
          const active =
            items.find((a) => a.product_type === 'PAYROLL_ADVANCE' && a.status === 'ACTIVE') ?? null;
          if (!active) {
            this.state.set('error');
            this.errorMessage.set('No hay una propuesta de contrato activa para esta unidad.');
            return;
          }
          this.assignment.set(active);
          this.loadProfile();
        },
        error: (err: unknown) => {
          const mapped = mapHttpError(err);
          this.state.set('error');
          this.errorMessage.set(
            mapped.errors[0]?.message ?? 'No se pudo cargar la propuesta de contrato.',
          );
        },
      });
  }

  private loadProfile(): void {
    this.profilesApi.getMyProfile().subscribe({
      next: (envelope) => {
        this.profile.set(envelope.data ?? null);
        this.state.set('idle');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        if (mapped.status === 404) {
          this.profile.set(null);
          this.state.set('idle');
          return;
        }
        this.state.set('error');
        this.errorMessage.set(
          mapped.errors[0]?.message ?? 'No se pudo cargar tu perfil laboral.',
        );
      },
    });
  }

  toggleTermsAccepted(accepted: boolean): void {
    this.termsAccepted.set(accepted);
  }

  accept(subEnterpriseId: string): void {
    if (this.state() === 'accepting') {
      return;
    }
    if (!this.termsAccepted()) {
      this.errorMessage.set('Debes aceptar los términos para continuar.');
      return;
    }

    this.state.set('accepting');
    this.errorMessage.set(null);

    const payload = {
      sub_enterprise_id: subEnterpriseId,
      accepted_at: new Date().toISOString(),
      ip_address: null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    this.contractsApi.createFromProposal(payload).subscribe({
      next: (envelope) => {
        this.contract.set(envelope.data ?? null);
        this.state.set('success');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 400) {
          this.errorMessage.set(mapped.errors[0]?.message ?? 'No cumples los requisitos para aceptar la propuesta.');
          return;
        }
        if (mapped.status === 409) {
          this.errorMessage.set('Ya tienes un contrato activo de anticipo de nómina.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo crear el contrato. Intenta más tarde.');
      },
    });
  }
}
