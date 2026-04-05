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
        const headerId = event.headers.get('X-Correlation-ID')?.trim() || null;
        const bodyId = extractCorrelationIdFromBody(event.body);
        const effective = headerId || bodyId;
        if (effective) {
          ctx.setLastResponseCorrelationId(effective);
        }
        const sent = reqOut.headers.get('X-Correlation-ID')?.trim();
        if (!sent || !isDevMode()) {
          return;
        }
        if (headerId && headerId !== sent) {
          console.warn('[Correlation] X-Correlation-ID de respuesta distinto al enviado', {
            sent,
            responseHeader: headerId,
            meta: bodyId,
          });
        } else if (!headerId && bodyId && bodyId !== sent) {
          console.warn('[Correlation] meta.correlation_id distinto al X-Correlation-ID enviado (sin cabecera de eco)', {
            sent,
            meta: bodyId,
          });
        } else if (headerId === sent && bodyId && bodyId !== sent) {
          console.warn('[Correlation] meta.correlation_id no coincide con X-Correlation-ID de respuesta', {
            sent,
            responseHeader: headerId,
            meta: bodyId,
          });
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
