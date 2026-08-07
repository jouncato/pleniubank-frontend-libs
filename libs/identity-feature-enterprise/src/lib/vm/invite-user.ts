import { Injectable, signal } from '@angular/core';
import { InviteUserRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';

/** Registro de una invitación enviada (respuesta real de POST /enterprise/invite-user). */
export interface SentInviteRecord {
  invite_id: string;
  email: string;
  role_hint: string;
  expires_at: string;
  sent_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class InviteUserVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly cooldownUntil = signal<number>(0);

  /** Última invitación enviada (panel de confirmación) y registro de la sesión
   *  actual (rieles de evidencia en la UI — máx. 10, la más reciente primero). */
  readonly lastInvite = signal<SentInviteRecord | null>(null);
  readonly sentLog = signal<SentInviteRecord[]>([]);

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
      next: (res) => {
        this.state.set('success');
        // Antes se descartaba la respuesta; ahora alimenta la confirmación y
        // el registro de enviadas (evidencia con claridad de negocio).
        const data = res.data;
        if (data?.invite_id) {
          const record: SentInviteRecord = {
            invite_id: data.invite_id,
            email: payload.email,
            role_hint: payload.role_hint ?? 'operator',
            expires_at: data.expires_at,
            sent_at: new Date().toISOString(),
          };
          this.lastInvite.set(record);
          this.sentLog.update((list) => [record, ...list].slice(0, 10));
        }
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

  /** Vuelve al formulario para enviar otra invitación (conserva el registro). */
  reset(): void {
    this.state.set('idle');
    this.errorMessage.set(null);
  }
}
