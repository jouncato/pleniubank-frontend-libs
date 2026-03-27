import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

/** Rutas de plataforma admin: requiere JWT usuario + `admin_access_token` y claim `role === 'admin'`. */
export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(SessionStore);
  const router = inject(Router);

  if (!store.userToken()) {
    void router.navigate(['/onboarding/party/access/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  if (!store.adminToken() || store.claims()?.role !== 'admin') {
    void router.navigate(['/auth/forbidden']);
    return false;
  }
  return true;
};

