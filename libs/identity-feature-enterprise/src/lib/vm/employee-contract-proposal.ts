import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  /**
   * Auditoría de calidad 2026-08-12 (P2.9): las 4 llamadas HTTP de este VM
   * (`load` -> `checkExistingContract` -> `loadEligibility`/`loadProfile`)
   * no cancelaban su suscripción al destruirse el componente que provee
   * este VM (`providers: [EmployeeContractProposalVm]`) -- inconsistente
   * con el resto de VMs de este repo. Mismo patrón ya usado en
   * `pleniubank-customer-portal/.../master-contract-assignments.ts`.
   */
  private readonly destroyRef = inject(DestroyRef);

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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
          this.checkExistingContract(active);
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

  /**
   * Auditoría 2026-08-11: esta pantalla nunca comprobaba si el empleado ya
   * había aceptado la propuesta -- siempre mostraba el formulario de
   * aceptación, sin importar cuántas veces se hubiera aceptado antes. Un
   * segundo clic en "Aceptar" no duplicaba nada (Core ya lo bloquea,
   * `DUPLICATE_ENTITY`/409, confirmado en vivo), pero el empleado veía un
   * error confuso ("Ya tienes un anticipo de nómina activo") en vez de ser
   * llevado directo a solicitar su anticipo, que es lo que ya puede hacer.
   * Se reutiliza el mismo mecanismo de éxito (`state='success'` +
   * `contract`) que ya dispara la redirección en
   * `EmployeeContractProposalPanel` -- no se inventa un camino nuevo.
   */
  private checkExistingContract(active: BusinessUnitAssignmentDto): void {
    this.contractsApi
      .listMyAssignedContracts({ limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (envelope) => {
          const existing = (envelope.data ?? []).find(
            (c) => c.master_assignment_id === active.master_assignment_id && c.status === 'ACTIVE',
          );
          if (existing) {
            this.contract.set(existing);
            this.state.set('success');
            return;
          }
          this.loadEligibility();
          this.loadProfile();
        },
        error: () => {
          // Fail-open deliberado: si no se puede confirmar el estado previo,
          // se sigue el camino normal (mostrar la propuesta) -- Core igual
          // bloquea una segunda aceptación real con 409.
          this.loadEligibility();
          this.loadProfile();
        },
      });
  }

  private loadEligibility(): void {
    const customerId = this.session.claims()?.customer_id;
    if (!customerId) {
      return;
    }
    this.payrollAdvancesApi
      .getEligibility({ customer_id: customerId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.profilesApi
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
