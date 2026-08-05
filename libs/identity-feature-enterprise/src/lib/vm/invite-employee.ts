import { Injectable, signal } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { InviteEmployeeRequest, SubEnterpriseSummaryDto } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

const MIN_QUERY_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 20;

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
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchState.set('idle');
  }
}
