import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SESSION_CLAIMS_TTL_MS, SessionStore } from './session-store.service';
import { AUTH_VALIDATE_HANDLER } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { signInPathForPortal } from './sign-in-path';

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
    catchError(() => {
      sessionStore.clear();
      void router.navigate([loginPath], { queryParams: { returnUrl: state.url } });
      return of(false);
    }),
  );
};

