import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { API_CONFIG, type ApiConfig, mapHttpError } from '@pleniu/shared-http';
import { AUTH_REFRESH_HANDLER } from './auth-refresh.token';
import { PORTAL_APP } from './portal-app.token';
import { SESSION_STRATEGY } from './session-strategy.token';
import { SessionStore } from './session-store.service';
import { signInPathForPortal } from './sign-in-path';

const retryToken$ = new BehaviorSubject<string | null>(null);

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

function isIdentityAdminRoute(url: string, apiConfig: ApiConfig | null): boolean {
  const isIdentityScoped = startsWithConfiguredBase(url, apiConfig?.identityBaseUrl);
  const isIdentityAdminPath =
    url.includes('/api/v1/admin/') ||
    url.includes('/api/v1/enterprise/') ||
    url.includes('/api/v1/sub-enterprise/');

  if (isIdentityScoped) {
    return isIdentityAdminPath;
  }
  if (isCoreApiRoute(url, apiConfig)) {
    return false;
  }
  return isIdentityAdminPath;
}

function shouldRefresh(
  error: HttpErrorResponse,
  req: HttpRequest<unknown>,
  apiConfig: ApiConfig | null,
): boolean {
  if (error.status !== 401) {
    return false;
  }
  const code = error.error?.errors?.[0]?.code;
  if (code === 'TOKEN_EXPIRED') {
    return true;
  }
  if (code === 'Admin token has expired' || code === 'ADMIN_TOKEN_EXPIRED') {
    return true;
  }
  if (isIdentityAdminRoute(req.url, apiConfig)) {
    return true;
  }
  return false;
}

function cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function cloneForCookieRetry(req: HttpRequest<unknown>): HttpRequest<unknown> {
  return req.clone({ withCredentials: true });
}

function logoutAndRedirect(
  sessionStore: SessionStore,
  router: Router,
  loginPath: string,
): Observable<never> {
  sessionStore.clear();
  void router.navigate([loginPath]);
  return throwError(() => new Error('Session expired'));
}

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStore);
  const refreshHandler = inject(AUTH_REFRESH_HANDLER, { optional: true });
  const router = inject(Router);
  const strategy = inject(SESSION_STRATEGY);
  const loginPath = signInPathForPortal(inject(PORTAL_APP));
  const apiConfig = inject(API_CONFIG, { optional: true });
  const cookieSession = strategy === 'httpOnlyCookie';

  const isPublicEndpoint =
    req.url.includes('/auth/refresh') ||
    req.url.endsWith('/health') ||
    req.url.endsWith('/readiness');
  if (!refreshHandler || isPublicEndpoint) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !shouldRefresh(error, req, apiConfig)) {
        return throwError(() => mapHttpError(error));
      }

      if (cookieSession) {
        if (sessionStore.isRefreshing()) {
          return retryToken$.pipe(
            filter((t): t is string => t === '__cookie__'),
            take(1),
            switchMap(() => next(cloneForCookieRetry(req))),
          );
        }
        sessionStore.setRefreshing(true);
        retryToken$.next(null);
        return refreshHandler().pipe(
          switchMap(() => {
            retryToken$.next('__cookie__');
            return next(cloneForCookieRetry(req));
          }),
          catchError(() => logoutAndRedirect(sessionStore, router, loginPath)),
          finalize(() => sessionStore.setRefreshing(false)),
        );
      }

      if (sessionStore.isRefreshing()) {
        return retryToken$.pipe(
          filter((token): token is string => Boolean(token)),
          take(1),
          switchMap(() => {
            const isAdminRoute = isIdentityAdminRoute(req.url, apiConfig);
            const token =
              isAdminRoute && sessionStore.adminToken()
                ? sessionStore.adminToken()!
                : (sessionStore.userToken() ?? retryToken$.getValue() ?? '');
            return next(cloneWithToken(req, token));
          }),
        );
      }

      sessionStore.setRefreshing(true);
      retryToken$.next(null);

      return refreshHandler().pipe(
        switchMap((response) => {
          sessionStore.setUserToken(response.access_token);
          if (response.refresh_token) {
            sessionStore.setRefreshToken(response.refresh_token);
          }
          if (response.admin_access_token != null) {
            sessionStore.setAdminToken(response.admin_access_token);
          }
          retryToken$.next(response.access_token);
          const isAdminRetryRoute = isIdentityAdminRoute(req.url, apiConfig);
          const retryToken = response.admin_access_token && isAdminRetryRoute
            ? response.admin_access_token
            : response.access_token;
          return next(cloneWithToken(req, retryToken));
        }),
        catchError(() => logoutAndRedirect(sessionStore, router, loginPath)),
        finalize(() => sessionStore.setRefreshing(false)),
      );
    }),
  );
};

