/**
 * Tenants soportados por la plataforma (ADR-016 / LB-ST-219).
 *
 * `CO` y `MX` habilitados. Para habilitar nuevos países (PE, ...), añádelos
 * a `SUPPORTED_TENANTS` — no se requiere refactor en `TenantContextService`
 * ni en el interceptor.
 */
export const SUPPORTED_TENANTS = ['CO', 'MX'] as const;

export type SupportedTenant = (typeof SUPPORTED_TENANTS)[number];

export const DEFAULT_TENANT: SupportedTenant = 'CO';

/**
 * Type-guard: valida si un string arbitrario corresponde a un tenant soportado.
 */
export function isSupportedTenant(
  code: string | null | undefined,
): code is SupportedTenant {
  if (!code) {
    return false;
  }
  return (SUPPORTED_TENANTS as readonly string[]).includes(code);
}
