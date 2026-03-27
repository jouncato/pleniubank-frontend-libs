import { Injectable } from '@angular/core';
import { SessionStore } from 'shared-auth';

@Injectable({
  providedIn: 'root',
})
export class SecuritySettingsVm {
  constructor(private readonly sessionStore: SessionStore) {}

  /** I-09: solo mostrar bloque MFA si validate incluyó el flag (no inventar datos). */
  get mfaSectionVisible(): boolean {
    return typeof this.sessionStore.claims()?.two_factor_enabled === 'boolean';
  }

  get mfaEnabled(): boolean {
    return Boolean(this.sessionStore.claims()?.two_factor_enabled);
  }
}
