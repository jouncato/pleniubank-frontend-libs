import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

export const guestGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const portal = inject(PORTAL_APP);

  if (!sessionStore.userToken()) {
    return true;
  }

  if (portal === 'backoffice' && sessionStore.claims()?.password_must_change) {
    void router.navigate(['/staff/access/change-password']);
    return false;
  }

  const redirectTo = portal === 'backoffice' ? '/admin/dashboard' : '/app/dashboard';
  void router.navigate([redirectTo]);
  return false;
};
