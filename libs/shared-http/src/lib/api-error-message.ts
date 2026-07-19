import type { ApiHttpError } from './api-error';

/**
 * @deprecated Usa `resolveUserFacingApiError` (`./resolve-user-facing-api-error`) en su
 * lugar. Confía en el mensaje crudo del backend, lo que puede filtrar texto técnico o en
 * inglés al usuario final; la API canónica solo devuelve el catálogo curado o el
 * `fallback`/override de contexto. Se mantiene por compatibilidad temporal — no crear
 * nuevos usos.
 *
 * Extrae el primer mensaje legible del sobre API.
 * Filtra mensajes técnicos de Angular ("Http failure response for …") que nunca
 * deben mostrarse al usuario. Si no hay mensaje útil, devuelve `fallback`.
 */
export function resolveApiErrorMessage(mapped: ApiHttpError, fallback: string): string {
  const raw = mapped.errors[0]?.message?.trim() ?? '';
  if (!raw || raw.startsWith('Http failure response for')) {
    return fallback;
  }
  return raw;
}
