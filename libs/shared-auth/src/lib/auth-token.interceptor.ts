import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';
import { SESSION_STRATEGY } from './session-strategy.token';

function isPublicIdentityRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify-email') ||
    url.includes('/auth/verify-phone') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/health')
  );
}

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const strategy = inject(SESSION_STRATEGY);

  if (strategy === 'httpOnlyCookie') {
    return next(req.clone({ withCredentials: true }));
  }

  const sessionStore = inject(SessionStore);

  if (isPublicIdentityRoute(req.url)) {
    return next(req);
  }

  const isAdminRoute = req.url.includes('/admin/');
  const token = isAdminRoute ? sessionStore.adminToken() : sessionStore.userToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
