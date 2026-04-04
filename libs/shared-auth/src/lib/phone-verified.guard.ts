import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

/** Prefijo de ruta accesible sin teléfono verificado (HU-7: perfil y CTA de verificación). */
export const PHONE_VERIFICATION_OPTIONAL_PATH_PREFIX = '/app/personal/profile';

/**
 * Bloquea rutas de producto B2C (sin empresa) hasta que `phone_verified` sea true en claims.
 * No aplica a backoffice/public ni a usuarios con `enterprise_id`.
 * Excepción: `/app/personal/profile` permite entrar para ver estado y enlace a verificación.
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

  const pathOnly = state.url.split('?')[0] ?? state.url;
  if (
    pathOnly === PHONE_VERIFICATION_OPTIONAL_PATH_PREFIX ||
    pathOnly.startsWith(`${PHONE_VERIFICATION_OPTIONAL_PATH_PREFIX}/`)
  ) {
    return true;
  }

  void router.navigate(['/app/verify-phone'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
