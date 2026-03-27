import { HttpErrorResponse, HttpEvent, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';

import { CorrelationContextService } from './correlation-context.service';
import { createCorrelationId } from './correlation-id.util';

function extractCorrelationIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const meta = (body as { meta?: { correlation_id?: string } }).meta;
  return meta?.correlation_id ?? null;
}

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const ctx = inject(CorrelationContextService);
  const existing = req.headers.get('X-Correlation-ID')?.trim();
  const reqOut = existing
    ? req
    : req.clone({
        setHeaders: {
          'X-Correlation-ID': createCorrelationId(),
        },
      });

  return next(reqOut).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event.type === HttpEventType.Response) {
        const id = extractCorrelationIdFromBody(event.body);
        if (id) {
          ctx.setLastResponseCorrelationId(id);
          const sent = reqOut.headers.get('X-Correlation-ID');
          if (sent && id !== sent && isDevMode()) {
            console.warn('[Correlation] X-Correlation-ID distinto de meta.correlation_id', {
              sent,
              response: id,
            });
          }
        }
      }
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const id = extractCorrelationIdFromBody(err.error);
        if (id) {
          ctx.setLastResponseCorrelationId(id);
        }
      }
      return throwError(() => err);
    }),
  );
};
