import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

/**
 * Alineado con Core `_PLATFORM_ROLES` + `check_platform_only_internal_ops`:
 * solo `admin` y `employee` (no `auditor`).
 */
export const platformInternalOpsGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const role = store.claims()?.role;
  if (role === 'admin' || role === 'employee') {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};
