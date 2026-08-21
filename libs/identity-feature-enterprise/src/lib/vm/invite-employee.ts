import { Injectable, signal } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { EmployeeInvitationItem, InviteEmployeeRequest, SubEnterpriseSummaryDto } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

const MIN_QUERY_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 20;

/** Registro de una invitación emitida en esta sesión (respuesta real de la API). */
export interface SentEmployeeInviteRecord {
  invite_id: string;
  email: string;
  unit_name: string;
  unit_code: string;
  expires_at: string;
  sent_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class InviteEmployeeVm {
  readonly state = signal<'idle' | 'loading' | 'submitting' | 'success' | 'error'>('idle');
  readonly selectedSubEnterprise = signal<SubEnterpriseSummaryDto | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly cooldownUntil = signal<number>(0);

  /**
   * Búsqueda de unidad de negocio con backend `search`+`limit` (una empresa
   * puede tener miles de unidades: nunca se carga el listado completo, solo
   * los resultados que coinciden con lo que el usuario escribe).
   */
  readonly searchQuery = signal('');
  readonly searchResults = signal<SubEnterpriseSummaryDto[]>([]);
  readonly searchState = signal<'idle' | 'searching' | 'error'>('idle');

  /** Última invitación emitida (panel de confirmación) y registro de la sesión
   *  actual (la más reciente primero, máx. 10). Antes la respuesta se descartaba. */
  readonly lastInvite = signal<SentEmployeeInviteRecord | null>(null);
  readonly sentLog = signal<SentEmployeeInviteRecord[]>([]);

  /** Invitaciones pendientes de la empresa (GET real:
   *  /enterprise/employee-invitations?status=pending) con revocación. */
  readonly pendingInvitations = signal<EmployeeInvitationItem[]>([]);
  readonly pendingState = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  readonly revokingInviteId = signal<string | null>(null);

  private readonly query$ = new Subject<string>();

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly sessionStore: SessionStore,
  ) {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();
          if (trimmed.length < MIN_QUERY_LENGTH) {
            this.searchResults.set([]);
            this.searchState.set('idle');
            return EMPTY;
          }
          const enterpriseId = this.sessionStore.claims()?.enterprise_id;
          if (!enterpriseId) {
            this.searchState.set('error');
            return EMPTY;
          }
          this.searchState.set('searching');
          return this.api.listSubEnterprises(enterpriseId, { search: trimmed, limit: SEARCH_RESULT_LIMIT }).pipe(
            catchError(() => {
              this.searchState.set('error');
              this.searchResults.set([]);
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((envelope) => {
        this.searchResults.set(envelope.data ?? []);
        this.searchState.set('idle');
      });
  }

  onQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.query$.next(query);
  }

  /** Resuelve una única unidad por id (entrada preseleccionada desde el detalle de la unidad). */
  resolvePreselected(subEnterpriseId: string): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    this.api.getSubEnterprise(subEnterpriseId).subscribe({
      next: (envelope) => {
        this.selectedSubEnterprise.set(envelope.data ?? null);
        this.state.set('idle');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo cargar la unidad de negocio.');
      },
    });
  }

  selectSubEnterprise(sub: SubEnterpriseSummaryDto | null): void {
    this.selectedSubEnterprise.set(sub);
    this.searchResults.set([]);
    this.searchQuery.set('');
    this.searchState.set('idle');
  }

  clearSelection(): void {
    this.selectSubEnterprise(null);
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
        next: (res) => {
          this.state.set('success');
          this.successMessage.set(`Invitación enviada a ${payload.email}.`);
          const data = res.data;
          if (data?.invite_id) {
            const record: SentEmployeeInviteRecord = {
              invite_id: data.invite_id,
              email: data.email ?? payload.email,
              unit_name: selected.business_name,
              unit_code: selected.company_code,
              expires_at: data.expires_at,
              sent_at: new Date().toISOString(),
            };
            this.lastInvite.set(record);
            this.sentLog.update((list) => [record, ...list].slice(0, 10));
          }
          // La recién creada ya es una pendiente: refrescar el registro real.
          this.loadPendingInvitations();
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
          if (mapped.errors[0]?.message === 'Invitations are only available for active enterprises') {
            this.errorMessage.set(
              'Tu empresa aún no completó la verificación (KYB). Termina la verificación para poder invitar colaboradores.',
            );
            return;
          }
          this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo enviar la invitación.');
        },
      });
  }

  /** Invitaciones pendientes de la empresa (fuente real: API de invitaciones). */
  loadPendingInvitations(): void {
    this.pendingState.set('loading');
    this.api.listEmployeeInvitations({ status: 'pending' }).subscribe({
      next: (env) => {
        this.pendingInvitations.set(env.data ?? []);
        this.pendingState.set('loaded');
      },
      error: () => {
        this.pendingInvitations.set([]);
        this.pendingState.set('error');
      },
    });
  }

  /** Revoca una invitación pendiente (DELETE real). Fail-safe: recarga la lista. */
  revokePendingInvitation(inviteId: string): void {
    if (this.revokingInviteId()) {
      return;
    }
    this.revokingInviteId.set(inviteId);
    this.api.revokeEmployeeInvitation(inviteId).subscribe({
      next: () => {
        this.revokingInviteId.set(null);
        this.pendingInvitations.update((list) => list.filter((i) => i.invite_id !== inviteId));
      },
      error: (err: unknown) => {
        this.revokingInviteId.set(null);
        const mapped = mapHttpError(err);
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo revocar la invitación.');
      },
    });
  }

  reset(): void {
    this.state.set('idle');
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.selectedSubEnterprise.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchState.set('idle');
  }

  /** "Invitar a otro" desde la confirmación: limpia el estado del formulario
   *  pero CONSERVA la unidad seleccionada (flujo típico: varias altas a la
   *  misma unidad seguida). */
  resetKeepUnit(): void {
    this.state.set('idle');
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
