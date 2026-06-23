import type { ApiHttpError } from './api-error';

/**
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
