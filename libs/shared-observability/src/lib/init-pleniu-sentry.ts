import * as Sentry from '@sentry/browser';
import type { Scope } from '@sentry/core';

import type { PleniuSentryInitConfig } from './pleniu-sentry.types';

export function isPleniuSentryEnabled(config: Pick<PleniuSentryInitConfig, 'production' | 'dsn'>): boolean {
  return Boolean(config.production && config.dsn?.trim());
}

/**
 * Debe ejecutarse antes de `bootstrapApplication` cuando Sentry está habilitado.
 * En desarrollo o sin DSN no hace nada (sin red a Sentry).
 */
export function initPleniuSentry(config: PleniuSentryInitConfig): void {
  if (!isPleniuSentryEnabled(config)) {
    return;
  }

  const dsn = config.dsn!.trim();
  const environment =
    config.environment ?? (config.production ? 'production' : 'development');
  const tracesSampleRate =
    config.tracesSampleRate ?? (config.production ? 0.2 : 0);

  Sentry.init({
    dsn,
    environment,
    release: config.release,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate,
    sendDefaultPii: false,
    initialScope: (scope: Scope) => {
      scope.setTag('portal', config.portal);
      return scope;
    },
  });
}
