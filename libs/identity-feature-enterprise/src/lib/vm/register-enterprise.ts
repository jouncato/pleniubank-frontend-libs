import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterEnterprisePersonRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';
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

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly onboarding: EnterpriseOnboardingStore,
    private readonly router: Router,
  ) {
    const persisted = this.onboarding.state();
    if (persisted) {
      this.currentStep.set(Math.min(3, Math.max(0, persisted.wizardStep)) as RegisterEnterpriseStep);
    }
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

    let body;
    try {
      body = this.onboarding.toRegisterRequest(principal, admin);
    } catch {
      this.submitting.set(false);
      this.errorMessage.set('Faltan datos del formulario. Completa todos los pasos.');
      return;
    }

    this.api.registerEnterprise(body).subscribe({
      next: (res) => {
        const d = res.data;
        this.onboarding.setRegistrationIds(d.enterprise_id, d.principal_user_id, d.admin_user_id);
        this.submitting.set(false);
        void this.router.navigate(['/onboarding/party/organization/verify-email'], { queryParams: { role: 'principal' } });
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.submitting.set(false);
        if (mapped.status === 409) {
          this.conflictError.set(true);
          this.errorMessage.set('Esta empresa ya está registrada.');
          return;
        }
        if (mapped.status === 422) {
          this.errorMessage.set(mapped.errors[0]?.message ?? 'Revisa los datos ingresados.');
          return;
        }
        this.errorMessage.set('No fue posible registrar la empresa. Intenta de nuevo.');
      },
    });
  }
}

