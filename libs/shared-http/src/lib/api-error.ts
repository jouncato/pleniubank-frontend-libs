import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorItem } from './api-envelope';

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

export function mapHttpError(error: unknown): ApiHttpError {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (!(error instanceof HttpErrorResponse)) {
    return new ApiHttpError(0, [{ code: 'UNKNOWN', message: 'Error inesperado' }]);
  }

  if (error.status === 501) {
    const arr = Array.isArray(error.error?.errors) ? (error.error.errors as ApiErrorItem[]) : [];
    const apiErrors =
      arr.length > 0 ? arr : [{ code: 'NOT_IMPLEMENTED', message: error.message || 'Not implemented' }];
    return new ApiHttpError(501, apiErrors, error.error?.meta?.correlation_id);
  }

  const apiErrors = Array.isArray(error.error?.errors)
    ? (error.error.errors as ApiErrorItem[])
    : [{ code: 'HTTP_ERROR', message: error.message }];

  return new ApiHttpError(error.status, apiErrors, error.error?.meta?.correlation_id);
}
