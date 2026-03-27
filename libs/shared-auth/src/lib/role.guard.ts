import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';

export const roleGuard: CanActivateFn = (route) => {
  const requiredRole = route.data['requiredRole'] as string | undefined;
  if (!requiredRole) {
    return true;
  }

  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (sessionStore.hasRole(requiredRole)) {
    return true;
  }

  void router.navigate(['/auth/forbidden']);
  return false;
};
