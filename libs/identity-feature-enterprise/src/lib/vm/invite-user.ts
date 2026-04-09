import { Injectable, signal } from '@angular/core';
import { InviteUserRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

@Injectable({
  providedIn: 'root',
})
export class InviteUserVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly cooldownUntil = signal<number>(0);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly sessionStore: SessionStore,
  ) {}

  private emailMatchesCurrent(email: string): boolean {
    const mine = this.sessionStore.claims()?.email?.toLowerCase().trim();
    return Boolean(mine && mine === email.toLowerCase().trim());
  }

  submit(payload: InviteUserRequest): void {
    if (this.state() === 'submitting') {
      return;
    }
    this.state.set('idle');
    if (this.emailMatchesCurrent(payload.email)) {
      this.state.set('error');
      this.errorMessage.set('No puedes invitar tu propio correo.');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.api.inviteUser(payload).subscribe({
      next: () => {
        this.state.set('success');
        const until = Date.now() + 3000;
        this.cooldownUntil.set(until);
        setTimeout(() => this.cooldownUntil.set(0), 3000);
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 409) {
          this.errorMessage.set('Este email ya está registrado en la plataforma.');
          return;
        }
        if (mapped.status === 403) {
          this.errorMessage.set('No tienes permiso para invitar usuarios.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo enviar la invitación.');
      },
    });
  }
}
