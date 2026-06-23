import type { ApiConfig } from '@pleniu/shared-http';

export function startsWithConfiguredBase(url: string, baseUrl?: string): boolean {
  if (!baseUrl) {
    return false;
  }
  const base = baseUrl.replace(/\/$/, '');
  return url === base || url.startsWith(`${base}/`);
}

export function isCoreApiRoute(url: string, apiConfig: ApiConfig | null | undefined): boolean {
  return startsWithConfiguredBase(url, apiConfig?.coreBaseUrl) || url.includes('/api/core/');
}

/**
 * Rutas de Identity que requieren el admin_access_token en lugar del access_token normal:
 * - `/api/v1/admin/` — endpoints de gestión de usuarios admin/staff
 * - `/api/v1/enterprise/` — gestión de empresas
 * - `/api/v1/sub-enterprise/` — gestión de sub-empresas
 * - `/api/v1/economic-sectors` — catálogo de sectores económicos (requiere autenticación admin)
 */
export function isIdentityAdminApiRoute(url: string, apiConfig: ApiConfig | null | undefined): boolean {
  const isIdentityScoped = startsWithConfiguredBase(url, apiConfig?.identityBaseUrl);
  const isIdentityAdminPath =
    url.includes('/api/v1/admin/') ||
    url.includes('/api/v1/enterprise/') ||
    url.includes('/api/v1/sub-enterprise/') ||
    url.includes('/api/v1/economic-sectors');

  if (isIdentityScoped) {
    return isIdentityAdminPath;
  }
  if (isCoreApiRoute(url, apiConfig)) {
    return false;
  }
  return isIdentityAdminPath;
}
