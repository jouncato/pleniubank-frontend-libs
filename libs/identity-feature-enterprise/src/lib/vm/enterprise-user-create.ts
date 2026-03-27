import { Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateUserEnterpriseRequest } from 'identity-domain';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

export type EnterpriseUserTargetMode = 'enterprise' | 'subEnterprise';

@Injectable({
  providedIn: 'root',
})
export class EnterpriseUserCreateVm {
  readonly state = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly route: ActivatedRoute,
  ) {}

  parsePermissionsJson(raw: string): Record<string, unknown> | null {
    const t = raw.trim();
    if (!t) {
      return {};
    }
    try {
      const v = JSON.parse(t) as unknown;
      return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  submit(payload: CreateUserEnterpriseRequest): void {
    if (this.state() === 'submitting') {
      return;
    }
    const mode = this.route.snapshot.data['mode'] as EnterpriseUserTargetMode;
    const enterpriseId = this.route.snapshot.paramMap.get('enterpriseId');
    const subId = this.route.snapshot.paramMap.get('subEnterpriseId');

    this.state.set('submitting');
    this.errorMessage.set(null);

    const req$ =
      mode === 'subEnterprise' && subId
        ? this.api.createSubEnterpriseUser(subId, payload)
        : enterpriseId
          ? this.api.createEnterpriseUser(enterpriseId, payload)
          : null;

    if (!req$) {
      this.state.set('error');
      this.errorMessage.set('Ruta inválida.');
      return;
    }

    req$.subscribe({
      next: () => {
        this.state.set('success');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set('error');
        if (mapped.status === 403) {
          this.errorMessage.set('No tienes permiso para crear usuarios en esta empresa.');
          return;
        }
        if (mapped.status === 404) {
          this.errorMessage.set('Empresa no encontrada.');
          return;
        }
        if (mapped.status === 409) {
          this.errorMessage.set('El email ya está registrado.');
          return;
        }
        this.errorMessage.set(mapped.errors[0]?.message ?? 'Error al crear el usuario.');
      },
    });
  }
}
