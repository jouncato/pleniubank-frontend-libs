import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { mapHttpError } from 'shared-http';
import { AUTH_REFRESH_HANDLER } from './auth-refresh.token';
import { SessionStore } from './session-store.service';

const retryToken$ = new BehaviorSubject<string | null>(null);

function shouldRefresh(error: HttpErrorResponse): boolean {
  const code = error.error?.errors?.[0]?.code;
  return error.status === 401 && code === 'TOKEN_EXPIRED';
}

function cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function logoutAndRedirect(sessionStore: SessionStore, router: Router): Observable<never> {
  sessionStore.clear();
  void router.navigate(['/onboarding/party/access/login']);
  return throwError(() => new Error('Session expired'));
}

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStore);
  const refreshHandler = inject(AUTH_REFRESH_HANDLER, { optional: true });
  const router = inject(Router);

  if (!refreshHandler || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !shouldRefresh(error)) {
        return throwError(() => mapHttpError(error));
      }

      if (sessionStore.isRefreshing()) {
        return retryToken$.pipe(
          filter((token): token is string => Boolean(token)),
          take(1),
          switchMap((token) => next(cloneWithToken(req, token))),
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
          retryToken$.next(response.access_token);
          return next(cloneWithToken(req, response.access_token));
        }),
        catchError(() => logoutAndRedirect(sessionStore, router)),
        finalize(() => sessionStore.setRefreshing(false)),
      );
    }),
  );
};

