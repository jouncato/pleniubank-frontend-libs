import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval, EMPTY } from 'rxjs';
import { catchError, exhaustMap, filter, takeUntil } from 'rxjs/operators';
import { ApiHttpError } from '@pleniu/shared-http';

import { AUTH_VALIDATE_HANDLER } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';
import { signInPathForPortal } from './sign-in-path';

export type SessionTerminationCode = 'SESSION_REPLACED' | 'SESSION_REVOKED' | 'SESSION_REQUIRED' | 'SESSION_EXPIRED';

const TERMINATION_CODES = new Set<string>([
  'SESSION_REPLACED',
  'SESSION_REVOKED',
  'SESSION_REQUIRED',
  'SESSION_EXPIRED',
]);

const HEARTBEAT_INTERVAL_MS = 15_000;

function errorCode(error: unknown): string | null {
  if (error instanceof ApiHttpError) {
    return error.errors[0]?.code ?? null;
  }
  if (error instanceof HttpErrorResponse) {
    const errors = error.error?.errors;
    return Array.isArray(errors) && errors[0]?.code ? String(errors[0].code) : null;
  }
  return null;
}

export function sessionTerminationCode(error: unknown): SessionTerminationCode | null {
  const code = errorCode(error);
  return TERMINATION_CODES.has(code ?? '') ? (code as SessionTerminationCode) : null;
}

export function isSessionTerminationCode(error: unknown): boolean {
  return sessionTerminationCode(error) !== null;
}

@Injectable({ providedIn: 'root' })
export class SessionTerminationService {
  private readonly session = inject(SessionStore);
  private readonly validate = inject(AUTH_VALIDATE_HANDLER);
  private readonly router = inject(Router);
  private readonly portal = inject(PORTAL_APP);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private terminating = false;
  private readonly _heartbeatDegraded = signal(false);
  readonly heartbeatDegraded = this._heartbeatDegraded.asReadonly();

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    interval(HEARTBEAT_INTERVAL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.session.isAuthenticated()),
        exhaustMap(() =>
          this.validate().pipe(
            catchError((error: unknown) => {
              const code = errorCode(error);
              if (TERMINATION_CODES.has(code ?? '')) {
                this.terminate(code as SessionTerminationCode);
              } else if (error instanceof ApiHttpError && error.status >= 500) {
                this._heartbeatDegraded.set(true);
              }
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe({
        next: (claims) => {
          this.session.setClaims(claims);
          this._heartbeatDegraded.set(false);
        },
      });
  }

  terminate(code: SessionTerminationCode, returnUrl?: string): void {
    if (this.terminating) {
      return;
    }
    this.terminating = true;
    this.session.setTerminationReason(code);
    this.session.clear();

    const safeReturnUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : undefined;
    void this.router.navigate([signInPathForPortal(this.portal)], {
      queryParams: {
        sessionTermination: code,
        ...(safeReturnUrl ? { returnUrl: safeReturnUrl } : {}),
      },
    }).finally(() => {
      this.terminating = false;
    });
  }
}
