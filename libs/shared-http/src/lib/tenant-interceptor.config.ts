import { InjectionToken } from '@angular/core';

/**
 * Feature flag local del `tenantContextInterceptor` (HU-RE-049).
 *
 * `true`  → el interceptor inyecta `X-Tenant-Country` en los requests.
 * `false` → el interceptor es un no-op (comportamiento legacy).
 *
 * Default: `false` (opt-in). Cada app debe proveerlo explícitamente en su
 * `providers: [...]` para activar el comportamiento:
 *
 * ```ts
 * providers: [
 *   { provide: TENANT_HEADER_ENABLED, useValue: true },
 *   provideHttpClient(withInterceptors([tenantContextInterceptor])),
 * ]
 * ```
 *
 * Nota: se define un flag propio aquí (en lugar de reutilizar el
 * `FeatureFlagService` de `shared-auth`) para evitar una dependencia
 * cíclica `shared-http → shared-auth` (shared-auth ya depende de shared-http).
 */
export const TENANT_HEADER_ENABLED = new InjectionToken<boolean>(
  'TENANT_HEADER_ENABLED',
  {
    providedIn: 'root',
    factory: () => false,
  },
);
