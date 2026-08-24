import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';
import { isValidReturnUrl } from './return-url';

export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const portal = inject(PORTAL_APP);

  if (!sessionStore.isAuthenticated()) {
    return true;
  }

  if (portal === 'backoffice' && sessionStore.claims()?.password_must_change) {
    void router.navigate(['/staff/access/change-password']);
    return false;
  }

  if (portal === 'customer' && sessionStore.claims()?.password_must_change) {
    void router.navigate(['/app/change-password']);
    return false;
  }

  const returnUrl = route.queryParamMap.get('returnUrl');
  const defaultDest = portal === 'backoffice' ? '/admin/dashboard' : '/app/dashboard';
  void router.navigateByUrl(isValidReturnUrl(returnUrl) ? returnUrl : defaultDest);
  return false;
};
