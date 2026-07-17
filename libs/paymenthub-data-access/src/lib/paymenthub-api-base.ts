import type { ApiConfig } from '@pleniu/shared-http';

/**
 * Base URL para el proxy PaymentHub servido por Core
 * (`{coreBaseUrl}/api/v1/paymenthub`, con soporte de `corePublicApiPrefix`).
 *
 * Réplica intencional de la lógica de `corePublicV1Base`
 * (`core-data-access/src/lib/core-api-base.ts`): no existe en este workspace
 * ningún precedente de una lib `*-data-access` importando otra lib
 * `*-data-access` de su mismo nivel, así que se evita introducir esa
 * dependencia cruzada por una función de ~4 líneas.
 */
export function paymenthubV1Base(api: ApiConfig): string {
  const root = api.coreBaseUrl.replace(/\/$/, '');
  const prefix =
    api.corePublicApiPrefix !== undefined && api.corePublicApiPrefix !== ''
      ? api.corePublicApiPrefix
      : '/api/v1';
  const px = prefix.replace(/\/$/, '');
  const p = px.startsWith('/') ? px : `/${px}`;
  return `${root}${p}/paymenthub`;
}
