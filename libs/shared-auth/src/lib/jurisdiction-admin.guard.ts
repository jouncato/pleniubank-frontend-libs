import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

/**
 * Alineado con Core `_require_legal_admin`: roles `legal_admin` y `admin` pueden
 * gestionar el módulo Super Admin de jurisdicciones (ADR-016 / LB-ST-218).
 *
 * `legal_admin` aún no es emitible por Identity para logins de staff — este
 * guard ya lo reconoce para que empiece a funcionar automáticamente en cuanto
 * Identity emita el rol, sin requerir otro cambio de frontend.
 */
export const jurisdictionAdminGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const role = store.claims()?.role;
  if (role === 'admin' || role === 'legal_admin') {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};
