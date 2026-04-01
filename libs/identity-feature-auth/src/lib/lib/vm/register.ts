import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, isDevMode, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterEnvelope, RegisterRequest, RegisterResponse } from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { SessionStore } from 'shared-auth';
import { ApiHttpError, mapHttpError } from 'shared-http';

const REGISTER_LOG = '[Pleniu auth/register]';

function unwrapRegisterPayload(body: RegisterEnvelope | RegisterResponse): RegisterResponse {
  if (body && typeof body === 'object' && 'data' in body && (body as RegisterEnvelope).data) {
    return (body as RegisterEnvelope).data;
  }
  return body as RegisterResponse;
}

/** Mensaje del sobre Identity/Core; evita el texto genérico de Angular cuando falló el parseo. */
function messageFromApiEnvelope(mapped: ApiHttpError, fallback: string): string {
  const raw = mapped.errors[0]?.message?.trim() ?? '';
  if (!raw || raw.startsWith('Http failure response for')) {
    return fallback;
  }
  return raw;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'>('idle');
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {}

  submit(payload: RegisterRequest): void {
    if (this.state() === 'submitting') {
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    if (isDevMode()) {
      console.debug(REGISTER_LOG, 'POST /api/v1/auth/register (sin contraseña en logs)');
    }

    this.identityApi.register(payload).subscribe({
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
          this.errorMessage.set(
            messageFromApiEnvelope(mappedError, 'Revisa los datos ingresados e intenta nuevamente.'),
          );
        } else if (mappedError.status === 409) {
          this.errorMessage.set(
            messageFromApiEnvelope(
              mappedError,
              'Ya existe un registro con la informacion ingresada.',
            ),
          );
        } else {
          this.errorMessage.set(messageFromApiEnvelope(mappedError, generic));
        }
        this.state.set('error');
      },
    });
  }
}

