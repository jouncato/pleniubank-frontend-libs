import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, isDevMode, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterEnvelope, RegisterRequest, RegisterResponse } from 'identity-domain';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError, resolveUserFacingApiError } from '@pleniu/shared-http';

const REGISTER_LOG = '[Pleniu auth/register]';

function unwrapRegisterPayload(body: RegisterEnvelope | RegisterResponse): RegisterResponse {
  if (body && typeof body === 'object' && 'data' in body && (body as RegisterEnvelope).data) {
    return (body as RegisterEnvelope).data;
  }
  return body as RegisterResponse;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly inviteToken = signal<string | null>(null);
  readonly inviteEmail = signal<string | null>(null);
  readonly inviteSubEnterpriseId = signal<string | null>(null);
  readonly inviteEnterpriseId = signal<string | null>(null);

  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  loadQueryParams(params: Record<string, string | undefined>): void {
    this.inviteToken.set(params['invite_token'] ?? null);
    this.inviteEmail.set(params['email'] ?? null);
    this.inviteSubEnterpriseId.set(params['sub_enterprise_id'] ?? null);
    this.inviteEnterpriseId.set(params['enterprise_id'] ?? null);
  }

  submit(payload: RegisterRequest): void {
    if (this.state() === 'submitting') {
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    if (isDevMode()) {
      console.debug(REGISTER_LOG, 'POST /api/v1/auth/register (sin contraseña en logs)');
    }

    const request: RegisterRequest = {
      ...payload,
      employee_invitation_token: this.inviteToken(),
    };

    this.identityApi.register(request).subscribe({
      next: (response) => {
        const data = unwrapRegisterPayload(response);
        const registrationId = data.registration_id;
        if (!registrationId) {
          console.error(REGISTER_LOG, 'Respuesta sin registration_id', {
            keys: data && typeof data === 'object' ? Object.keys(data) : [],
          });
          this.errorMessage.set('No fue posible completar el registro. Intenta nuevamente.');
          this.state.set('error');
          return;
        }
        if (isDevMode()) {
          console.debug(REGISTER_LOG, '201 OK', { registration_id: registrationId });
        }
        this.sessionStore.setRegistrationId(registrationId);
        this.state.set('success');
        void this.router.navigate(['/onboarding/party/customer/verify-contact'], {
          state: { registrationId },
        });
      },
      error: (error: unknown) => {
        const mappedError = mapHttpError(error);
        const detail: Record<string, unknown> = {
          status: mappedError.status,
          correlationId: mappedError.correlationId ?? null,
          apiErrors: mappedError.errors,
        };
        if (error instanceof HttpErrorResponse) {
          detail['requestUrl'] = error.url;
          detail['statusText'] = error.statusText;
          detail['responseBody'] = error.error;
        }
        console.warn(REGISTER_LOG, 'Error en registro', detail);

        if (mappedError.status === 429) {
          this.errorMessage.set('Demasiados intentos. Espera un minuto e intenta nuevamente.');
          this.state.set('rate_limited');
          return;
        }

        const generic = 'No fue posible completar el registro. Intenta nuevamente.';
        if (mappedError.status === 422) {
          const validationFb = 'Revisa los datos ingresados e intenta nuevamente.';
          this.errorMessage.set(
            resolveUserFacingApiError(mappedError, {
              fallback: validationFb,
              overrides: { VALIDATION_ERROR: validationFb },
            }),
          );
        } else if (mappedError.status === 409) {
          const raw = (mappedError.errors[0]?.message ?? '').toLowerCase();
          let conflictMsg: string;
          if (raw.includes('document')) {
            conflictMsg = 'Ya existe una cuenta con este número de documento.';
          } else if (raw.includes('email')) {
            conflictMsg = 'Ya existe una cuenta con este correo electrónico.';
          } else {
            conflictMsg = 'Ya existe un registro con la información ingresada.';
          }
          this.errorMessage.set(conflictMsg);
        } else {
          this.errorMessage.set(resolveUserFacingApiError(mappedError, { fallback: generic }));
        }
        this.state.set('error');
      },
    });
  }
}
