import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

/** Asegura que `enterpriseId` de la ruta coincide con `claims.enterprise_id` (K-03). */
export const enterpriseIdMatchesSessionGuard: CanActivateFn = (route) => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const paramId = route.paramMap.get('enterpriseId');
  const claimId = store.claims()?.enterprise_id;
  if (paramId && claimId && paramId === claimId) {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};
