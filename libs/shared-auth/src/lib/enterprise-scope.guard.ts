import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

export const enterpriseScopeGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (sessionStore.claims()?.enterprise_id) {
    return true;
  }

  void router.navigate(['/auth/forbidden']);
  return false;
};

/** Rutas B2C con productos Core filtrados por `customer_id` (Customer activo). */
export const personalScopeGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const cid = sessionStore.claims()?.customer_id?.trim();
  if (!cid) {
    void router.navigate(['/app/dashboard']);
    return false;
  }
  return true;
};
