import { Injectable, signal } from '@angular/core';
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

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly router: Router,
  ) {}

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
