import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

/**
 * Alineado con Core `check_audit_access`: roles `admin` y `auditor` pueden leer audit logs.
 */
export const auditAccessGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const role = store.claims()?.role;
  if (role === 'admin' || role === 'auditor') {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};
