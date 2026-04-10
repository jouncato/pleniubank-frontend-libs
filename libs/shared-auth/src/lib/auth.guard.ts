import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHttpError } from '@pleniu/shared-http';
import { SESSION_CLAIMS_TTL_MS, SessionStore } from './session-store.service';
import { AUTH_VALIDATE_HANDLER } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { signInPathForPortal } from './sign-in-path';

/** Status codes that indicate transient infrastructure failures, not auth rejections. */
const TRANSIENT_STATUSES = new Set([0, 502, 503, 504]);

function isTransientError(err: unknown): boolean {
  if (err instanceof ApiHttpError) {
    return TRANSIENT_STATUSES.has(err.status);
  }
  if (err != null && typeof err === 'object' && 'status' in err) {
    return TRANSIENT_STATUSES.has((err as { status: number }).status);
  }
  return false;
}

function claimsAreFresh(store: SessionStore): boolean {
  const c = store.claims();
  const at = store.claimsValidatedAt();
  if (!c || at === null) {
    return false;
  }
  return Date.now() - at < SESSION_CLAIMS_TTL_MS;
}

export const authGuard: CanActivateFn = (route, state) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const validateHandler = inject(AUTH_VALIDATE_HANDLER);
  const loginPath = signInPathForPortal(inject(PORTAL_APP));

  if (!sessionStore.userToken()) {
    void router.navigate([loginPath], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  if (claimsAreFresh(sessionStore)) {
    return true;
  }

  return validateHandler().pipe(
    map((claims) => {
      sessionStore.setClaims(claims);
      return true;
    }),
    catchError((err) => {
      if (isTransientError(err)) {
        // Transient network error (status 0, 50x): extend TTL on existing claims
        // so subsequent navigations don't loop back into validate immediately.
        // The backend enforces auth on every real API call.
        const existing = sessionStore.claims();
        if (existing) {
          sessionStore.setClaims(existing);
        }
        return of(true);
      }
      // Genuine auth rejection (401, 403, etc.): wipe the session.
      sessionStore.clear();
      void router.navigate([loginPath], { queryParams: { returnUrl: state.url } });
      return of(false);
    }),
  );
};

