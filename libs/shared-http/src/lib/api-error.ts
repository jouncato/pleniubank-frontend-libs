import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorItem } from './api-envelope';

/** Mensaje legible cuando el backend no devuelve envelope `errors[]` (Angular usa `error.message` técnica). */
function fallbackHttpErrorMessage(error: HttpErrorResponse): string {
  const extracted = extractNonEnvelopeMessage(error);
  if (extracted) {
    return extracted;
  }
  if (error.status === 0) {
    return 'No pudimos conectar con el servicio. Comprueba tu conexión o inténtalo más tarde.';
  }
  if (error.status === 401) {
    return 'Tu sesión expiró o no es válida. Vuelve a iniciar sesión.';
  }
  if (error.status === 403) {
    return 'No tienes permiso para esta acción.';
  }
  if (error.status === 404) {
    return 'No encontramos el recurso solicitado.';
  }
  if (error.status === 408 || error.status === 504) {
    return 'La petición tardó demasiado. Inténtalo de nuevo.';
  }
  if (error.status === 429) {
    return 'Demasiadas peticiones. Espera unos minutos e inténtalo de nuevo.';
  }
  if (error.status >= 500) {
    return 'El servicio no está disponible en este momento. Inténtalo más tarde.';
  }
  if (error.status >= 400) {
    return 'No pudimos completar la operación. Revisa los datos e inténtalo de nuevo.';
  }
  return 'No pudimos completar la operación. Inténtalo de nuevo.';
}

function extractNonEnvelopeMessage(error: HttpErrorResponse): string | null {
  const b = error.error;
  if (typeof b === 'string') {
    const t = b.trim();
    if (!t || t.startsWith('<') || isTechnicalHttpMessage(t)) {
      return null;
    }
    return truncateMessage(t);
  }
  if (!b || typeof b !== 'object' || Array.isArray(b)) {
    return null;
  }
  const obj = b as Record<string, unknown>;
  if (Array.isArray(obj['errors'])) {
    return null;
  }
  const parts: string[] = [];
  if (typeof obj['message'] === 'string') {
    parts.push((obj['message'] as string).trim());
  }
  if (typeof obj['detail'] === 'string') {
    parts.push((obj['detail'] as string).trim());
  } else if (Array.isArray(obj['detail']) && (obj['detail'] as unknown[]).length > 0) {
    const first = (obj['detail'] as unknown[])[0];
    if (first && typeof first === 'object' && first !== null && 'msg' in first) {
      parts.push(String((first as { msg: string }).msg).trim());
    }
  }
  const joined = parts.filter(Boolean).join(' ');
  if (!joined || isTechnicalHttpMessage(joined)) {
    return null;
  }
  return truncateMessage(joined);
}

function isTechnicalHttpMessage(s: string): boolean {
  return /^Http failure response/i.test(s) || /\bUnknown Error\b/i.test(s) || /\b0 Unknown Error\b/i.test(s);
}

function truncateMessage(s: string, max = 280): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max - 1)}…`;
}

/** Categoría para UX / toasts (X-01 incremental). */
export type ApiErrorCategory = 'client' | 'server' | 'network' | 'auth';

/** 501 se trata como “client” para no duplicar toast de fallo de servidor. */
export function getHttpErrorCategory(status: number): ApiErrorCategory {
  if (status === 0) {
    return 'network';
  }
  if (status === 401 || status === 403) {
    return 'auth';
  }
  if (status >= 500) {
    if (status === 501) {
      return 'client';
    }
    return 'server';
  }
  return 'client';
}

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: ApiErrorItem[],
    public readonly correlationId?: string,
  ) {
    super(errors[0]?.message ?? 'Unexpected API error');
  }
}

function isHttpErrorLike(error: unknown): error is HttpErrorResponse {
  if (error instanceof HttpErrorResponse) {
    return true;
  }
  if (error !== null && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return typeof e['status'] === 'number' && 'error' in e && ('url' in e || 'headers' in e);
  }
  return false;
}

export function mapHttpError(error: unknown): ApiHttpError {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (!isHttpErrorLike(error)) {
    return new ApiHttpError(0, [{ code: 'UNKNOWN', message: 'Error inesperado' }]);
  }

  if (error.status === 501) {
    const arr = Array.isArray(error.error?.errors) ? (error.error.errors as ApiErrorItem[]) : [];
    const apiErrors =
      arr.length > 0
        ? arr
        : [{ code: 'NOT_IMPLEMENTED', message: 'Esta funcionalidad aún no está disponible.' }];
    return new ApiHttpError(501, apiErrors, error.error?.meta?.correlation_id);
  }

  const rawErrors = Array.isArray(error.error?.errors)
    ? (error.error.errors as ApiErrorItem[])
    : null;
  const apiErrors =
    rawErrors && rawErrors.length > 0
      ? rawErrors
      : [{ code: 'HTTP_ERROR', message: fallbackHttpErrorMessage(error) }];

  return new ApiHttpError(error.status, apiErrors, error.error?.meta?.correlation_id);
}
