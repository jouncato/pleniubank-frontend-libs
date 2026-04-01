import { InjectionToken } from '@angular/core';

/**
 * Opcional: notificación global para errores server (5xx) / red (0).
 * Las apps pueden proveer un handler que muestre toast (p. ej. customer-portal).
 */
export type HttpErrorReportingContext = {
  correlationId?: string;
  httpStatus?: number;
  method?: string;
  url?: string;
};

export type HttpErrorReportingHandler = (message: string, opts?: HttpErrorReportingContext) => void;

export const HTTP_ERROR_REPORTING_HANDLER = new InjectionToken<HttpErrorReportingHandler>(
  'HTTP_ERROR_REPORTING_HANDLER',
);
