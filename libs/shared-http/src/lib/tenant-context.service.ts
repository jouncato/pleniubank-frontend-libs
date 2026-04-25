import { Injectable, isDevMode, signal } from '@angular/core';
import {
  DEFAULT_TENANT,
  SupportedTenant,
  isSupportedTenant,
} from './tenant-country.types';

/**
 * Estado global de selección de tenant (país) para el usuario actual.
 * El interceptor `tenantContextInterceptor` lee este signal para inyectar
 * el header `X-Tenant-Country` en los requests salientes (HU-RE-049).
 *
 * Siempre mantiene un valor válido (nunca null). Default: `CO`.
 */
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly _selected = signal<SupportedTenant>(DEFAULT_TENANT);

  /** Signal readonly del tenant actualmente seleccionado. */
  readonly selectedCountry = this._selected.asReadonly();

  /**
   * Actualiza el tenant seleccionado.
   * Si `code` no es un tenant soportado, se hace fallback a `DEFAULT_TENANT`
   * y se emite un warn en modo dev.
   */
  setCountry(code: string | null): void {
    if (!isSupportedTenant(code)) {
      if (isDevMode()) {
        // eslint-disable-next-line no-console
        console.warn(
          `[TenantContext] Tenant '${code}' no soportado. Fallback a '${DEFAULT_TENANT}'.`,
        );
      }
      this._selected.set(DEFAULT_TENANT);
      return;
    }
    this._selected.set(code);
  }
}
