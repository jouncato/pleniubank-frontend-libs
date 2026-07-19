import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { getHttpErrorCategory, mapHttpError } from './api-error';
import { resolveUserFacingApiError } from './resolve-user-facing-api-error';
import { HTTP_ERROR_REPORTING_HANDLER } from './http-error-reporting.token';

/**
 * Notificación opcional para errores de servidor (5xx) y red (0).
 * Debe ir **después** de `tokenRefreshInterceptor` en la cadena para no interferir con 401/refresh.
 */
export const httpErrorReportingInterceptor: HttpInterceptorFn = (req, next) => {
  const report = inject(HTTP_ERROR_REPORTING_HANDLER, { optional: true });

  return next(req).pipe(
    catchError((err: unknown) => {
      if (report && err instanceof HttpErrorResponse) {
        const status = err.status;
        const cat = getHttpErrorCategory(status);
        if (cat === 'server' || cat === 'network') {
          const mapped = mapHttpError(err);
          const msg = resolveUserFacingApiError(mapped);
          report(msg, {
            correlationId: mapped.correlationId,
            httpStatus: err.status,
            method: req.method,
            url: err.url ?? req.url,
          });
        }
      }
      return throwError(() => err);
    }),
  );
};
