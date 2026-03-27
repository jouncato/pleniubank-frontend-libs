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
