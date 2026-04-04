import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';
import { SESSION_STRATEGY } from './session-strategy.token';

function isPublicIdentityRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify-email') ||
    url.includes('/auth/resend-email-otp') ||
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

  const u = req.url;
  // Identity `POST /auth/validate` (usado por Core) solo decodifica el access_token principal (JWT_SECRET_KEY).
  // `admin_access_token` firma con ADMIN_JWT_SECRET_KEY: sirve para la API admin de Identity (`/api/v1/admin/*`),
  // pero Core (platform, internal-accounts, audit) debe recibir el JWT de sesión normal.
  const isIdentityAdminApi = u.includes('/api/v1/admin/');
  const token = isIdentityAdminApi
    ? (sessionStore.adminToken() ?? sessionStore.userToken())
    : sessionStore.userToken();

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
