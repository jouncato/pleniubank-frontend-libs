import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KybDocumentsRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

@Injectable({
  providedIn: 'root',
})
export class KybSubmitVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  /**
   * Estado real de la empresa en Identity (`pending_kyb | active | rejected`).
   * El backend (`submit_kyb_documents`) ya rechaza el envío si no es
   * `pending_kyb` (ver `service.py:4041`); esto solo evita que la persona
   * llene el formulario y adjunte archivos para nada cuando la empresa ya
   * fue validada (o rechazada) y solo Backoffice puede reabrir el trámite.
   */
  readonly enterpriseStatus = signal<string | null>(null);

  /**
   * `null` mientras carga o si la consulta falla — en ambos casos se deja
   * editable y el backend sigue siendo la autoridad final en el submit. Solo
   * se bloquea cuando confirmamos un estado distinto de `pending_kyb`.
   */
  readonly canEditKyb = computed(() => {
    const status = this.enterpriseStatus();
    return status === null || status === 'pending_kyb';
  });

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly router: Router,
  ) {}

  loadStatus(): void {
    this.api.getEnterpriseMeSummary().subscribe({
      next: (summary) => this.enterpriseStatus.set(summary.enterprise_status),
      error: () => this.enterpriseStatus.set(null),
    });
  }

  submit(payload: KybDocumentsRequest): void {
    if (this.state() === 'submitting') {
      return;
    }
    this.state.set('submitting');
    this.errorMessage.set(null);

    this.api.submitKybDocuments(payload).subscribe({
      next: () => {
        this.state.set('success');
        void this.router.navigateByUrl('/app/dashboard');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 403) {
          this.errorMessage.set('No tienes permiso para enviar documentos.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'Error al enviar documentos.');
      },
    });
  }
}
