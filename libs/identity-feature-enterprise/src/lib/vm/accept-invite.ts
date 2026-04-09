import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AcceptInviteRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

@Injectable({
  providedIn: 'root',
})
export class AcceptInviteVm {
  readonly state = signal<'idle' | 'submitting' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly missingToken = signal(false);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly router: Router,
  ) {}

  submit(body: AcceptInviteRequest): void {
    if (this.missingToken()) {
      return;
    }
    if (this.state() === 'submitting') {
      return;
    }
    this.state.set('submitting');
    this.errorMessage.set(null);

    this.api.acceptInvite(body).subscribe({
      next: () => {
        void this.router.navigate(['/onboarding/party/access/login']);
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 404) {
          this.errorMessage.set('Invitación expirada o inválida. Solicita una nueva al administrador.');
          return;
        }
        if (mapped.status === 409) {
          this.errorMessage.set('Ya aceptaste esta invitación.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo aceptar la invitación.');
      },
    });
  }
}

