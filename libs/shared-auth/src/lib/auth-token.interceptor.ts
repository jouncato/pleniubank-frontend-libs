import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG, type ApiConfig } from '@pleniu/shared-http';
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
    url.includes('/auth/confirm-password-reset') ||
    url.includes('/health')
  );
}

function startsWithConfiguredBase(url: string, baseUrl?: string): boolean {
  if (!baseUrl) {
    return false;
  }
  const base = baseUrl.replace(/\/$/, '');
  return url === base || url.startsWith(`${base}/`);
}

function isCoreApiRoute(url: string, apiConfig: ApiConfig | null): boolean {
  return startsWithConfiguredBase(url, apiConfig?.coreBaseUrl) || url.includes('/api/core/');
}

function isIdentityAdminApiRoute(url: string, apiConfig: ApiConfig | null): boolean {
  const isIdentityScoped = startsWithConfiguredBase(url, apiConfig?.identityBaseUrl);
  const isIdentityAdminPath =
    url.includes('/api/v1/admin/') ||
    url.includes('/api/v1/enterprise/') ||
    url.includes('/api/v1/sub-enterprise/') ||
    url.includes('/api/v1/economic-sectors');

  if (isIdentityScoped) {
    return isIdentityAdminPath;
  }
  if (isCoreApiRoute(url, apiConfig)) {
    return false;
  }
  return isIdentityAdminPath;
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

  const u = req.url;
  // Identity `POST /auth/validate` (usado por Core) solo decodifica el access_token principal (JWT_SECRET_KEY).
  // `admin_access_token` firma con ADMIN_JWT_SECRET_KEY: sirve para la API admin de Identity (`/api/v1/admin/*`),
  // endpoints de enterprise management (`/api/v1/enterprise/`, `/api/v1/sub-enterprise/`) y economic-sectors.
  // Core (platform, internal-accounts, audit) debe recibir el JWT de sesión normal.
  const isIdentityAdminApi = isIdentityAdminApiRoute(u, apiConfig);
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
