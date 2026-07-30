import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

/** Prefijo de ruta accesible sin teléfono verificado (HU-7: perfil y CTA de verificación). */
export const PHONE_VERIFICATION_OPTIONAL_PATH_PREFIX = '/app/personal/profile';

/**
 * Bloquea rutas de producto B2C (sin empresa) hasta que `phone_verified` sea true en claims.
 * No aplica a backoffice/public ni a usuarios cuyo rol no sea `customer`: el backend
 * (`POST /auth/phone-challenge`) rechaza con 403 "Only customer accounts can start phone
 * verification" para cualquier otro rol, así que el guard debe alinearse con esa misma
 * regla en vez de con `enterprise_id` — ese claim puede venir ausente en cuentas
 * `enterprise_operator`/`enterprise_admin`/`enterprise_principal` aunque el rol ya diga
 * que no son B2C, dejándolas atrapadas en /app/verify-phone sin poder pedir el código.
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
  if (claims?.enterprise_id || claims?.role !== 'customer') {
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
