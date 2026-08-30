import {
  APP_INITIALIZER,
  DestroyRef,
  EnvironmentInjector,
  ErrorHandler,
  inject,
  Provider,
  runInInjectionContext,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as SentryAngular from '@sentry/angular';
import * as SentryBrowser from '@sentry/browser';

import type { PleniuObservabilityConfig, PleniuObservabilityUserContext } from './pleniu-observability.types';
import { isPleniuGlitchTipEnabled } from './pleniu-glitchtip';

function applyGlitchTipUserFromClaims(c: PleniuObservabilityUserContext | null): void {
  if (!SentryBrowser.getClient()) {
    return;
  }
  const scope = SentryBrowser.getGlobalScope();
  if (c?.user_id) {
    SentryBrowser.setUser({
      id: c.user_id,
      username: c.role,
    });
    scope.setTag('enterprise_id', c.enterprise_id ?? '');
  } else {
    SentryBrowser.setUser(null);
    scope.setTag('enterprise_id', '');
  }
}

/**
 * Providers de Angular para ErrorHandler + contexto de usuario en GlitchTip.
 * Vacío si GlitchTip no está habilitado.
 *
 * No incluye `TraceService` de Sentry porque las trazas se manejan vía
 * OpenTelemetry (`pleniuOtelProviders`).
 */
export function pleniuGlitchTipProviders(config: PleniuObservabilityConfig): Provider[] {
  if (!isPleniuGlitchTipEnabled(config)) {
    return [];
  }

  return [
    { provide: ErrorHandler, useValue: SentryAngular.createErrorHandler({ showDialog: false, logErrors: false }) },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const getUserContext = config.getUserContext;
        if (!getUserContext) {
          return () => undefined;
        }
        const env = inject(EnvironmentInjector);
        const destroyRef = inject(DestroyRef);
        runInInjectionContext(env, () => {
          getUserContext()
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe((c) => applyGlitchTipUserFromClaims(c));
        });
        return () => undefined;
      },
    },
  ];
}
