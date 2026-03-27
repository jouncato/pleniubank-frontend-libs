import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SESSION_STRATEGY } from './session-strategy.token';

function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)pleniu_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Adds X-CSRF-Token header to mutating requests when using cookie-based sessions.
 * Only active when SESSION_STRATEGY is 'httpOnlyCookie'.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const strategy = inject(SESSION_STRATEGY);

  if (strategy !== 'httpOnlyCookie') {
    return next(req);
  }

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isMutating) {
    return next(req);
  }

  const csrfToken = getCsrfTokenFromCookie();
  if (!csrfToken) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-CSRF-Token': csrfToken },
    }),
  );
};
