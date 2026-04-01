import { HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG, type ApiConfig } from 'shared-http';
import { SESSION_STRATEGY, type SessionStrategy } from './session-strategy.token';

/**
 * Pide `GET /api/v1/auth/csrf` a Identity con credenciales para fijar `pleniu_csrf`
 * antes del primer POST mutante al Core cuando `CSRF_DOUBLE_SUBMIT_ENABLED`.
 *
 * Sin esto, un usuario con solo cookies HttpOnly (sin login en esta pestaña) puede carecer de CSRF hasta el primer refresh/login.
 */
export function createIdentityCsrfBootstrapFn(
  http: HttpClient,
  api: ApiConfig,
  strategy: SessionStrategy,
): () => Promise<void> {
  return async () => {
    if (strategy !== 'httpOnlyCookie') {
      return;
    }
    const base = api.identityBaseUrl.replace(/\/$/, '');
    const url = `${base}/api/v1/auth/csrf`;
    try {
      await firstValueFrom(http.get<{ status?: string }>(url, { withCredentials: true }));
    } catch {
      // Identity apagado o AUTH_COOKIE_ENABLED=false: no bloquear arranque de la SPA
    }
  };
}

/** Provider conveniente para `app.config` (multi APP_INITIALIZER). */
export const IDENTITY_CSRF_COOKIE_BOOTSTRAP_PROVIDER: Provider = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: createIdentityCsrfBootstrapFn,
  deps: [HttpClient, API_CONFIG, SESSION_STRATEGY],
};
