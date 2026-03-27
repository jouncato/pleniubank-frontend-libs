import { Injectable, signal } from '@angular/core';
import { FeatureFlagService } from 'shared-auth';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';

@Injectable({
  providedIn: 'root',
})
export class SwitchContextVm {
  readonly message = signal<string | null>(null);

  constructor(
    private readonly flags: FeatureFlagService,
    private readonly api: IdentityEnterpriseApiService,
  ) {}

  trySwitch(): void {
    this.message.set(null);
    if (!this.flags.isEnabled('switchContext')) {
      this.message.set('Esta función no está disponible.');
      return;
    }
    this.api.switchContext({}).subscribe({
      next: () => {
        this.message.set('Contexto actualizado.');
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        if (mapped.status === 501) {
          this.message.set('Función en desarrollo. Pronto podrás cambiar de empresa.');
          return;
        }
        this.message.set(mapped.errors[0]?.message ?? 'No se pudo cambiar el contexto.');
      },
    });
  }
}
