import type { ApiConfig } from '@pleniu/shared-http';

function joinCorePrefix(baseUrl: string, prefix: string | undefined, fallback: string): string {
  const root = baseUrl.replace(/\/$/, '');
  const px = (prefix !== undefined && prefix !== '' ? prefix : fallback).replace(/\/$/, '');
  const p = px.startsWith('/') ? px : `/${px}`;
  return `${root}${p}`;
}

/** Base URL para endpoints retail/B2B (accounts, loans, …). */
export function corePublicV1Base(api: ApiConfig): string {
  return joinCorePrefix(api.coreBaseUrl, api.corePublicApiPrefix, '/api/v1');
}

/** Base URL para rutas de plataforma (platform/*, internal-accounts, audit). */
export function coreAdminV1Base(api: ApiConfig): string {
  return joinCorePrefix(api.coreBaseUrl, api.coreAdminApiPrefix, '/api/v1');
}
