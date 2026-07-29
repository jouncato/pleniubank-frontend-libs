import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AcceptEmployeeInvitationRequest,
  ValidateEmployeeInvitationResponse,
} from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

@Injectable()
export class AcceptEmployeeInvitationVm {
  readonly state = signal<'idle' | 'loading' | 'accepting' | 'success' | 'error'>('idle');
  readonly validation = signal<ValidateEmployeeInvitationResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly nextStep = signal<'login' | 'register' | null>(null);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly router: Router,
  ) {}

  load(token: string): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    this.api.validateEmployeeInvitation(token).subscribe({
      next: (response) => {
        this.validation.set(response ?? null);
        if (!response?.is_valid || response.status !== 'pending') {
          this.state.set('error');
          this.errorMessage.set('Esta invitación ya fue usada, expiró o no es válida.');
          return;
        }
        this.state.set('idle');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo validar la invitación.');
      },
    });
  }

  accept(token: string): void {
    const validation = this.validation();
    if (!validation) {
      return;
    }

    this.state.set('accepting');
    this.errorMessage.set(null);

    const payload: AcceptEmployeeInvitationRequest = {
      token,
      email: validation.email,
    };

    this.api.acceptEmployeeInvitation(token, payload).subscribe({
      next: (data) => {
        if (!data) {
          this.state.set('error');
          this.errorMessage.set('Respuesta inesperada del servidor.');
          return;
        }
        this.nextStep.set(data.next_step);
        this.state.set('success');

        const queryParams = {
          invite_token: data.token,
          email: data.email,
          sub_enterprise_id: data.sub_enterprise_id,
          enterprise_id: data.enterprise_id,
        };

        if (data.next_step === 'register') {
          // Navigate directly to the person registration form (not the generic
          // `/auth/register` -> party-type-selector alias): the selector's
          // "Soy una persona" link is a static routerLink with no query params,
          // so routing through it would silently drop invite_token/email and
          // defeat the pre-filled + locked email field in AuthRegisterForm.
          void this.router.navigate(['/customer/party/customer/register'], { queryParams });
        } else {
          void this.router.navigate(['/auth/login'], { queryParams });
        }
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 409) {
          this.errorMessage.set('Esta invitación ya fue aceptada o expiró.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo aceptar la invitación.');
      },
    });
  }
}
