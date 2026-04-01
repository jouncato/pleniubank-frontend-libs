import { APP_INITIALIZER, EnvironmentInjector, ErrorHandler, inject, Provider, runInInjectionContext } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import * as Sentry from '@sentry/angular';
import { SessionStore, type SessionClaims } from '@pleniu/shared-auth';

import type { PleniuSentryInitConfig } from './pleniu-sentry.types';
import { isPleniuSentryEnabled } from './init-pleniu-sentry';

function applySentryUserFromClaims(c: SessionClaims | null): void {
  if (!Sentry.getClient()) {
    return;
  }
  const scope = Sentry.getGlobalScope();
  if (c?.user_id) {
    Sentry.setUser({
      id: c.user_id,
      email: c.email,
      username: c.role,
    });
    scope.setTag('enterprise_id', c.enterprise_id ?? '');
  } else {
    Sentry.setUser(null);
    scope.setTag('enterprise_id', '');
  }
}

/**
 * Providers de Angular para ErrorHandler + arranque de `TraceService` (navegación) + usuario Sentry.
 * Vacío si Sentry no está habilitado (misma regla que `initPleniuSentry`).
 */
export function pleniuSentryProviders(config: PleniuSentryInitConfig): Provider[] {
  if (!isPleniuSentryEnabled(config)) {
    return [];
  }

  return [
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler({ showDialog: false, logErrors: false }) },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const trace = inject(Sentry.TraceService);
        void trace;
        return () => undefined;
      },
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const store = inject(SessionStore);
        const env = inject(EnvironmentInjector);
        runInInjectionContext(env, () => {
          toObservable(store.claims).subscribe((c) => applySentryUserFromClaims(c));
        });
        return () => undefined;
      },
    },
  ];
}
