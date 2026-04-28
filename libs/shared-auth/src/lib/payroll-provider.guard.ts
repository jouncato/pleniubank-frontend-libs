import { InjectionToken, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * @deprecated Since v0.5.0. This context is specific to the payroll-advance (libranza) product model.
 * With the BIAN migration, employer-specific routing will be handled via `LendingArrangement.parties`
 * (partyRole EMPLOYER). Sunset: 2026-12-31.
 * See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export interface PayrollProviderContext {
  load(): Observable<unknown>;
  isPayrollProvider(): boolean | null;
}

/**
 * @deprecated Since v0.5.0. Use party-role based access control via `LendingArrangementService`.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export const PAYROLL_PROVIDER_CONTEXT = new InjectionToken<PayrollProviderContext>(
  'PAYROLL_PROVIDER_CONTEXT',
);

/**
 * @deprecated Since v0.5.0. This guard is payroll-advance product specific.
 * It will be replaced by a generic lending-party guard in LB-ST-030.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export const payrollProviderGuard: CanActivateFn = () => {
  const router = inject(Router);
  const context = inject(PAYROLL_PROVIDER_CONTEXT, { optional: true });

  if (!context) {
    return true;
  }

  return context.load().pipe(
    map(() => {
      const isProvider = context.isPayrollProvider();
      if (isProvider === false) {
        void router.navigate(['/app/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true)),
  );
};
