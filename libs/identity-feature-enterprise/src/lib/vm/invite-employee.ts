import { Injectable, signal } from '@angular/core';
import { InviteEmployeeRequest, SubEnterpriseSummaryDto } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

@Injectable({
  providedIn: 'root',
})
export class InviteEmployeeVm {
  readonly state = signal<'idle' | 'loading' | 'submitting' | 'success' | 'error'>('idle');
  readonly subEnterprises = signal<SubEnterpriseSummaryDto[]>([]);
  readonly selectedSubEnterprise = signal<SubEnterpriseSummaryDto | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly cooldownUntil = signal<number>(0);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly sessionStore: SessionStore,
  ) {}

  loadSubEnterprises(): void {
    const enterpriseId = this.sessionStore.claims()?.enterprise_id;
    if (!enterpriseId) {
      this.state.set('error');
      this.errorMessage.set('No se pudo determinar la empresa actual.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set(null);

    this.api.listSubEnterprises(enterpriseId).subscribe({
      next: (envelope) => {
        this.subEnterprises.set(envelope.data ?? []);
        this.state.set('idle');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudieron cargar las unidades de negocio.');
      },
    });
  }

  selectSubEnterprise(sub: SubEnterpriseSummaryDto | null): void {
    this.selectedSubEnterprise.set(sub);
  }

  submit(payload: InviteEmployeeRequest): void {
    if (this.state() === 'submitting') {
      return;
    }

    const selected = this.selectedSubEnterprise();
    if (!selected) {
      this.state.set('error');
      this.errorMessage.set('Selecciona una unidad de negocio.');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api
      .inviteEmployee({
        email: payload.email,
        sub_enterprise_id: selected.sub_enterprise_id,
      })
      .subscribe({
        next: () => {
          this.state.set('success');
          this.successMessage.set(`Invitación enviada a ${payload.email}.`);
          const until = Date.now() + 3000;
          this.cooldownUntil.set(until);
          setTimeout(() => this.cooldownUntil.set(0), 3000);
        },
        error: (err: unknown) => {
          const mapped = mapHttpError(err);
          this.state.set('error');
          if (mapped.status === 409) {
            this.errorMessage.set('Ya existe una invitación activa para este correo.');
            return;
          }
          if (mapped.status === 403) {
            this.errorMessage.set('No tienes permiso para invitar empleados.');
            return;
          }
          this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo enviar la invitación.');
        },
      });
  }

  reset(): void {
    this.state.set('idle');
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.selectedSubEnterprise.set(null);
  }
}
