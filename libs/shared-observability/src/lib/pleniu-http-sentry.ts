import * as Sentry from '@sentry/browser';

export type PleniuHttpFailureContext = {
  correlationId?: string;
  httpStatus?: number;
  method?: string;
  url?: string;
};

/**
 * Evento para 5xx / red ya manejado por UI vía `HTTP_ERROR_REPORTING_HANDLER`.
 * Añade breadcrumb HTTP y un mensaje de nivel warning en Sentry (si el cliente está inicializado).
 */
export function capturePleniuHttpFailure(message: string, ctx: PleniuHttpFailureContext): void {
  if (!Sentry.getClient()) {
    return;
  }

  Sentry.addBreadcrumb({
    category: 'http',
    type: 'http',
    level: 'error',
    data: {
      method: ctx.method,
      url: ctx.url,
      status_code: ctx.httpStatus,
    },
    message:
      ctx.url != null && ctx.method != null
        ? `${ctx.method} ${ctx.url} → ${ctx.httpStatus ?? '?'}`
        : message,
  });

  Sentry.captureMessage(`HTTP failure: ${message}`, {
    level: 'warning',
    tags: {
      ...(ctx.correlationId ? { correlation_id: ctx.correlationId } : {}),
      ...(ctx.httpStatus != null ? { http_status: String(ctx.httpStatus) } : {}),
    },
  });
}
