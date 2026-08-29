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

export interface TenantMoneyProfile {
  readonly tenant: SupportedTenant;
  readonly currency: 'COP' | 'MXN';
  readonly locale: 'es-CO' | 'es-MX';
  readonly fractionDigits: 2;
}

export const TENANT_MONEY_PROFILES: Readonly<Record<SupportedTenant, TenantMoneyProfile>> = {
  CO: { tenant: 'CO', currency: 'COP', locale: 'es-CO', fractionDigits: 2 },
  MX: { tenant: 'MX', currency: 'MXN', locale: 'es-MX', fractionDigits: 2 },
};

export function tenantMoneyProfile(tenant: string | null | undefined): TenantMoneyProfile {
  return TENANT_MONEY_PROFILES[tenant === 'MX' ? 'MX' : DEFAULT_TENANT];
}

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
