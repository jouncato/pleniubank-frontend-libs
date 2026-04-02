import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

/**
 * Bloquea rutas de producto B2C (sin empresa) hasta que `phone_verified` sea true en claims.
 * No aplica a backoffice/public ni a usuarios con `enterprise_id`.
 */
export const phoneVerifiedGuard: CanActivateFn = (_route, state) => {
  const portal = inject(PORTAL_APP);
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (portal !== 'customer') {
    return true;
  }

  const claims = sessionStore.claims();
  if (claims?.enterprise_id) {
    return true;
  }
  if (claims?.phone_verified === true) {
    return true;
  }

  void router.navigate(['/app/verify-phone'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
