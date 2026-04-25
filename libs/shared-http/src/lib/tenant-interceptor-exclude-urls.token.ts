import { InjectionToken } from '@angular/core';

/**
 * Lista de fragmentos de URL que el `tenantContextInterceptor` debe excluir
 * de la inyección automática del header `X-Tenant-Country` (HU-RE-049).
 *
 * El match es por substring: si el `req.url` contiene alguno de estos
 * fragmentos, no se inyecta el header.
 *
 * Default (si no se provee en la app): endpoints públicos de auth y health.
 */
export const TENANT_INTERCEPTOR_EXCLUDE_URLS =
  new InjectionToken<readonly string[]>('TENANT_INTERCEPTOR_EXCLUDE_URLS', {
    providedIn: 'root',
    factory: () => ['/auth/', '/health'] as const,
  });
