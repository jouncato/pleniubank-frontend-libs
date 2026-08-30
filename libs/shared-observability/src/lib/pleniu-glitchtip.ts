import * as Sentry from '@sentry/browser';
import type { Scope } from '@sentry/core';

import type { PleniuObservabilityConfig } from './pleniu-observability.types';

export function isPleniuGlitchTipEnabled(
  config: Pick<PleniuObservabilityConfig, 'glitchTipEnabled' | 'glitchTipDsn'>,
): boolean {
  return Boolean(config.glitchTipEnabled && config.glitchTipDsn?.trim());
}

/**
 * Inicializa el SDK de Sentry apuntando a GlitchTip (compatible con Sentry API).
 * Debe ejecutarse antes de `bootstrapApplication` cuando GlitchTip está habilitado.
 * En desarrollo o sin DSN no hace nada (sin red a GlitchTip).
 *
 * Las trazas de performance se delegan a OpenTelemetry (tracesSampleRate: 0)
 * para evitar duplicar instrumentación.
 */
export function initPleniuGlitchTip(config: PleniuObservabilityConfig): void {
  if (!isPleniuGlitchTipEnabled(config)) {
    return;
  }

  const dsn = config.glitchTipDsn.trim();
  const environment = config.production ? 'production' : 'development';

  Sentry.init({
    dsn,
    environment,
    release: config.glitchTipRelease,
    // OTel maneja tracing; Sentry solo para errores y breadcrumbs
    integrations: [],
    tracesSampleRate: 0,
    sendDefaultPii: false,
    initialScope: (scope: Scope) => {
      scope.setTag('portal', config.portal);
      return scope;
    },
  });
}
