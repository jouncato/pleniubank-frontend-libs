import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG } from '@pleniu/shared-http';
import { SessionStore } from './session-store.service';
import { SESSION_STRATEGY } from './session-strategy.token';
import { isIdentityAdminApiRoute } from './interceptor-utils';

function isPublicIdentityRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify-email') ||
    url.includes('/auth/resend-email-otp') ||
    url.includes('/auth/verify-phone') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/confirm-password-reset') ||
    url.includes('/health')
  );
}

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const strategy = inject(SESSION_STRATEGY);

  if (strategy === 'httpOnlyCookie') {
    return next(req.clone({ withCredentials: true }));
  }

  const sessionStore = inject(SessionStore);
  const apiConfig = inject(API_CONFIG, { optional: true });

  if (isPublicIdentityRoute(req.url)) {
    return next(req);
  }

  // Identity `POST /auth/validate` (usado por Core) solo decodifica el access_token principal (JWT_SECRET_KEY).
  // `admin_access_token` firma con ADMIN_JWT_SECRET_KEY: sirve para la API admin de Identity (`/api/v1/admin/*`),
  // endpoints de enterprise management (`/api/v1/enterprise/`, `/api/v1/sub-enterprise/`) y economic-sectors.
  // Core (platform, internal-accounts, audit) debe recibir el JWT de sesión normal.
  const isIdentityAdminApi = isIdentityAdminApiRoute(req.url, apiConfig);
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
