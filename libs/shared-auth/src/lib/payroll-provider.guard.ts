import { InjectionToken, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PayrollProviderContext {
  load(): Observable<unknown>;
  isPayrollProvider(): boolean | null;
}

export const PAYROLL_PROVIDER_CONTEXT = new InjectionToken<PayrollProviderContext>(
  'PAYROLL_PROVIDER_CONTEXT',
);

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
