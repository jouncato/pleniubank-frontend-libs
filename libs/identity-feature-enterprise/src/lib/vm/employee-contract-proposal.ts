import { Injectable, signal } from '@angular/core';
import type {
  BusinessUnitAssignmentDto,
  ClientContractDto,
  CustomerEmploymentProfile,
  PayrollAdvancePolicyDecision,
} from '@pleniu/core-domain';
import {
  CoreBusinessUnitAssignmentsApiService,
  CoreClientContractsApiService,
  CoreEmploymentProfilesApiService,
  CorePayrollAdvancesApiService,
} from '@pleniu/core-data-access';
import { mapHttpError } from '@pleniu/shared-http';
import { SessionStore } from '@pleniu/shared-auth';

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

  /**
   * Auditoría 2026-08-11: la sección "Términos y condiciones" solo se
   * mostraba si la empresa había cargado un JSON libre opcional
   * (`assignment.terms.conditions`/`fees`) -- si no lo hizo, el empleado
   * podía aceptar el anticipo sin ver ninguna condición (tasa, plazos,
   * límites), un riesgo real de transparencia. Se resuelve la elegibilidad
   * canónica (`GET /payroll-advances/eligibility`, la MISMA que usa
   * `payroll-advance.vm.ts` en el paso de solicitud) para mostrar SIEMPRE
   * la política efectiva y el cupo estimado, sin depender de que la empresa
   * haya llenado el campo opcional. `previewPolicy` (usada primero) se
   * descartó: es un endpoint solo para roles de administración empresarial
   * -- devuelve 403 para el propio empleado (`customer`), confirmado en vivo.
   */
  readonly eligibility = signal<PayrollAdvancePolicyDecision | null>(null);

  /** Comisión flat vigente del anticipo, como fracción -- vive fuera de
   * `eligibility()` (categoría "pricing" en Core, no elegibilidad). Se
   * muestra al customer antes de aceptar la propuesta (2026-08-11). */
  readonly feeRate = signal<number | null>(null);

  constructor(
    private readonly assignmentsApi: CoreBusinessUnitAssignmentsApiService,
    private readonly profilesApi: CoreEmploymentProfilesApiService,
    private readonly contractsApi: CoreClientContractsApiService,
    private readonly payrollAdvancesApi: CorePayrollAdvancesApiService,
    private readonly session: SessionStore,
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
            this.errorMessage.set('No hay una propuesta de anticipo activa para esta unidad.');
            return;
          }
          this.assignment.set(active);
          this.loadEligibility();
          this.loadProfile();
        },
        error: (err: unknown) => {
          const mapped = mapHttpError(err);
          this.state.set('error');
          this.errorMessage.set(
            mapped.errors[0]?.message ?? 'No se pudo cargar la propuesta de anticipo.',
          );
        },
      });
  }

  private loadEligibility(): void {
    const customerId = this.session.claims()?.customer_id;
    if (!customerId) {
      return;
    }
    this.payrollAdvancesApi.getEligibility({ customer_id: customerId }).subscribe({
      next: (envelope) => {
        this.eligibility.set(envelope.data?.decision ?? null);
        this.feeRate.set(envelope.data?.fee_rate ?? null);
      },
      error: () => {
        this.eligibility.set(null);
        this.feeRate.set(null);
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
          this.errorMessage.set('Ya tienes un anticipo de nómina activo.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo activar el anticipo. Intenta más tarde.');
      },
    });
  }
}
