import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';
import { signInPathForPortal } from './sign-in-path';

/** Rutas de plataforma admin: requiere JWT usuario + `admin_access_token` y rol operativo de plataforma. */
export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const loginPath = signInPathForPortal(inject(PORTAL_APP));

  if (!store.userToken()) {
    void router.navigate([loginPath], { queryParams: { returnUrl: state.url } });
    return false;
  }
  if (store.claims()?.password_must_change) {
    void router.navigate(['/staff/access/change-password'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  if (!store.adminToken()) {
    void router.navigate(['/auth/forbidden']);
    return false;
  }
  // Only enforce role when claims are hydrated. If claims are absent (e.g. a
  // transient validate error on reload) but the admin token is present, allow
  // through—the backend enforces authorization on every API call.
  const platformRoles = new Set(['admin', 'sre', 'devops']);
  if (store.claims() !== null && !platformRoles.has(String(store.claims()?.role ?? '').toLowerCase())) {
    void router.navigate(['/auth/forbidden']);
    return false;
  }
  return true;
};

