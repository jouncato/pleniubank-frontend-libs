import {
  APP_INITIALIZER,
  DestroyRef,
  EnvironmentInjector,
  ErrorHandler,
  inject,
  Provider,
  runInInjectionContext,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import * as SentryAngular from '@sentry/angular';
import * as SentryBrowser from '@sentry/browser';
import { SessionStore, type SessionClaims } from '@pleniu/shared-auth';

import type { PleniuSentryInitConfig } from './pleniu-sentry.types';
import { isPleniuSentryEnabled } from './init-pleniu-sentry';

function applySentryUserFromClaims(c: SessionClaims | null): void {
  if (!SentryBrowser.getClient()) {
    return;
  }
  const scope = SentryBrowser.getGlobalScope();
  if (c?.user_id) {
    SentryBrowser.setUser({
      id: c.user_id,
      email: c.email,
      username: c.role,
    });
    scope.setTag('enterprise_id', c.enterprise_id ?? '');
  } else {
    SentryBrowser.setUser(null);
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
    { provide: ErrorHandler, useValue: SentryAngular.createErrorHandler({ showDialog: false, logErrors: false }) },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const trace = inject(SentryAngular.TraceService);
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
        const destroyRef = inject(DestroyRef);
        runInInjectionContext(env, () => {
          toObservable(store.claims)
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe((c) => applySentryUserFromClaims(c));
        });
        return () => undefined;
      },
    },
  ];
}
