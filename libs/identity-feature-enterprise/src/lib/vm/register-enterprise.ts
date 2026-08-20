import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterEnterprisePersonRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError, resolveUserFacingApiError } from '@pleniu/shared-http';
import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';

export type RegisterEnterpriseStep = 0 | 1 | 2 | 3;

@Injectable({
  providedIn: 'root',
})
export class RegisterEnterpriseVm {
  readonly currentStep = signal<RegisterEnterpriseStep>(0);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly conflictError = signal(false);
  /** Tras POST exitoso: pantalla de éxito antes de ir a verificación por correo. */
  readonly registrationSucceeded = signal(false);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly onboarding: EnterpriseOnboardingStore,
    private readonly router: Router,
  ) {
    const persisted = this.onboarding.state();
    if (persisted) {
      this.currentStep.set(Math.min(3, Math.max(0, persisted.wizardStep)) as RegisterEnterpriseStep);
    }
    // Reset stale user IDs from previous registration attempts to avoid
    // sending incorrect user_id to the verification endpoint.
    this.onboarding.resetUserIds();
  }

  setStep(step: RegisterEnterpriseStep): void {
    this.currentStep.set(step);
    this.onboarding.patch({ wizardStep: step });
  }

  next(): void {
    const n = this.currentStep();
    if (n < 3) {
      this.setStep((n + 1) as RegisterEnterpriseStep);
    }
  }

  prev(): void {
    const n = this.currentStep();
    if (n > 0) {
      this.setStep((n - 1) as RegisterEnterpriseStep);
    }
  }

  submit(principal: RegisterEnterprisePersonRequest, admin: RegisterEnterprisePersonRequest): void {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.conflictError.set(false);

    // Store passwords in memory for the request
    this.onboarding.setPrincipalPassword(principal.password);
    this.onboarding.setAdminPassword(admin.password);

    let body;
    try {
      body = this.onboarding.toRegisterRequest();
    } catch (err) {
      this.submitting.set(false);
      const errorMsg = err instanceof Error ? err.message : 'Faltan datos del formulario. Completa todos los pasos.';
      this.errorMessage.set(errorMsg);
      return;
    }

    this.api.registerEnterprise(body).subscribe({
      next: (res) => {
        const d = res.data;
        if (!d?.enterprise_id || !d.principal_user_id || !d.admin_user_id) {
          this.submitting.set(false);
          this.errorMessage.set('Respuesta inválida del servidor. Intenta de nuevo o contacta soporte.');
          return;
        }
        this.onboarding.setRegistrationIds(
          String(d.enterprise_id),
          String(d.principal_user_id),
          String(d.admin_user_id),
        );
        this.submitting.set(false);
        this.registrationSucceeded.set(true);
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.submitting.set(false);
        if (mapped.status === 409) {
          this.conflictError.set(true);
          const raw = (mapped.errors[0]?.message ?? '').toLowerCase();
          console.error('[RegisterEnterpriseVm] 409 Conflict error:', mapped.errors);
          if (raw.includes('enterprise document')) {
            this.errorMessage.set(
              'El NIT/documento de la empresa ya está registrado. Usa otro número de documento.',
            );
          } else if (raw.includes('email')) {
            this.errorMessage.set(
              'El correo del representante o del administrador ya está registrado. Usa otros correos o inicia sesión.',
            );
          } else {
            this.errorMessage.set(
              'Los datos coinciden con un registro existente. Revisa correos y NIT, o continúa la verificación si ya registraste la empresa.',
            );
          }
          return;
        }
        if (mapped.status === 422) {
          this.errorMessage.set(
            resolveUserFacingApiError(mapped, { fallback: 'Revisa los datos ingresados.' }),
          );
          return;
        }
        this.errorMessage.set('No fue posible registrar la empresa. Intenta de nuevo.');
      },
    });
  }

  /** Navega al flujo de OTP del representante legal (primera verificación). */
  continueToEmailVerification(): void {
    void this.router.navigate(['/onboarding/party/organization/verify-email'], {
      queryParams: { role: 'principal' },
    });
  }
}

